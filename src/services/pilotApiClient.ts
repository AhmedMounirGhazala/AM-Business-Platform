/**
 * AM Business Platform - Pilot API Client
 * Facilitates communication with backend SQLite persistence, Backup/Restore, and Master Data CSV Import
 */

import {
  PilotDatabaseStatus,
  PilotBackupMetadata,
  PilotBackupPayload,
  PilotRestoreResult,
  PilotImportPreviewResponse,
  PilotImportCommitRequest,
  PilotImportCommitResponse,
  PilotMasterDataImportRow,
  StoragePersistenceReport
} from '../types/pilot';

export class PilotApiClient {
  private static baseUrl = '/api/v1/pilot';

  public static async getStatus(): Promise<PilotDatabaseStatus> {
    const res = await fetch(`${this.baseUrl}/status`);
    if (!res.ok) {
      throw new Error(`Failed to fetch database status: ${res.statusText}`);
    }
    return res.json();
  }

  public static async listBackups(): Promise<PilotBackupMetadata[]> {
    const res = await fetch(`${this.baseUrl}/backups`);
    if (!res.ok) {
      throw new Error(`Failed to fetch backups list: ${res.statusText}`);
    }
    return res.json();
  }

  public static async createBackup(snapshotName: string): Promise<{ success: boolean; backup: PilotBackupPayload }> {
    const res = await fetch(`${this.baseUrl}/backups/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshotName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Failed to create backup');
    }
    return res.json();
  }

  public static async downloadBackupFile(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/backup`);
    if (!res.ok) {
      throw new Error('Failed to generate export backup');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `am_erp_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  public static async restoreBackup(payload: PilotBackupPayload): Promise<PilotRestoreResult> {
    const res = await fetch(`${this.baseUrl}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || data.message || 'Failed to restore database');
    }
    return data;
  }

  public static async previewImport(
    csvContent?: string,
    rows?: PilotMasterDataImportRow[]
  ): Promise<PilotImportPreviewResponse> {
    const res = await fetch(`${this.baseUrl}/import/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvContent, rows })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to preview CSV import');
    }
    return data;
  }

  public static async commitImport(request: PilotImportCommitRequest): Promise<PilotImportCommitResponse> {
    const res = await fetch(`${this.baseUrl}/import/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || data.message || 'Failed to commit master data import');
    }
    return data;
  }

  public static async getPersistenceReport(): Promise<StoragePersistenceReport> {
    const res = await fetch(`${this.baseUrl}/persistence`);
    if (!res.ok) {
      throw new Error(`Failed to fetch persistence report: ${res.statusText}`);
    }
    const data = await res.json();
    return data.report;
  }

  public static async triggerCheckpoint(mode: 'PASSIVE' | 'FULL' | 'RESTART' | 'TRUNCATE' = 'PASSIVE'): Promise<{
    mode: string;
    busy: number;
    log: number;
    checkpointed: number;
  }> {
    const res = await fetch(`${this.baseUrl}/checkpoint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to checkpoint WAL');
    }
    return data.checkpoint;
  }

  public static async runPhase3DQualityGate(): Promise<any> {
    const res = await fetch('/api/v1/pos/tests/pilot-readiness-3d/run');
    if (!res.ok) {
      throw new Error(`Failed to run Phase 3D Quality Gate: ${res.statusText}`);
    }
    const data = await res.json();
    return data.report;
  }
}
