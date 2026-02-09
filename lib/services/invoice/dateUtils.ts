/**
 * Date calculation utilities for invoice generation
 */

/**
 * Get the first day of the current month
 */
export function getFirstDayOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Check if a date falls on a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Get the previous business day (skip weekends)
 */
export function getPreviousBusinessDay(date: Date): Date {
  const result = new Date(date);

  // Move backwards until we find a weekday
  while (isWeekend(result)) {
    result.setDate(result.getDate() - 1);
  }

  return result;
}

/**
 * Get the last day of a given month
 */
export function getLastDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Calculate payment deadline for the current month
 * - Default: 25th of the month
 * - If 25th is weekend, use previous business day
 * - Can optionally use last business day of month instead
 */
export function getPaymentDeadline(
  baseDate: Date = new Date(),
  useLastBusinessDay: boolean = false
): Date {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  if (useLastBusinessDay) {
    const lastDay = getLastDayOfMonth(baseDate);
    return getPreviousBusinessDay(lastDay);
  }

  // Default: use 25th of the month
  const deadline = new Date(year, month, 25);

  // If it's a weekend, move to previous business day
  if (isWeekend(deadline)) {
    return getPreviousBusinessDay(deadline);
  }

  return deadline;
}

/**
 * Generate invoice number based on date
 * Format: INV-YYYYMMDD###
 */
export function generateInvoiceNumber(date: Date, sequence: number = 1): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const seq = String(sequence).padStart(3, '0');

  return `INV-${year}${month}${day}${seq}`;
}

/**
 * Format date as YYYY-MM-DD for display
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
