/**
 * AM Business Platform — Universal Durable Persistence Registry
 * Wave 1 / Task P0-01
 *
 * Implements authoritative SQLite-backed System of Record persistence with:
 * - Reactive write-through proxies for collections and deep nested entities
 * - Crash and restart survival
 * - Atomic transactions with rollback support
 * - Clean decoupling from mock data
 */

import { PilotDatabaseService } from './pilotDatabase';

/**
 * Resolves a unique, stable primary key for any entity
 */
export function resolveEntityId(entity: any): string {
  if (!entity || typeof entity !== 'object') {
    return `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
  return (
    entity.id ||
    entity.code ||
    entity.sku ||
    entity.key ||
    entity.number ||
    entity.ruleId ||
    entity.journalNumber ||
    entity.receiptNumber ||
    entity.orderNumber ||
    entity.invoiceNumber ||
    entity.voucherNumber ||
    entity.documentNumber ||
    entity.idempotencyKey ||
    `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );
}

/**
 * Creates a reactive proxy around an entity and its nested properties/arrays
 * so that any mutation immediately writes through to SQLite.
 */
export function makeDurableEntity(
  collection: string,
  entity: any,
  rootEntity: any,
  pilotDb: PilotDatabaseService
): any {
  if (!entity || typeof entity !== 'object') return entity;

  const root = rootEntity || entity;

  // Make sure the root entity has an ID
  if (!root.id) {
    root.id = resolveEntityId(root);
  }

  return new Proxy(entity, {
    get(target, prop, receiver) {
      const val = Reflect.get(target, prop, receiver);
      if (val && typeof val === 'object') {
        if (Array.isArray(val)) {
          return new Proxy(val, {
            get(aTarget, aProp, aReceiver) {
              if (aProp === 'push' || aProp === 'unshift') {
                return function (...args: any[]) {
                  const res = Array.prototype[aProp as any].apply(aTarget, args);
                  try {
                    pilotDb.saveEntity(collection, root);
                  } catch (err) {
                    console.error(`[DurablePersistence] Write-through failure on array ${String(aProp)} in ${collection}:`, err);
                  }
                  return res;
                };
              }
              if (aProp === 'splice') {
                return function (...args: any[]) {
                  const res = Array.prototype.splice.apply(aTarget, args as [number, number, ...any[]]);
                  try {
                    pilotDb.saveEntity(collection, root);
                  } catch (err) {
                    console.error(`[DurablePersistence] Write-through failure on splice in ${collection}:`, err);
                  }
                  return res;
                };
              }
              const aVal = Reflect.get(aTarget, aProp, aReceiver);
              if (aVal && typeof aVal === 'object') {
                return makeDurableEntity(collection, aVal, root, pilotDb);
              }
              return aVal;
            },
            set(aTarget, aProp, aVal, aReceiver) {
              const res = Reflect.set(aTarget, aProp, aVal, aReceiver);
              try {
                pilotDb.saveEntity(collection, root);
              } catch (err) {
                console.error(`[DurablePersistence] Write-through failure on array set in ${collection}:`, err);
              }
              return res;
            }
          });
        }
        return makeDurableEntity(collection, val, root, pilotDb);
      }
      return val;
    },
    set(target, prop, value, receiver) {
      const res = Reflect.set(target, prop, value, receiver);
      try {
        pilotDb.saveEntity(collection, root);
      } catch (err) {
        console.error(`[DurablePersistence] Write-through failure on property set ${String(prop)} in ${collection}:`, err);
      }
      return res;
    }
  });
}

/**
 * Wraps a collection array in a Proxy that traps additions, replacements,
 * and element accesses to ensure durable persistence across restarts.
 */
export function makeDurableArray<T extends Record<string, any>>(
  collection: string,
  arr: T[],
  pilotDb: PilotDatabaseService
): T[] {
  return new Proxy(arr, {
    get(target, prop, receiver) {
      if (prop === 'unshift' || prop === 'push') {
        return function (...items: T[]) {
          const res = Array.prototype[prop as any].apply(target, items);
          for (const item of items) {
            if (item && typeof item === 'object') {
              if (!(item as any).id) {
                (item as any).id = resolveEntityId(item);
              }
              try {
                pilotDb.saveEntity(collection, item);
              } catch (err) {
                console.error(`[DurablePersistence] Error persisting ${collection} on ${String(prop)}:`, err);
              }
            }
          }
          return res;
        };
      }
      if (prop === 'splice') {
        return function (start: number, deleteCount?: number, ...items: T[]) {
          const removed = Array.prototype.splice.apply(target, [start, deleteCount as number, ...items]);
          for (const r of removed) {
            if (r && typeof r === 'object') {
              const id = resolveEntityId(r);
              try {
                pilotDb.deleteEntity(collection, id);
              } catch (err) {
                console.error(`[DurablePersistence] Error deleting entity ${id} from ${collection} on splice:`, err);
              }
            }
          }
          for (const item of items) {
            if (item && typeof item === 'object') {
              if (!(item as any).id) {
                (item as any).id = resolveEntityId(item);
              }
              try {
                pilotDb.saveEntity(collection, item);
              } catch (err) {
                console.error(`[DurablePersistence] Error persisting new entity in ${collection} on splice:`, err);
              }
            }
          }
          return removed;
        };
      }

      const val = Reflect.get(target, prop, receiver);

      // Wrap index accesses in durable entity proxy
      if (typeof prop === 'string' && /^\d+$/.test(prop) && val && typeof val === 'object') {
        return makeDurableEntity(collection, val, val, pilotDb);
      }

      return val;
    },
    set(target, prop, value, receiver) {
      const isIndex = typeof prop === 'string' && /^\d+$/.test(prop);
      const res = Reflect.set(target, prop, value, receiver);
      if (isIndex && value && typeof value === 'object') {
        if (!value.id) {
          value.id = resolveEntityId(value);
        }
        try {
          pilotDb.saveEntity(collection, value);
        } catch (err) {
          console.error(`[DurablePersistence] Error saving indexed item in ${collection}:`, err);
        }
      }
      return res;
    }
  });
}

/**
 * Initializes a durable collection:
 * - If SQLite already has data, loads from SQLite
 * - If SQLite is empty, seeds only when explicitly enabled for local development
 * - Wraps with durable write-through proxy
 */
export function initDurableCollection<T extends Record<string, any>>(
  collection: string,
  initialSeed: T[],
  pilotDb: PilotDatabaseService
): T[] {
  let list: T[];
  const allowSeedData = process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_DEMO_SEED_DATA === 'true';
  try {
    if (pilotDb.isCollectionInitialized(collection)) {
      list = pilotDb.loadCollection<T>(collection);
    } else {
      list = allowSeedData ? [...initialSeed] : [];
      pilotDb.saveCollection(collection, list);
    }
  } catch (err) {
    console.error(`[DurablePersistence] Failed initializing collection ${collection}:`, err);
    list = [];
  }

  return makeDurableArray(collection, list, pilotDb);
}

/**
 * Explicit helper to persist a single entity
 */
export function persistEntity<T extends Record<string, any>>(
  collection: string,
  entity: T,
  pilotDb: PilotDatabaseService,
  tenantId?: string,
  companyId?: string
): void {
  if (!(entity as any).id) {
    (entity as any).id = resolveEntityId(entity);
  }
  pilotDb.saveEntity(collection, entity, tenantId, companyId);
}

/**
 * Explicit helper to delete a persisted entity
 */
export function deletePersistedEntity(
  collection: string,
  id: string,
  pilotDb: PilotDatabaseService
): void {
  pilotDb.deleteEntity(collection, id);
}

/**
 * Executes a callback within an atomic SQLite transaction
 */
export function executeTransaction<T>(
  pilotDb: PilotDatabaseService,
  fn: (db: PilotDatabaseService) => T
): T {
  return pilotDb.transaction(fn);
}
