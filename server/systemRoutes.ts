import { Express, Request, Response } from 'express';
import { PilotDatabaseService } from './pilotDatabase';

export interface SystemRoutesOptions {
  pilotDb: PilotDatabaseService;
}

export function registerSystemRoutes(
  app: Express,
  { pilotDb }: SystemRoutesOptions,
): void {
  // Liveness probe: verifies the process is alive and responsive.
  app.get('/api/health', (_req: Request, res: Response) => {
    const report = pilotDb.getPersistenceReport();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      engine: 'AM ERP Enterprise Pilot Kernel',
      database: {
        status: 'ACTIVE',
        walMode: report.walMode,
        storageType: report.storageType,
        isPersistent: report.isPersistent,
        readinessStatus: report.readinessStatus
      }
    });
  });

  // Readiness probe: fails with 503 when persistence is not guaranteed.
  app.get('/api/readiness', (_req: Request, res: Response) => {
    const report = pilotDb.getPersistenceReport();
    const isReady = report.readinessStatus === 'READY';
    if (!isReady) {
      res.status(503).json({
        status: 'not_ready',
        error: 'PERSISTENCE_NOT_GUARANTEED',
        message: report.operationalMessage,
        remedyInstructions: report.remedyInstructions,
        persistence: report
      });
      return;
    }
    res.json({
      status: 'ready',
      message: report.operationalMessage,
      persistence: report
    });
  });
}
