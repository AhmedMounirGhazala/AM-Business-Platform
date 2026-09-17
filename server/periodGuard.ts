import { Express, NextFunction, Request, Response } from 'express';

type PeriodRecord = {
  fiscalYear?: number;
  fiscalPeriod?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  isLocked?: boolean;
};

const financialPrefixes = [
  '/api/v1/gl/',
  '/api/v1/ar/',
  '/api/v1/ap/',
  '/api/v1/inventory/',
  '/api/v1/treasury/',
  '/api/v1/assets/',
  '/api/v1/mfg/',
  '/api/v1/procurement/',
  '/api/v1/sales/',
  '/api/v1/reports/reconciliation'
];

function isFinancialMutation(req: Request): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
    financialPrefixes.some(prefix => req.path.startsWith(prefix));
}

function resolveTargetPeriod(req: Request, periods: PeriodRecord[]): PeriodRecord | undefined {
  const fiscalYear = Number(req.body?.fiscalYear);
  const fiscalPeriod = Number(req.body?.fiscalPeriod);
  if (Number.isInteger(fiscalYear) && Number.isInteger(fiscalPeriod)) {
    return periods.find(period =>
      period.fiscalYear === fiscalYear && period.fiscalPeriod === fiscalPeriod
    );
  }

  const dateValue = req.body?.postingDate || req.body?.transactionDate || req.body?.date ||
    req.body?.valuationDate || req.body?.startDate || req.query?.postingDate ||
    req.query?.transactionDate || req.query?.date;
  if (!dateValue) return undefined;
  const targetTime = new Date(String(dateValue)).getTime();
  if (!Number.isFinite(targetTime)) return undefined;
  return periods.find(period => {
    const start = new Date(String(period.startDate)).getTime();
    const end = new Date(String(period.endDate)).getTime();
    return Number.isFinite(start) && Number.isFinite(end) && targetTime >= start && targetTime <= end;
  });
}

export function registerPeriodGuardMiddleware(
  app: Express,
  getPeriods: () => PeriodRecord[]
): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!isFinancialMutation(req)) return next();
    const targetPeriod = resolveTargetPeriod(req, getPeriods());
    if (!targetPeriod) return next();

    const normalizedStatus = String(targetPeriod.status || '').toUpperCase();
    if (targetPeriod.isLocked || normalizedStatus === 'LOCKED' || normalizedStatus === 'CLOSED') {
      return res.status(409).json({
        error: 'Financial mutation rejected because the target period is closed or locked.',
        fiscalYear: targetPeriod.fiscalYear,
        fiscalPeriod: targetPeriod.fiscalPeriod,
        status: targetPeriod.status || (targetPeriod.isLocked ? 'LOCKED' : 'CLOSED')
      });
    }
    next();
  });
}
