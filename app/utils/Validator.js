/**
 * app/utils/Validator.js
 *
 * A utility object for common client-side validation tasks.
 * These functions help ensure data is in the correct format before processing.
 */
const Validator = {

    /**
     * Checks if a value is a non-empty string.
     * @param {string} value - The value to check.
     * @returns {boolean} True if the value is a non-empty string.
     */
    isNotEmpty(value) {
        return typeof value === 'string' && value.trim().length > 0;
    },

    /**
     * Checks if a value is a valid 4-digit PIN.
     * @param {string} pin - The PIN to check.
     * @returns {boolean} True if the value is a 4-digit string.
     */
    isPin(pin) {
        return /^\d{4}$/.test(pin);
    },

    /**
     * Checks if two values are identical. Useful for "confirm PIN" or "confirm password" fields.
     * @param {any} value1 - The first value.
     * @param {any} value2 - The second value.
     * @returns {boolean} True if the values are identical.
     */
    areEqual(value1, value2) {
        return value1 === value2;
    },

    /**
     * Checks if a value is a valid email address format.
     * @param {string} email - The email to check.
     * @returns {boolean} True if the value has a valid email format.
     */
    isEmail(email) {
        if (!email || typeof email !== 'string') return false;
        // A simple, common regex for email validation.
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Checks if a value is within a specified length range.
     * @param {string} value - The string to check.
     * @param {object} options - The min and max length.
     * @param {number} [options.min=0] - The minimum required length.
     * @param {number} [options.max=Infinity] - The maximum allowed length.
     * @returns {boolean} True if the string's length is within the range.
     */
    hasLength(value, { min = 0, max = Infinity }) {
        if (typeof value !== 'string') return false;
        return value.length >= min && value.length <= max;
    }
};
