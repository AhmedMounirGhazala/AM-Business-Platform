/**
 * AM Business Platform - Formatting & Localization Utilities
 */

import { Currency } from '../types';

export const CURRENCY_SYMBOLS: Record<string, { symbol: string; symbolAr: string }> = {
  SAR: { symbol: 'SAR', symbolAr: 'ر.س' },
  EGP: { symbol: 'EGP', symbolAr: 'ج.م' },
  AED: { symbol: 'AED', symbolAr: 'د.إ' },
  USD: { symbol: '$', symbolAr: '$' },
  EUR: { symbol: '€', symbolAr: '€' },
  GBP: { symbol: '£', symbolAr: '£' },
  KWD: { symbol: 'KWD', symbolAr: 'د.ك' },
  QAR: { symbol: 'QAR', symbolAr: 'ر.ق' },
  OMR: { symbol: 'OMR', symbolAr: 'ر.ع' },
  BHD: { symbol: 'BHD', symbolAr: 'د.ب' },
  JOD: { symbol: 'JOD', symbolAr: 'د.أ' },
  MAD: { symbol: 'MAD', symbolAr: 'د.م' },
  DZD: { symbol: 'DZD', symbolAr: 'د.ج' },
};

/**
 * Format monetary amount dynamically with company currency
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'SAR',
  isAr: boolean = false
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }

  const formattedNum = amount.toLocaleString(isAr ? 'ar-SA' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const currInfo = CURRENCY_SYMBOLS[currencyCode];
  const symbol = isAr ? (currInfo?.symbolAr || currencyCode) : (currInfo?.symbol || currencyCode);

  return isAr ? `${formattedNum} ${symbol}` : `${symbol} ${formattedNum}`;
}

/**
 * Format percentage
 */
export function formatPercent(rate: number, isAr: boolean = false): string {
  return `${rate}%`;
}
