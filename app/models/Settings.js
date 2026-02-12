/**
 * app/models/Settings.js
 * 
 * A simple key-value store model for managing application settings.
 * This model interacts with the 'settings' table in the database.
 * It's designed for non-sensitive data. For sensitive settings,
 * values should be encrypted before being passed to this model.
 */
const Settings = {

    /**
     * Retrieves a value for a given key.
     * @param {string} key - The key of the setting to retrieve.
     * @param {any} defaultValue - The value to return if the key is not found.
     * @returns {Promise<any>} The value of the setting, or the default value.
     */
    async get(key, defaultValue = null) {
        const sql = "SELECT value FROM settings WHERE key = ?";
        const rows = await StorageService.query(sql, [key]);

        if (rows.length === 0) {
            return defaultValue;
        }
        
        // Values are stored as JSON strings to support various data types
        return JSON.parse(rows[0].value);
    },

    /**
     * Sets a value for a given key. This performs an "upsert" (update or insert).
     * @param {string} key - The key of the setting to set.
     * @param {any} value - The value to store. It will be JSON.stringified.
     * @returns {Promise<void>}
     */
    async set(key, value) {
        const jsonValue = JSON.stringify(value);
        
        // Using REPLACE INTO is a concise way to handle upserts in SQLite
        const sql = "REPLACE INTO settings (key, value) VALUES (?, ?)";
        
        await StorageService.execute(sql, [key, jsonValue]);
    },

    /**
     * Retrieves all settings as a single object.
     * @returns {Promise<object>} An object containing all settings.
     */
    async getAll() {
        const sql = "SELECT key, value FROM settings";
        const rows = await StorageService.query(sql);
        
        const settings = {};
        for (const row of rows) {
            settings[row.key] = JSON.parse(row.value);
        }
        return settings;
    }
};
