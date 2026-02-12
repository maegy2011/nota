/**
 * app/models/Event.js
 * 
 * The Model for managing calendar events. It handles all CRUD operations for events,
 * encrypting sensitive fields and interacting with the StorageService.
 * It also manages queries for fetching events within a specific date range.
 */
const Event = {

    /**
     * Creates a new event and saves it to the database.
     * @param {object} eventData - The event data.
     * @param {CryptoKey} masterKey - The master key for encryption.
     * @returns {Promise<object>} The newly created event object.
     */
    async create(eventData, masterKey) {
        const { title, description = '', startTime, endTime, isAllDay = false, calendarType, rrule = null } = eventData;
        const id = crypto.randomUUID();

        const encryptedTitle = await CryptoService.encrypt(title, masterKey);
        const encryptedDescription = await CryptoService.encrypt(description, masterKey);
        const encryptedRrule = rrule ? await CryptoService.encrypt(rrule, masterKey) : null;

        const sql = `
            INSERT INTO events (id, title_encrypted, description_encrypted, start_time, end_time, is_all_day, calendar_type, rrule_encrypted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [id, encryptedTitle, encryptedDescription, startTime, endTime, isAllDay ? 1 : 0, calendarType, encryptedRrule];
        
        await StorageService.execute(sql, params);
        return { id, ...eventData };
    },

    /**
     * Finds events within a given date range.
     * @param {number} startDate - The start of the range (Unix Timestamp).
     * @param {number} endDate - The end of the range (Unix Timestamp).
     * @param {CryptoKey} masterKey - The master key for decryption.
     * @returns {Promise<Array<object>>} An array of event objects in the range.
     */
    async findByDateRange(startDate, endDate, masterKey) {
        const sql = `
            SELECT * FROM events 
            WHERE start_time >= ? AND start_time <= ? 
            ORDER BY start_time ASC
        `;
        const rows = await StorageService.query(sql, [startDate, endDate]);
        return Promise.all(rows.map(row => this.decryptRow(row, masterKey)));
    },
    
    /**
     * Updates an existing event.
     * @param {string} id - The ID of the event to update.
     * @param {object} updatedData - The new data for the event.
     * @param {CryptoKey} masterKey - The master key for encryption.
     * @returns {Promise<void>}
     */
    async update(id, updatedData, masterKey) {
        const { title, description, startTime, endTime, isAllDay, calendarType, rrule } = updatedData;

        const encryptedTitle = await CryptoService.encrypt(title, masterKey);
        const encryptedDescription = await CryptoService.encrypt(description, masterKey);
        const encryptedRrule = rrule ? await CryptoService.encrypt(rrule, masterKey) : null;

        const sql = `
            UPDATE events
            SET title_encrypted = ?, description_encrypted = ?, start_time = ?, end_time = ?, 
                is_all_day = ?, calendar_type = ?, rrule_encrypted = ?
            WHERE id = ?
        `;
        
        const params = [encryptedTitle, encryptedDescription, startTime, endTime, isAllDay ? 1 : 0, calendarType, encryptedRrule, id];
        
        await StorageService.execute(sql, params);
    },

    /**
     * Deletes an event from the database.
     * @param {string} id - The ID of the event to delete.
     * @returns {Promise<void>}
     */
    async delete(id) {
        const sql = "DELETE FROM events WHERE id = ?";
        await StorageService.execute(sql, [id]);
    },

    /**
     * Helper function to decrypt a single database row into a clean event object.
     * @param {object} row - The raw row object from StorageService.
     * @param {CryptoKey} masterKey - The master key for decryption.
     * @returns {Promise<object>} The decrypted and formatted event object.
     * @private
     */
    async decryptRow(row, masterKey) {
        const [title, description, rrule] = await Promise.all([
            CryptoService.decrypt(row.title_encrypted, masterKey),
            CryptoService.decrypt(row.description_encrypted, masterKey),
            row.rrule_encrypted ? CryptoService.decrypt(row.rrule_encrypted, masterKey) : Promise.resolve(null)
        ]);

        return {
            id: row.id,
            title,
            description,
            startTime: row.start_time,
            endTime: row.end_time,
            isAllDay: row.is_all_day === 1,
            calendarType: row.calendar_type,
            rrule
        };
    }
};
