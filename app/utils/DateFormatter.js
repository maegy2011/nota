/**
 * app/utils/DateFormatter.js
 *
 * A utility object containing helper functions for consistently formatting dates and times
 * throughout the application's UI. It's designed for the Egyptian Arabic locale.
 */
const DateFormatter = {

    /**
     * Formats a date for display in lists (e.g., note list).
     * Shows relative time for recent dates and a full date for older ones.
     * @param {number} timestamp - The Unix timestamp.
     * @returns {string} A user-friendly, formatted date string.
     */
    formatForList(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffSeconds = (now.getTime() - date.getTime()) / 1000;
        const diffDays = diffSeconds / (60 * 60 * 24);

        if (diffDays < 1 && date.getDate() === now.getDate()) {
            // Today: show time
            return date.toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
        } else if (diffDays < 2 && date.getDate() === now.getDate() - 1) {
            // Yesterday
            return 'الأمس';
        } else if (diffDays < 7) {
            // Within the last week: show day name
            return date.toLocaleDateString('ar-EG', { weekday: 'long' });
        } else {
            // Older: show full date
            return date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' });
        }
    },

    /**
     * Formats a time for display in event lists.
     * @param {number} timestamp - The Unix timestamp.
     * @returns {string} A formatted time string (e.g., "٠٣:٣٠ م").
     */
    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString('ar-EG', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    },

    /**
     * Formats a date for use in a calendar header.
     * @param {Date} date - The date object.
     * @returns {string} A formatted month and year (e.g., "فبراير ٢٠٢٦").
     */
    formatCalendarHeader(date) {
        return date.toLocaleDateString('ar-EG', {
            month: 'long',
            year: 'numeric'
        });
    },

    /**
     * A simple utility to truncate text without breaking words.
     * @param {string} text - The text to truncate.
     * @param {number} length - The maximum length.
     * @returns {string} The truncated text.
     */
    truncate(text, length) {
        if (!text) return '';
        const cleanText = text.replace(/<[^>]+>/g, ''); // Strip HTML tags
        if (cleanText.length <= length) return cleanText;
        return cleanText.substring(0, length) + '...';
    }
};
