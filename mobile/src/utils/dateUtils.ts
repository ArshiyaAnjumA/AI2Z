/**
 * Centralized date utility to ensure consistent "today" calculations
 * across the app, respecting the user's local timezone.
 */

/**
 * Returns the current date in local YYYY-MM-DD format (using en-CA locale).
 * This prevents UTC drift where midnight UTC is != local midnight.
 */
export const getTodayString = (): string => {
    return new Date().toLocaleDateString('en-CA');
};

/**
 * Formats any date object or timestamp string to local YYYY-MM-DD.
 */
export const formatToLocalDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-CA');
};
