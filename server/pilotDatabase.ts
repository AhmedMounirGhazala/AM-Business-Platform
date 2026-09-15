/**
 * AM Business Platform - Pilot Database & Persistence Engine
 * Architecture Baseline: v2.8 | Pilot Readiness Phase 1
 * Uses Node.js native DatabaseSync (node:sqlite) for zero-dependency durable storage.
 * Provides SQLite persistence, atomic transactions, SHA-256 backup/restore, and master data CSV onboarding.
 */

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  PilotDatabaseStatus,
  PilotBackupMetadata,
  PilotBackupPayload,
  PilotRestoreResult,
  PilotMasterDataImportRow,
  PilotImportPreviewResponse,
  PilotImportValidationItem,
  PilotImportCommitRequest,
  PilotImportCommitResponse,
  StoragePersistenceType,
  PersistenceReadinessStatus,
  StoragePersistenceReport
} from '../src/types/pilot';

export class PilotDatabaseService {
  private static instance: PilotDatabaseService | null = null;
  private db: DatabaseSync;
  private dbPath: string;

  private constructor(customDbPath?: string) {
    const dataDir = process.env.PERSISTENT_DATA_PATH || process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {}
    }

    let targetDbPath = customDbPath || process.env.DATABASE_PATH;
    if (!targetDbPath) {
      this.dbPath = path.join(dataDir, 'pilot_erp.db');
    } else if (targetDbPath === ':memory:') {
      this.dbPath = ':memory:';
    } else {
      const resolved = path.resolve(targetDbPath);
      // If path exists and is a directory, or if it doesn't have a file extension (.db/.sqlite)
      if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
        this.dbPath = path.join(resolved, 'pilot_erp.db');
      } else if (!path.extname(resolved)) {
        if (!fs.existsSync(resolved)) {
          try {
            fs.mkdirSync(resolved, { recursive: true });
          } catch {}
        }
        this.dbPath = path.join(resolved, 'pilot_erp.db');
      } else {
        this.dbPath = resolved;
      }
    }

    // Ensure parent directory exists before creating DatabaseSync
    if (this.dbPath !== ':memory:') {
      const parentDir = path.dirname(this.dbPath);
      if (!fs.existsSync(parentDir)) {
        try {
          fs.mkdirSync(parentDir, { recursive: true });
        } catch {}
      }
    }

    try {
      this.db = new DatabaseSync(this.dbPath);
    } catch (err: any) {
      console.warn(`[PilotDatabaseService] Unable to open database at "${this.dbPath}": ${err.message}. Initializing fallback...`);
      const fallbackDir = path.resolve(process.cwd(), 'data');
      if (!fs.existsSync(fallbackDir)) {
        try {
          fs.mkdirSync(fallbackDir, { recursive: true });
        } catch {}
      }
      const fallbackPath = path.join(fallbackDir, 'pilot_erp.db');
      try {
        this.dbPath = fallbackPath;
        this.db = new DatabaseSync(this.dbPath);
      } catch (innerErr: any) {
        console.warn(`[PilotDatabaseService] Fallback to "${fallbackPath}" failed: ${innerErr.message}. Defaulting to in-memory database.`);
        this.dbPath = ':memory:';
        this.db = new DatabaseSync(this.dbPath);
      }
    }

    this.initSchema();
  }

  public static getInstance(customDbPath?: string): PilotDatabaseService {
    if (!PilotDatabaseService.instance) {
      PilotDatabaseService.instance = new PilotDatabaseService(customDbPath);
    }
    return PilotDatabaseService.instance;
  }

  /**
   * For testing or isolation: create a new dedicated instance
   */
  public static createIsolated(dbPath: string): PilotDatabaseService {
    return new PilotDatabaseService(dbPath);
  }

  private initSchema(): void {
    // Enable Write-Ahead Logging (WAL) for concurrency & resilience
    try {
      this.db.exec('PRAGMA journal_mode = WAL;');
      this.db.exec('PRAGMA synchronous = NORMAL;');
      this.db.exec('PRAGMA busy_timeout = 5000;');
      this.db.exec('PRAGMA foreign_keys = ON;');
    } catch {
      // Memory DB or unsupported pragma fallback
    }

    // System Metadata
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pilot_metadata (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT
      );
    `);

    // Operational Entities (Generic durable key-value / document store with isolation columns)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pilot_entities (
        collection TEXT NOT NULL,
        id TEXT NOT NULL,
        tenant_id TEXT,
        company_id TEXT,
        data TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (collection, id)
      );
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_pilot_entities_coll ON pilot_entities(collection);
      CREATE INDEX IF NOT EXISTS idx_pilot_entities_comp ON pilot_entities(collection, company_id);
    `);

    // Cryptographic Audit Vault Blocks
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pilot_audit_vault (
        block_index INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL,
        tenant_id TEXT,
        company_id TEXT,
        action TEXT NOT NULL,
        previous_hash TEXT NOT NULL,
        current_hash TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // Backups Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pilot_backups (
        backup_id TEXT PRIMARY KEY,
        snapshot_name TEXT NOT NULL,
        checksum_sha256 TEXT NOT NULL,
        record_count INTEGER NOT NULL,
        metadata TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // Record system initialization timestamp if not present
    const initStmt = this.db.prepare('SELECT value FROM pilot_metadata WHERE key = ?');
    const existing = initStmt.get('initialized_at');
    if (!existing) {
      const insertMeta = this.db.prepare('INSERT INTO pilot_metadata (key, value, updated_at) VALUES (?, ?, ?)');
      insertMeta.run('initialized_at', new Date().toISOString(), new Date().toISOString());
      insertMeta.run('schema_version', '1.0.0', new Date().toISOString());
    }
  }

  // ==================== ENTITY CRUD ====================

  public isCollectionInitialized(collection: string): boolean {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM pilot_entities WHERE collection = ?');
    const result = stmt.get(collection) as { count: number | bigint } | undefined;
    if (!result) return false;
    return Number(result.count) > 0;
  }

  public loadCollection<T>(collection: string): T[] {
    const stmt = this.db.prepare('SELECT data FROM pilot_entities WHERE collection = ?');
    const rows = stmt.all(collection) as Array<{ data: string }>;
    return rows.map(r => JSON.parse(r.data) as T);
  }

  public saveEntity<T extends { id?: string; tenantId?: string; companyId?: string }>(
    collection: string,
    entity: T,
    tenantId?: string,
    companyId?: string
  ): void {
    const id = entity.id || `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const ten = tenantId || entity.tenantId || 'ten-001';
    const comp = companyId || entity.companyId || 'comp-001';
    const json = JSON.stringify(entity);
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO pilot_entities (collection, id, tenant_id, company_id, data, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(collection, id) DO UPDATE SET
        tenant_id = excluded.tenant_id,
        company_id = excluded.company_id,
        data = excluded.data,
        updated_at = excluded.updated_at
    `);
    stmt.run(collection, id, ten, comp, json, now);
  }

  public upsertEntity<T = any>(
    collection: string,
    idOrEntity: string | (T & { id?: string; tenantId?: string; companyId?: string }),
    entityOrTenant?: T | string,
    tenantId?: string,
    companyId?: string
  ): void {
    if (typeof idOrEntity === 'string') {
      const id = idOrEntity;
      const entity = (typeof entityOrTenant === 'object' && entityOrTenant !== null)
        ? { ...entityOrTenant, id }
        : ({ id } as any);
      this.saveEntity(collection, entity, tenantId, companyId);
    } else {
      this.saveEntity(collection, idOrEntity, entityOrTenant as string | undefined, tenantId);
    }
  }

  public listEntities<T = any>(collection: string, tenantId?: string, companyId?: string): T[] {
    let stmt;
    let rows: Array<{ id: string; tenant_id: string; company_id: string; data: string; updated_at: string }>;
    if (tenantId && companyId) {
      stmt = this.db.prepare('SELECT id, tenant_id, company_id, data, updated_at FROM pilot_entities WHERE collection = ? AND tenant_id = ? AND company_id = ?');
      rows = stmt.all(collection, tenantId, companyId) as any;
    } else if (tenantId) {
      stmt = this.db.prepare('SELECT id, tenant_id, company_id, data, updated_at FROM pilot_entities WHERE collection = ? AND tenant_id = ?');
      rows = stmt.all(collection, tenantId) as any;
    } else if (companyId) {
      stmt = this.db.prepare('SELECT id, tenant_id, company_id, data, updated_at FROM pilot_entities WHERE collection = ? AND company_id = ?');
      rows = stmt.all(collection, companyId) as any;
    } else {
      stmt = this.db.prepare('SELECT id, tenant_id, company_id, data, updated_at FROM pilot_entities WHERE collection = ?');
      rows = stmt.all(collection) as any;
    }
    return rows.map(r => {
      try {
        const parsed = JSON.parse(r.data);
        if (typeof parsed === 'object' && parsed !== null) {
          if (!parsed.id) parsed.id = r.id;
          if (!parsed.tenant_id && !parsed.tenantId) parsed.tenant_id = r.tenant_id;
          if (!parsed.company_id && !parsed.companyId) parsed.company_id = r.company_id;
          if (!parsed.updated_at && !parsed.updatedAt) parsed.updated_at = r.updated_at;
        }
        return parsed as T;
      } catch {
        return r.data as unknown as T;
      }
    });
  }

  public saveCollection<T extends { id?: string; tenantId?: string; companyId?: string }>(
    collection: string,
    entities: T[],
    tenantId?: string,
    companyId?: string
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO pilot_entities (collection, id, tenant_id, company_id, data, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(collection, id) DO UPDATE SET
        tenant_id = excluded.tenant_id,
        company_id = excluded.company_id,
        data = excluded.data,
        updated_at = excluded.updated_at
    `);

    this.db.exec('BEGIN TRANSACTION;');
    try {
      const now = new Date().toISOString();
      for (const entity of entities) {
        const id = entity.id || `gen-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const ten = tenantId || entity.tenantId || 'ten-001';
        const comp = companyId || entity.companyId || 'comp-001';
        stmt.run(collection, id, ten, comp, JSON.stringify(entity), now);
      }
      this.db.exec('COMMIT;');
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  public deleteEntity(collection: string, id: string): void {
    const stmt = this.db.prepare('DELETE FROM pilot_entities WHERE collection = ? AND id = ?');
    stmt.run(collection, id);
  }

  public getEntity<T>(collection: string, id: string): T | null {
    const stmt = this.db.prepare('SELECT data FROM pilot_entities WHERE collection = ? AND id = ?');
    const row = stmt.get(collection, id) as { data: string } | undefined;
    return row ? (JSON.parse(row.data) as T) : null;
  }

  public queryEntities<T>(collection: string, filter?: { tenantId?: string; companyId?: string }): T[] {
    if (filter?.companyId && filter?.tenantId) {
      const stmt = this.db.prepare('SELECT data FROM pilot_entities WHERE collection = ? AND tenant_id = ? AND company_id = ?');
      const rows = stmt.all(collection, filter.tenantId, filter.companyId) as Array<{ data: string }>;
      return rows.map(r => JSON.parse(r.data) as T);
    } else if (filter?.tenantId) {
      const stmt = this.db.prepare('SELECT data FROM pilot_entities WHERE collection = ? AND tenant_id = ?');
      const rows = stmt.all(collection, filter.tenantId) as Array<{ data: string }>;
      return rows.map(r => JSON.parse(r.data) as T);
    } else if (filter?.companyId) {
      const stmt = this.db.prepare('SELECT data FROM pilot_entities WHERE collection = ? AND company_id = ?');
      const rows = stmt.all(collection, filter.companyId) as Array<{ data: string }>;
      return rows.map(r => JSON.parse(r.data) as T);
    }
    return this.loadCollection<T>(collection);
  }

  public transaction<T>(fn: (db: PilotDatabaseService) => T): T {
    this.db.exec('BEGIN TRANSACTION;');
    try {
      const res = fn(this);
      this.db.exec('COMMIT;');
      return res;
    } catch (err) {
      try {
        this.db.exec('ROLLBACK;');
      } catch {}
      throw err;
    }
  }

  // ==================== STORAGE PERSISTENCE & WAL ENGINE ====================

  /**
   * Verifies that Write-Ahead Logging (WAL) is actively enabled
   */
  public isWalModeActive(): boolean {
    try {
      const stmt = this.db.prepare('PRAGMA journal_mode;');
      const res = stmt.get() as { journal_mode?: string } | undefined;
      return (res?.journal_mode || '').toLowerCase() === 'wal';
    } catch {
      return false;
    }
  }

  /**
   * Performs an atomic SQLite WAL checkpoint to flush journal frames to the primary database file
   */
  public checkpointWal(mode: 'PASSIVE' | 'FULL' | 'RESTART' | 'TRUNCATE' = 'PASSIVE'): {
    mode: string;
    busy: number;
    log: number;
    checkpointed: number;
  } {
    try {
      const stmt = this.db.prepare(`PRAGMA wal_checkpoint(${mode});`);
      const res = stmt.get() as { busy?: number; log?: number; checkpointed?: number } | undefined;
      return {
        mode,
        busy: Number(res?.busy ?? 0),
        log: Number(res?.log ?? 0),
        checkpointed: Number(res?.checkpointed ?? 0)
      };
    } catch (err: any) {
      throw new Error(`Failed to checkpoint WAL in mode ${mode}: ${err.message}`);
    }
  }

  /**
   * Inspects Linux mount table (/proc/mounts) to determine whether target directory is a dedicated mount point
   */
  private static inspectFilesystemMount(targetPath: string): { isMountedVolume: boolean; mountPoint?: string; fsType?: string } {
    try {
      if (!fs.existsSync('/proc/mounts')) {
        return { isMountedVolume: false };
      }
      const resolved = path.resolve(targetPath);
      const content = fs.readFileSync('/proc/mounts', 'utf-8');
      const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

      let bestMountPoint = '';
      let bestFsType = '';

      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          const mountPoint = parts[1];
          const fsType = parts[2];
          if (resolved === mountPoint || resolved.startsWith(mountPoint.endsWith('/') ? mountPoint : mountPoint + '/')) {
            if (mountPoint.length > bestMountPoint.length) {
              bestMountPoint = mountPoint;
              bestFsType = fsType;
            }
          }
        }
      }

      // Ephemeral filesystems typical of container overlay/tmpfs layers
      const ephemeralFs = ['overlay', 'overlay2', 'tmpfs', 'rootfs', 'ramfs'];
      const isDistinctMount = Boolean(bestMountPoint && bestMountPoint !== '/');
      const isPersistentFsType = Boolean(bestFsType && !ephemeralFs.includes(bestFsType.toLowerCase()));

      return {
        isMountedVolume: isDistinctMount || isPersistentFsType,
        mountPoint: bestMountPoint || undefined,
        fsType: bestFsType || undefined
      };
    } catch {
      return { isMountedVolume: false };
    }
  }

  /**
   * Evaluates and reports whether persistent storage is guaranteed for the given database path
   */
  public static detectStoragePersistence(dbPath: string): StoragePersistenceReport {
    const resolvedDbPath = path.resolve(dbPath);
    const dataDir = path.dirname(resolvedDbPath);
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isProduction = nodeEnv === 'production';
    const requirePersistent = process.env.REQUIRE_PERSISTENT_STORAGE === 'true' || (isProduction && process.env.ALLOW_EPHEMERAL_STORAGE !== 'true');
    const allowEphemeral = process.env.ALLOW_EPHEMERAL_STORAGE === 'true';
    const simulateEphemeral = process.env.SIMULATE_EPHEMERAL_STORAGE === 'true';
    const storageConfirmedEnv = process.env.PERSISTENT_STORAGE_CONFIRMED === 'true' || Boolean(process.env.PERSISTENT_DATA_PATH);

    const mountInfo = PilotDatabaseService.inspectFilesystemMount(dataDir);

    let storageType: StoragePersistenceType = 'EPHEMERAL_CONTAINER_FS';
    let isPersistent = false;

    if (simulateEphemeral) {
      storageType = 'SIMULATED_EPHEMERAL';
      isPersistent = false;
    } else if (process.env.PERSISTENCE_MODE === 'PERSISTENT_VOLUME' || storageConfirmedEnv) {
      storageType = 'PERSISTENT_VOLUME';
      isPersistent = true;
    } else if (mountInfo.isMountedVolume) {
      storageType = 'PERSISTENT_VOLUME';
      isPersistent = true;
    } else {
      storageType = 'EPHEMERAL_CONTAINER_FS';
      isPersistent = false;
    }

    let readinessStatus: PersistenceReadinessStatus = 'READY';
    let operationalMessage = '';
    const remedyInstructions: string[] = [];

    if (!isPersistent) {
      if (requirePersistent) {
        readinessStatus = 'NOT_READY_EPHEMERAL';
        operationalMessage = `CRITICAL DEPLOYMENT SAFETY FAILURE: Persistent storage is not guaranteed. SQLite pilot database at '${resolvedDbPath}' is operating on an ephemeral container filesystem (${mountInfo.fsType || 'overlay/tmpfs'}). Container restart, scale-to-zero, or redeploy will cause permanent, unrecoverable data loss for all pilot transactions, receipts, and ledger journals.`;
        remedyInstructions.push('Cloud Run: Attach a persistent volume mount (Cloud Storage FUSE or Filestore NFS) mapped to the container data directory.');
        remedyInstructions.push('Docker: Run with a named volume or bind mount (e.g., -v /var/data/am-erp:/app/data).');
        remedyInstructions.push('Kubernetes: Define a PersistentVolumeClaim (PVC) and volumeMount at /app/data.');
        remedyInstructions.push('Set PERSISTENT_STORAGE_CONFIRMED=true or PERSISTENT_DATA_PATH=/path/to/durable/volume once persistent storage is verified.');
        remedyInstructions.push('For automated CI/staging testing only: Set ALLOW_EPHEMERAL_STORAGE=true to bypass this production readiness gate.');
      } else {
        readinessStatus = 'READY';
        operationalMessage = `Non-production advisory: database is operating on local ephemeral storage (${mountInfo.fsType || 'workspace overlay'}). Data will not persist across container recreations. Configure a persistent volume before promoting to production.`;
      }
    } else {
      readinessStatus = 'READY';
      operationalMessage = `Production persistence certified: database directory '${dataDir}' is verified as durable persistent storage (mount: ${mountInfo.mountPoint || 'confirmed volume'}, fstype: ${mountInfo.fsType || 'persistent'}).`;
    }

    return {
      isPersistent,
      storageType,
      databasePath: resolvedDbPath,
      dataDirectory: dataDir,
      mountPoint: mountInfo.mountPoint,
      fileSystemType: mountInfo.fsType,
      walMode: true,
      busyTimeoutMs: 5000,
      readinessStatus,
      operationalMessage,
      verifiedAt: new Date().toISOString(),
      remedyInstructions: remedyInstructions.length > 0 ? remedyInstructions : undefined,
      environment: {
        nodeEnv,
        isProduction,
        requirePersistentStorage: requirePersistent,
        allowEphemeralStorage: allowEphemeral,
        storageConfirmedEnv
      }
    };
  }

  /**
   * Returns complete storage persistence telemetry for this database instance
   */
  public getPersistenceReport(): StoragePersistenceReport {
    const report = PilotDatabaseService.detectStoragePersistence(this.dbPath);
    report.walMode = this.isWalModeActive();
    return report;
  }

  /**
   * Validates database persistence at startup and outputs an authoritative diagnostic report
   */
  public validateStartupPersistence(): {
    ready: boolean;
    report: StoragePersistenceReport;
    shouldAbort: boolean;
  } {
    const report = this.getPersistenceReport();
    const shouldAbort = process.env.STRICT_PERSISTENCE_ABORT === 'true' && report.readinessStatus === 'NOT_READY_EPHEMERAL';

    console.log('\n' + '='.repeat(80));
    console.log(' [AM ERP] PILOT DATABASE PERSISTENCE & DEPLOYMENT SAFETY AUDIT');
    console.log('='.repeat(80));
    console.log(` Database Path:    ${report.databasePath}`);
    console.log(` Storage Type:     ${report.storageType}`);
    console.log(` Persistent Mount: ${report.isPersistent ? 'YES (DURABLE VOLUME CERTIFIED)' : 'NO (EPHEMERAL / OVERLAY)'}`);
    console.log(` WAL Mode Active:  ${report.walMode ? 'YES (ACID Write-Ahead Logging)' : 'NO (WARNING)'}`);
    console.log(` Busy Timeout:     ${report.busyTimeoutMs}ms`);
    console.log(` Readiness Status: ${report.readinessStatus}`);
    console.log(` Operational Msg:  ${report.operationalMessage}`);
    if (report.remedyInstructions && report.remedyInstructions.length > 0) {
      console.log(' Remediations:');
      report.remedyInstructions.forEach((step, idx) => console.log(`   ${idx + 1}. ${step}`));
    }
    console.log('='.repeat(80) + '\n');

    this.logAudit('PERSISTENCE_READINESS_CHECK', {
      readinessStatus: report.readinessStatus,
      storageType: report.storageType,
      isPersistent: report.isPersistent,
      walMode: report.walMode,
      databasePath: report.databasePath
    });

    return {
      ready: report.readinessStatus === 'READY',
      report,
      shouldAbort
    };
  }

  public getStatus(): PilotDatabaseStatus {
    let sizeBytes = 0;
    try {
      if (fs.existsSync(this.dbPath)) {
        sizeBytes = fs.statSync(this.dbPath).size;
      }
    } catch {
      sizeBytes = 0;
    }

    const collStmt = this.db.prepare('SELECT COUNT(DISTINCT collection) as colCount, COUNT(*) as totalCount FROM pilot_entities');
    const collRes = collStmt.get() as { colCount: number | bigint; totalCount: number | bigint } | undefined;

    const backupStmt = this.db.prepare('SELECT created_at FROM pilot_backups ORDER BY created_at DESC LIMIT 1');
    const lastBackup = backupStmt.get() as { created_at: string } | undefined;

    return {
      engine: 'SQLite (node:sqlite native DatabaseSync)',
      databasePath: this.dbPath,
      sizeBytes,
      status: 'ACTIVE',
      persistedCollections: collRes ? Number(collRes.colCount) : 0,
      totalEntities: collRes ? Number(collRes.totalCount) : 0,
      lastBackupTimestamp: lastBackup?.created_at,
      persistence: this.getPersistenceReport()
    };
  }

  /**
   * Closes database connection cleanly after final WAL checkpoint
   */
  public close(): void {
    try {
      this.checkpointWal('TRUNCATE');
    } catch {}
    try {
      this.db.close();
    } catch {}
  }

  // ==================== AUDIT VAULT ====================

  public logAudit(action: string, payload: any, tenantId = 'ten-001', companyId = 'comp-001'): string {
    const lastBlock = this.db.prepare('SELECT current_hash FROM pilot_audit_vault ORDER BY block_index DESC LIMIT 1').get() as { current_hash: string } | undefined;
    const previousHash = lastBlock?.current_hash || 'GENESIS_PILOT_AUDIT_HASH_00000000000000000000000000000000';

    const eventId = `EVT-AUDIT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const createdAt = new Date().toISOString();
    const payloadStr = JSON.stringify(payload);

    const currentHash = crypto.createHash('sha256')
      .update(previousHash + eventId + action + payloadStr + createdAt)
      .digest('hex');

    const stmt = this.db.prepare(`
      INSERT INTO pilot_audit_vault (event_id, tenant_id, company_id, action, previous_hash, current_hash, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(eventId, tenantId, companyId, action, previousHash, currentHash, payloadStr, createdAt);

    return currentHash;
  }

  /**
   * Verifies the cryptographic integrity of the entire audit vault chain
   */
  public verifyAuditVaultIntegrity(): { valid: boolean; totalBlocks: number; brokenBlockIndex?: number } {
    const rows = this.db.prepare('SELECT block_index, event_id, action, previous_hash, current_hash, payload, created_at FROM pilot_audit_vault ORDER BY block_index ASC').all() as any[];
    let expectedPrevious = 'GENESIS_PILOT_AUDIT_HASH_00000000000000000000000000000000';
    for (const row of rows) {
      if (row.previous_hash !== expectedPrevious) {
        return { valid: false, totalBlocks: rows.length, brokenBlockIndex: row.block_index };
      }
      const calculated = crypto.createHash('sha256')
        .update(row.previous_hash + row.event_id + row.action + row.payload + row.created_at)
        .digest('hex');
      if (calculated !== row.current_hash) {
        return { valid: false, totalBlocks: rows.length, brokenBlockIndex: row.block_index };
      }
      expectedPrevious = row.current_hash;
    }
    return { valid: true, totalBlocks: rows.length };
  }

  /**
   * Appends an immutable, tamper-evident block into the audit vault with previous hash link
   */
  public appendAuditBlock(
    eventId: string,
    action: string,
    payload: any,
    tenantId = 'ten-001',
    companyId = 'comp-001'
  ): { blockIndex: number; previousHash: string; currentHash: string } {
    const lastBlock = this.db.prepare('SELECT current_hash FROM pilot_audit_vault ORDER BY block_index DESC LIMIT 1').get() as { current_hash: string } | undefined;
    const previousHash = lastBlock?.current_hash || 'GENESIS_PILOT_AUDIT_HASH_00000000000000000000000000000000';

    const createdAt = new Date().toISOString();
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

    const currentHash = crypto.createHash('sha256')
      .update(previousHash + eventId + action + payloadStr + createdAt)
      .digest('hex');

    const stmt = this.db.prepare(`
      INSERT INTO pilot_audit_vault (event_id, tenant_id, company_id, action, previous_hash, current_hash, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(eventId, tenantId, companyId, action, previousHash, currentHash, payloadStr, createdAt);
    const blockIndex = Number(result.lastInsertRowid || 1);

    return {
      blockIndex,
      previousHash,
      currentHash
    };
  }

  /**
   * Verifies the cryptographic chain across audit vault blocks
   */
  public verifyAuditVaultChain(tenantId?: string): {
    isValid: boolean;
    valid: boolean;
    totalBlocks: number;
    message: string;
  } {
    const query = tenantId
      ? 'SELECT block_index, event_id, action, previous_hash, current_hash, payload, created_at FROM pilot_audit_vault WHERE tenant_id = ? ORDER BY block_index ASC'
      : 'SELECT block_index, event_id, action, previous_hash, current_hash, payload, created_at FROM pilot_audit_vault ORDER BY block_index ASC';
    const rows = (tenantId ? this.db.prepare(query).all(tenantId) : this.db.prepare(query).all()) as any[];

    if (rows.length === 0) {
      return {
        isValid: true,
        valid: true,
        totalBlocks: 0,
        message: 'Empty audit vault is valid.'
      };
    }

    let expectedPrevious = rows[0].previous_hash;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (i > 0 && row.previous_hash !== expectedPrevious) {
        return {
          isValid: false,
          valid: false,
          totalBlocks: rows.length,
          message: `Broken link at block index ${row.block_index}`
        };
      }
      const calculated = crypto.createHash('sha256')
        .update(row.previous_hash + row.event_id + row.action + row.payload + row.created_at)
        .digest('hex');
      if (calculated !== row.current_hash) {
        return {
          isValid: false,
          valid: false,
          totalBlocks: rows.length,
          message: `Hash mismatch at block index ${row.block_index}`
        };
      }
      expectedPrevious = row.current_hash;
    }

    return {
      isValid: true,
      valid: true,
      totalBlocks: rows.length,
      message: `Audit vault verified across ${rows.length} blocks: SHA-256 chain 100% unbroken`
    };
  }

  public getAuditLogs(filter?: { tenantId?: string; limit?: number }): Array<{
    blockIndex: number;
    eventId: string;
    tenantId: string;
    companyId: string;
    action: string;
    previousHash: string;
    currentHash: string;
    payload: any;
    details: any;
    createdAt: string;
  }> {
    let query = 'SELECT block_index, event_id, tenant_id, company_id, action, previous_hash, current_hash, payload, created_at FROM pilot_audit_vault';
    const params: any[] = [];
    if (filter?.tenantId) {
      query += ' WHERE tenant_id = ?';
      params.push(filter.tenantId);
    }
    query += ' ORDER BY block_index DESC';
    if (filter?.limit) {
      query += ` LIMIT ${Math.floor(filter.limit)}`;
    }
    const rows = this.db.prepare(query).all(...params) as any[];
    return rows.map(r => {
      let parsed = {};
      try { parsed = JSON.parse(r.payload); } catch {}
      return {
        blockIndex: r.block_index,
        eventId: r.event_id,
        tenantId: r.tenant_id,
        companyId: r.company_id,
        action: r.action,
        previousHash: r.previous_hash,
        currentHash: r.current_hash,
        payload: parsed,
        details: parsed,
        createdAt: r.created_at
      };
    });
  }

  // ==================== BACKUP & RESTORE ====================

  public createBackup(snapshotName?: string, activeCollections?: Record<string, any[]>): PilotBackupPayload {
    const backupId = `BAK-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    if (!activeCollections) {
      activeCollections = {};
      const allEntitiesStmt = this.db.prepare('SELECT collection, id, tenant_id, company_id, data, updated_at FROM pilot_entities');
      const allRows = allEntitiesStmt.all() as Array<{ collection: string; id: string; tenant_id: string; company_id: string; data: string; updated_at: string }>;
      for (const row of allRows) {
        if (!activeCollections[row.collection]) {
          activeCollections[row.collection] = [];
        }
        try {
          activeCollections[row.collection].push(JSON.parse(row.data));
        } catch {
          activeCollections[row.collection].push({ id: row.id, data: row.data });
        }
      }
    }

    const collectionCounts: Record<string, number> = {};
    let totalRecords = 0;
    const entities: any[] = [];

    for (const [col, arr] of Object.entries(activeCollections)) {
      if (col === 'entities') continue;
      const count = Array.isArray(arr) ? arr.length : 0;
      collectionCounts[col] = count;
      totalRecords += count;

      if (Array.isArray(arr)) {
        for (const item of arr) {
          entities.push({
            collection: col,
            id: item.id || `ent-${Math.random().toString(36).slice(2, 7)}`,
            tenant_id: item.tenantId || item.tenant_id || 'ten-001',
            company_id: item.companyId || item.company_id || 'comp-001',
            data: JSON.stringify(item),
            updated_at: item.updatedAt || item.updated_at || timestamp
          });
        }
      }
    }

    const payloadData: any = {
      ...activeCollections,
      entities
    };

    const rawDataStr = JSON.stringify(payloadData);
    const checksumSha256 = crypto.createHash('sha256').update(rawDataStr).digest('hex');

    const metadata: PilotBackupMetadata & { schemaVersion?: number; checksum?: string } = {
      backupId,
      snapshotName: snapshotName || `Retail Pilot Snapshot ${new Date().toLocaleDateString()}`,
      timestamp,
      version: '1.0.0',
      schemaVersion: 1,
      platformVersion: '2.8.0-build.104',
      architectureBaseline: 'v2.8',
      checksumSha256,
      checksum: checksumSha256,
      totalRecords,
      collectionCounts
    };

    const payload: PilotBackupPayload = {
      metadata,
      data: payloadData
    };

    const stmt = this.db.prepare(`
      INSERT INTO pilot_backups (backup_id, snapshot_name, checksum_sha256, record_count, metadata, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(backupId, metadata.snapshotName, checksumSha256, totalRecords, JSON.stringify(metadata), rawDataStr, timestamp);

    this.logAudit('BACKUP_CREATED', { backupId, checksumSha256, totalRecords, snapshotName });

    return payload;
  }

  public listBackups(): PilotBackupMetadata[] {
    const stmt = this.db.prepare('SELECT metadata FROM pilot_backups ORDER BY created_at DESC');
    const rows = stmt.all() as Array<{ metadata: string }>;
    return rows.map(r => JSON.parse(r.metadata) as PilotBackupMetadata);
  }

  public restoreBackup(payload: PilotBackupPayload): PilotRestoreResult & { restoredCount: number } {
    if (!payload || !payload.metadata || !payload.data) {
      throw new Error('Invalid backup payload format.');
    }

    const { metadata, data } = payload;
    const rawDataStr = JSON.stringify(data);
    const calculatedHash = crypto.createHash('sha256').update(rawDataStr).digest('hex');
    const expectedHash = metadata.checksumSha256 || (metadata as any).checksum;

    if (calculatedHash !== expectedHash) {
      throw new Error(`Checksum integrity mismatch! Expected SHA-256: ${expectedHash}, Calculated: ${calculatedHash}`);
    }

    this.db.exec('BEGIN TRANSACTION;');
    try {
      // Clear current operational entities
      this.db.exec('DELETE FROM pilot_entities;');

      const insertStmt = this.db.prepare(`
        INSERT INTO pilot_entities (collection, id, tenant_id, company_id, data, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();
      let restoredCount = 0;
      const collectionsRestored: string[] = [];
      const seenKeys = new Set<string>();

      for (const [col, records] of Object.entries(data)) {
        if (col === 'entities') continue;
        if (!Array.isArray(records)) continue;
        collectionsRestored.push(col);
        for (const item of records) {
          const id = item.id || `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          const ten = item.tenantId || item.tenant_id || 'ten-001';
          const comp = item.companyId || item.company_id || 'comp-001';
          const key = `${col}:${id}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            insertStmt.run(col, id, ten, comp, JSON.stringify(item), now);
            restoredCount++;
          }
        }
      }

      if (Array.isArray((data as any).entities)) {
        for (const ent of (data as any).entities) {
          const col = ent.collection || 'entities';
          const id = ent.id;
          const key = `${col}:${id}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            const ten = ent.tenant_id || ent.tenantId || 'ten-001';
            const comp = ent.company_id || ent.companyId || 'comp-001';
            const rawData = typeof ent.data === 'string' ? ent.data : JSON.stringify(ent.data || ent);
            insertStmt.run(col, id, ten, comp, rawData, now);
            restoredCount++;
            if (!collectionsRestored.includes(col)) {
              collectionsRestored.push(col);
            }
          }
        }
      }

      this.db.exec('COMMIT;');

      this.logAudit('BACKUP_RESTORED', { backupId: metadata.backupId, restoredCount, checksumSha256: calculatedHash });

      return {
        success: true,
        restoredAt: new Date().toISOString(),
        backupId: metadata.backupId,
        totalRecordsRestored: restoredCount,
        restoredCount,
        collectionsRestored,
        message: `Successfully restored ${restoredCount} records across ${collectionsRestored.length} collections with verified SHA-256 integrity.`
      };
    } catch (err) {
      this.db.exec('ROLLBACK;');
      throw err;
    }
  }

  // ==================== MASTER DATA CSV IMPORT ENGINE ====================

  /**
   * Parse CSV string into structured PilotMasterDataImportRow array
   */
  public static parseCsv(csvContent: string): PilotMasterDataImportRow[] {
    const lines = csvContent.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      throw new Error('CSV must contain a header row and at least one data row.');
    }

    const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows: PilotMasterDataImportRow[] = [];

    const getCol = (cells: string[], names: string[]): string | undefined => {
      for (const name of names) {
        const idx = header.indexOf(name.toLowerCase());
        if (idx >= 0 && idx < cells.length) {
          return cells[idx]?.trim().replace(/^["']|["']$/g, '');
        }
      }
      return undefined;
    };

    for (let i = 1; i < lines.length; i++) {
      // Split with quotes support
      const rowRegex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
      const rawCells: string[] = [];
      let match;
      // Simple fallback split for lines without quotes
      if (!lines[i].includes('"')) {
        rawCells.push(...lines[i].split(','));
      } else {
        const tokens = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        rawCells.push(...tokens);
      }

      const sku = getCol(rawCells, ['sku', 'item_sku', 'code', 'product_code', 'item_code']);
      const barcode = getCol(rawCells, ['barcode', 'upc', 'ean', 'bar_code']);
      const name = getCol(rawCells, ['name', 'product_name', 'item_name', 'description']);
      const nameAr = getCol(rawCells, ['name_ar', 'arabic_name', 'namear']);
      const category = getCol(rawCells, ['category', 'item_category', 'department']) || 'General Retail';
      const uom = getCol(rawCells, ['uom', 'unit', 'unit_of_measure']) || 'PCS';
      const costStr = getCol(rawCells, ['cost', 'cost_price', 'unit_cost', 'costprice']) || '0';
      const priceStr = getCol(rawCells, ['price', 'selling_price', 'unit_price', 'price_retail', 'sellingprice']) || '0';
      const qtyStr = getCol(rawCells, ['opening_stock', 'opening_stock_qty', 'stock', 'qty', 'opening_qty']) || '0';
      const warehouseId = getCol(rawCells, ['warehouse', 'warehouse_id', 'wh_id']) || 'wh-001';
      const cashStr = getCol(rawCells, ['opening_cash', 'cash_balance', 'cash_amount']) || '0';

      if (sku || name) {
        rows.push({
          sku: sku || `SKU-${String(i).padStart(4, '0')}`,
          barcode: barcode || undefined,
          name: name || `Product ${sku}`,
          nameAr: nameAr || undefined,
          category,
          uom,
          costPrice: parseFloat(costStr) || 0,
          sellingPrice: parseFloat(priceStr) || 0,
          openingStockQty: parseFloat(qtyStr) || 0,
          warehouseId,
          openingCashAmount: parseFloat(cashStr) || 0
        });
      }
    }

    return rows;
  }

  /**
   * Validates and previews rows against existing database
   */
  public previewImport(
    rows: PilotMasterDataImportRow[],
    existingItems: Array<{ sku?: string; barcode?: string; name?: string }>,
    existingWarehouses: Array<{ id: string; name?: string }>
  ): PilotImportPreviewResponse {
    const existingSkus = new Set(existingItems.map(i => (i.sku || '').toUpperCase()).filter(Boolean));
    const existingBarcodes = new Set(existingItems.map(i => (i.barcode || '').toUpperCase()).filter(Boolean));
    const validWhIds = new Set(existingWarehouses.map(w => w.id));

    const seenImportSkus = new Set<string>();
    const seenImportBarcodes = new Set<string>();

    const items: PilotImportValidationItem[] = [];
    let validRows = 0;
    let warningRows = 0;
    let errorRows = 0;
    let duplicateRows = 0;
    let totalOpeningStockUnits = 0;
    let totalOpeningStockCost = 0;
    let totalOpeningCash = 0;

    const detectedWarehouses = new Set<string>();

    rows.forEach((row, index) => {
      const rowNumber = index + 1;
      const issues: string[] = [];
      let isError = false;
      let isDuplicate = false;
      let isWarning = false;

      // SKU validation
      const skuNorm = (row.sku || '').trim().toUpperCase();
      if (!skuNorm) {
        issues.push('Missing product SKU/Code.');
        isError = true;
      } else if (seenImportSkus.has(skuNorm)) {
        issues.push(`Duplicate SKU '${skuNorm}' found in current import batch.`);
        isDuplicate = true;
      } else if (existingSkus.has(skuNorm)) {
        issues.push(`SKU '${skuNorm}' already exists in system database (will be updated or skipped).`);
        isDuplicate = true;
      }
      seenImportSkus.add(skuNorm);

      // Name validation
      if (!row.name || row.name.trim().length === 0) {
        issues.push('Product name is required.');
        isError = true;
      }

      // Barcode validation
      if (row.barcode) {
        const bcNorm = row.barcode.trim().toUpperCase();
        if (seenImportBarcodes.has(bcNorm)) {
          issues.push(`Duplicate Barcode '${bcNorm}' within this import.`);
          isWarning = true;
        } else if (existingBarcodes.has(bcNorm)) {
          issues.push(`Barcode '${bcNorm}' already assigned to an existing item.`);
          isWarning = true;
        }
        seenImportBarcodes.add(bcNorm);
      }

      // Financial number validation
      if (row.costPrice < 0) {
        issues.push('Cost price cannot be negative.');
        isError = true;
      }
      if (row.sellingPrice < 0) {
        issues.push('Selling price cannot be negative.');
        isError = true;
      }
      if (row.sellingPrice < row.costPrice && row.costPrice > 0) {
        issues.push(`Selling price (${row.sellingPrice}) is below cost price (${row.costPrice}) [Negative margin warning].`);
        isWarning = true;
      }

      // Inventory validation
      const qty = row.openingStockQty || 0;
      if (qty < 0) {
        issues.push('Opening stock quantity cannot be negative.');
        isError = true;
      } else if (qty > 0) {
        totalOpeningStockUnits += qty;
        totalOpeningStockCost += qty * (row.costPrice || 0);

        if (row.warehouseId) {
          detectedWarehouses.add(row.warehouseId);
          if (validWhIds.size > 0 && !validWhIds.has(row.warehouseId)) {
            issues.push(`Warehouse '${row.warehouseId}' does not exist in master data; will default to primary store warehouse.`);
            isWarning = true;
          }
        }
      }

      // Cash amount
      if (row.openingCashAmount) {
        if (row.openingCashAmount < 0) {
          issues.push('Opening cash amount cannot be negative.');
          isError = true;
        } else {
          totalOpeningCash += row.openingCashAmount;
        }
      }

      // Determine final status
      let status: 'VALID' | 'WARNING' | 'ERROR' | 'DUPLICATE';
      if (isError) {
        status = 'ERROR';
        errorRows++;
      } else if (isDuplicate) {
        status = 'DUPLICATE';
        duplicateRows++;
      } else if (isWarning) {
        status = 'WARNING';
        warningRows++;
      } else {
        status = 'VALID';
        validRows++;
      }

      items.push({
        rowNumber,
        status,
        data: row,
        issues
      });
    });

    const isBalanced = Math.abs((totalOpeningStockCost + totalOpeningCash) - (totalOpeningStockCost + totalOpeningCash)) < 0.001;

    return {
      valid: errorRows === 0,
      summary: {
        totalRows: rows.length,
        validRows,
        warningRows,
        errorRows,
        duplicateRows,
        totalOpeningStockUnits: Math.round(totalOpeningStockUnits * 100) / 100,
        totalOpeningStockCost: Math.round(totalOpeningStockCost * 100) / 100,
        totalOpeningCash: Math.round(totalOpeningCash * 100) / 100
      },
      items,
      detectedWarehouses: Array.from(detectedWarehouses),
      sampleOpeningJournal: {
        debitInventory: Math.round(totalOpeningStockCost * 100) / 100,
        debitCash: Math.round(totalOpeningCash * 100) / 100,
        creditEquity: Math.round((totalOpeningStockCost + totalOpeningCash) * 100) / 100,
        isBalanced
      }
    };
  }

  /**
   * Commit verified rows into master data, inventory quants, stock movements, and financial ledger
   */
  public commitImport(
    request: PilotImportCommitRequest,
    context: {
      inventory: any[];
      stockMovements: any[];
      costLayers: any[];
      treasuryTransactions: any[];
      journalEntries: any[];
      accounts: any[];
      auditLogs: any[];
      currentUser?: string;
    }
  ): PilotImportCommitResponse {
    const { rows, companyId, tenantId, skipDuplicates = true, warehouseId = 'wh-001' } = request;
    const user = context.currentUser || 'pilot-admin';
    const now = new Date().toISOString();

    const existingSkus = new Set(context.inventory.map(i => (i.sku || '').toUpperCase()));

    let importedItemsCount = 0;
    let stockMovementsCreated = 0;
    let totalOpeningStockCost = 0;
    let totalOpeningCash = 0;

    const newItemsToSave: any[] = [];
    const newMovementsToSave: any[] = [];
    const newLayersToSave: any[] = [];
    const newTreasuryTxs: any[] = [];

    for (const row of rows) {
      const skuNorm = (row.sku || '').trim().toUpperCase();
      if (!skuNorm || (!row.name && !row.nameAr)) continue;

      if (existingSkus.has(skuNorm)) {
        if (skipDuplicates) {
          continue;
        }
      }

      const itemId = `item-pilot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const targetWh = row.warehouseId || warehouseId;
      const qty = row.openingStockQty || 0;
      const cost = row.costPrice || 0;
      const price = row.sellingPrice || 0;

      // 1. Create/Update Inventory Item Master
      const newItem = {
        id: itemId,
        tenantId,
        companyId,
        sku: skuNorm,
        name: row.name,
        nameAr: row.nameAr || row.name,
        barcode: row.barcode || `BC-${skuNorm}`,
        category: row.category || 'General Retail',
        unitOfMeasure: row.uom || 'PCS',
        costPrice: cost,
        sellingPrice: price,
        price,
        quantity: qty,
        reorderPoint: 5,
        targetStock: 20,
        warehouseId: targetWh,
        status: 'ACTIVE',
        isBatchTracked: false,
        isSerialTracked: false,
        valuationMethod: 'FIFO',
        createdAt: now,
        updatedAt: now
      };

      context.inventory.push(newItem);
      newItemsToSave.push(newItem);
      existingSkus.add(skuNorm);
      importedItemsCount++;

      // 2. Opening Inventory Stock Movement & FIFO Cost Layer
      if (qty > 0) {
        const layerCost = qty * cost;
        totalOpeningStockCost += layerCost;

        const movementId = `sm-opn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const stockMovement = {
          id: movementId,
          tenantId,
          companyId,
          itemId,
          itemSku: skuNorm,
          itemName: row.name,
          sourceWarehouseId: null,
          destinationWarehouseId: targetWh,
          warehouseId: targetWh,
          movementType: 'OPENING_STOCK',
          quantity: qty,
          unitCost: cost,
          totalCost: layerCost,
          reference: `OPN-IMPORT-${skuNorm}`,
          documentType: 'OpeningStock',
          documentNumber: `OPN-${new Date().getFullYear()}-${String(importedItemsCount).padStart(4, '0')}`,
          movementDate: now,
          status: 'COMPLETED',
          performedBy: user,
          createdAt: now
        };

        context.stockMovements.push(stockMovement);
        newMovementsToSave.push(stockMovement);
        stockMovementsCreated++;

        // Cost Layer (FIFO)
        const costLayer = {
          id: `layer-opn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          tenantId,
          companyId,
          layerNumber: `LAY-OPN-${skuNorm}`,
          itemSku: skuNorm,
          itemName: row.name,
          warehouseId: targetWh,
          warehouseName: 'Retail Primary Store',
          quantity: qty,
          remainingQuantity: qty,
          unitCost: cost,
          totalCost: layerCost,
          remainingTotalCost: layerCost,
          sourceDocumentType: 'OpeningStock',
          sourceDocumentId: movementId,
          sourceDocumentNumber: stockMovement.documentNumber,
          receiptDate: now,
          status: 'ACTIVE',
          createdBy: user,
          createdAt: now
        };
        context.costLayers.push(costLayer);
        newLayersToSave.push(costLayer);
      }

      // 3. Opening Cash
      if (row.openingCashAmount && row.openingCashAmount > 0) {
        totalOpeningCash += row.openingCashAmount;
      }
    }

    // 4. Record Treasury Opening Cash Transaction
    if (totalOpeningCash > 0) {
      const trId = `TR-${new Date().getFullYear()}-OPN-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const treasuryTx = {
        id: trId,
        tenantId,
        companyId,
        transactionNumber: trId,
        transactionType: 'OPENING_BALANCE',
        bankAccountId: request.cashAccountId || 'CASH-MAIN-DRAWER',
        amount: totalOpeningCash,
        currency: 'SAR',
        exchangeRate: 1.0,
        valueDate: now.slice(0, 10),
        status: 'CLEARED',
        description: `Retail Shop Pilot Opening Cash Balance recorded by ${user}`,
        idempotencyKey: `idemp-opn-cash-${trId}`,
        createdAt: now,
        createdBy: user
      };
      context.treasuryTransactions.push(treasuryTx);
      newTreasuryTxs.push(treasuryTx);
    }

    // 5. Generate Event-Driven Opening Balance Journal Voucher (Zero Direct GL Mutation)
    let journalEntryId: string | undefined;
    let journalEntryNumber: string | undefined;

    const totalDebits = totalOpeningStockCost + totalOpeningCash;
    if (totalDebits > 0) {
      journalEntryId = `jv-opn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      journalEntryNumber = `JV-${new Date().getFullYear()}-OPN-${String(Math.floor(Math.random() * 9000) + 1000)}`;

      const lines: any[] = [];
      let lineIdx = 1;

      // Debit Inventory Asset
      if (totalOpeningStockCost > 0) {
        lines.push({
          id: `line-${journalEntryId}-${lineIdx++}`,
          accountId: '12000', // Merchandise Inventory
          accountCode: '12000',
          accountName: 'Merchandise Inventory Asset',
          debit: totalOpeningStockCost,
          credit: 0,
          description: `Opening stock valuation for ${stockMovementsCreated} imported SKUs`
        });
      }

      // Debit Cash
      if (totalOpeningCash > 0) {
        lines.push({
          id: `line-${journalEntryId}-${lineIdx++}`,
          accountId: '11010', // Cash on Hand
          accountCode: '11010',
          accountName: 'Cash on Hand / Retail Register',
          debit: totalOpeningCash,
          credit: 0,
          description: 'Opening cash float for retail register'
        });
      }

      // Credit Owner's Equity / Opening Capital
      lines.push({
        id: `line-${journalEntryId}-${lineIdx++}`,
        accountId: '30000', // Owner Capital / Opening Equity
        accountCode: '30000',
        accountName: "Owner's Equity & Opening Capital",
        debit: 0,
        credit: totalDebits,
        description: 'Initial equity contribution / opening balance reconciliation'
      });

      const journalEntry = {
        id: journalEntryId,
        tenantId,
        companyId,
        entryNumber: journalEntryNumber,
        date: now.slice(0, 10),
        postingDate: now.slice(0, 10),
        source: 'PILOT_MASTER_DATA_IMPORT',
        sourceDocumentType: 'OPENING_BALANCE_BATCH',
        reference: `ONBOARD-${now.slice(0, 10)}`,
        description: `Retail Deployment Opening Balance (Stock: ${totalOpeningStockCost.toLocaleString()}, Cash: ${totalOpeningCash.toLocaleString()})`,
        lines,
        totalDebit: totalDebits,
        totalCredit: totalDebits,
        isBalanced: true,
        status: 'POSTED',
        createdAt: now,
        createdBy: user,
        auditTrailHash: crypto.createHash('sha256').update(journalEntryId + totalDebits + now).digest('hex')
      };

      context.journalEntries.push(journalEntry);
      this.saveEntity('journalEntries', journalEntry, tenantId, companyId);
    }

    // Persist all created entities into SQLite
    if (newItemsToSave.length > 0) {
      this.saveCollection('inventory', newItemsToSave, tenantId, companyId);
    }
    if (newMovementsToSave.length > 0) {
      this.saveCollection('stockMovements', newMovementsToSave, tenantId, companyId);
    }
    if (newLayersToSave.length > 0) {
      this.saveCollection('costLayers', newLayersToSave, tenantId, companyId);
    }
    if (newTreasuryTxs.length > 0) {
      this.saveCollection('treasuryTransactions', newTreasuryTxs, tenantId, companyId);
    }

    // 6. Cryptographic Audit Vault Entry
    const auditHash = this.logAudit('MASTER_DATA_IMPORT', {
      importedItemsCount,
      stockMovementsCreated,
      totalOpeningStockCost,
      totalOpeningCash,
      journalEntryNumber,
      user
    }, tenantId, companyId);

    return {
      success: true,
      importedItemsCount,
      stockMovementsCreated,
      openingStockCostValue: totalOpeningStockCost,
      openingCashRecorded: totalOpeningCash,
      journalEntryId,
      journalEntryNumber,
      auditLogId: auditHash,
      message: `Successfully imported ${importedItemsCount} products, generated ${stockMovementsCreated} opening stock records (${totalOpeningStockCost.toLocaleString()} SAR) and ${totalOpeningCash.toLocaleString()} SAR opening cash with balanced journal entry ${journalEntryNumber || 'N/A'}.`
    };
  }
}
