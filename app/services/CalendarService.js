/**
 * app/services/CalendarService.js
 *
 * A stateless service for handling complex date and calendar-related logic,
 * primarily conversions between Gregorian and Hijri calendars.
 * It relies on the moment-hijri library.
 */
const CalendarService = {

    /**
     * Converts a Gregorian date to its Hijri equivalent.
     * @param {Date|number} gregorianDate - A Date object or Unix timestamp.
     * @returns {{hYear: number, hMonth: number, hDay: number, hMonthName: string}} Hijri date components.
     */
    toHijri(gregorianDate) {
        const m = moment(gregorianDate);
        return {
            hYear: m.iYear(),
            hMonth: m.iMonth() + 1, // moment-hijri months are 0-indexed
            hDay: m.iDate(),
            hMonthName: m.format('iMMMM') // e.g., 'رمضان'
        };
    },

    /**
     * Converts a Hijri date to its Gregorian equivalent.
     * @param {number} hYear - The Hijri year.
     * @param {number} hMonth - The Hijri month (1-12).
     * @param {number} hDay - The Hijri day.
     * @returns {Date} The corresponding Gregorian Date object.
     */
    toGregorian(hYear, hMonth, hDay) {
        // moment-hijri months are 0-indexed, so we subtract 1
        return moment(`${hYear}/${hMonth}/${hDay}`, 'iYYYY/iM/iD').toDate();
    },

    /**
     * Gets the number of days in a specific Hijri month.
     * @param {number} hYear - The Hijri year.
     * @param {number} hMonth - The Hijri month (1-12).
     * @returns {number} The number of days in that month (29 or 30).
     */
    daysInHijriMonth(hYear, hMonth) {
        return moment(`${hYear}/${hMonth}`, 'iYYYY/iM').iDaysInMonth();
    },

    /**
     * Formats a date object to show both Gregorian and Hijri dates.
     * @param {Date|number} date - The date to format.
     * @returns {string} A formatted string, e.g., "11 فبراير 2026 / 14 رجب 1447".
     */
    formatDualCalendar(date) {
        const m = moment(date);
        const gregorianPart = m.locale('ar-eg').format('D MMMM YYYY');
        const hijriPart = m.format('iD iMMMM iYYYY');
        return `${gregorianPart} / ${hijriPart}`;
    }
};
