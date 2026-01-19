/**
 * Utility functions for data formatting
 */

/**
 * Convert ISO country code to flag emoji
 */
export function getCountryFlag(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) {
        return '';
    }

    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map((char) => 127397 + char.charCodeAt(0));

    return String.fromCodePoint(...codePoints);
}

/**
 * Format ISO date string to readable format
 */
export function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return dateString;
    }
}
