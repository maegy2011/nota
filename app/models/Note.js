/**
 * app/models/Note.js
 * 
 * The Model for managing notes. It is responsible for all CRUD (Create, Read, Update, Delete)
 * operations related to notes. It interacts with the StorageService to persist data
 * and the CryptoService to ensure note content and titles are always encrypted at rest.
 * 
 * This model knows NOTHING about the UI. It only deals with data.
 */
const Note = {

    /**
     * Creates a new note, encrypts its data, and saves it to the database.
     * @param {object} noteData - The note data ({ title, content, tags, is_favorite }).
     * @param {CryptoKey} masterKey - The master key for encryption.
     * @returns {Promise<object>} The newly created note object (decrypted).
     */
    async create(noteData, masterKey) {
        const { title, content, tags = [], is_favorite = false } = noteData;
        const id = crypto.randomUUID();
        const now = Date.now();

        // Encrypt all user-provided fields
        const encryptedTitle = await CryptoService.encrypt(title || '', masterKey);
        const encryptedContent = await CryptoService.encrypt(content || '', masterKey);
        const encryptedTags = await CryptoService.encrypt(JSON.stringify(tags), masterKey);

        const sql = `
            INSERT INTO notes (id, title_encrypted, content_encrypted, created_at, updated_at, tags_encrypted, is_favorite)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [id, encryptedTitle, encryptedContent, now, now, encryptedTags, is_favorite ? 1 : 0];
        
        await StorageService.execute(sql, params);
        
        return { id, title, content, tags, is_favorite, createdAt: now, updatedAt: now };
    },

    /**
     * Retrieves all notes from the database and decrypts them.
     * @param {CryptoKey} masterKey - The master key for decryption.
     * @returns {Promise<Array<object>>} An array of all note objects.
     */
    async findAll(masterKey) {
        const rows = await StorageService.query("SELECT * FROM notes ORDER BY updated_at DESC");
        
        // Use Promise.all for efficient, parallel decryption
        return Promise.all(rows.map(row => this.decryptRow(row, masterKey)));
    },

    /**
     * Finds a single note by its ID and decrypts it.
     * @param {string} id - The UUID of the note.
     * @param {CryptoKey} masterKey - The master key for decryption.
     * @returns {Promise<object|null>} The decrypted note object, or null if not found.
     */
    async findById(id, masterKey) {
        const rows = await StorageService.query("SELECT * FROM notes WHERE id = ?", [id]);
        if (rows.length === 0) {
            return null;
        }
        return this.decryptRow(rows[0], masterKey);
    },

    /**
     * Updates an existing note.
     * @param {string} id - The ID of the note to update.
     * @param {object} updatedData - The new data for the note ({ title, content, tags, is_favorite }).
     * @param {CryptoKey} masterKey - The master key for encryption.
     * @returns {Promise<void>}
     */
    async update(id, updatedData, masterKey) {
        const { title, content, tags, is_favorite } = updatedData;
        const now = Date.now();

        const encryptedTitle = await CryptoService.encrypt(title, masterKey);
        const encryptedContent = await CryptoService.encrypt(content, masterKey);
        const encryptedTags = await CryptoService.encrypt(JSON.stringify(tags), masterKey);

        const sql = `
            UPDATE notes
            SET title_encrypted = ?, content_encrypted = ?, updated_at = ?, tags_encrypted = ?, is_favorite = ?
            WHERE id = ?
        `;
        
        const params = [encryptedTitle, encryptedContent, now, encryptedTags, is_favorite ? 1 : 0, id];
        
        await StorageService.execute(sql, params);
    },

    /**
     * Deletes a note from the database.
     * @param {string} id - The ID of the note to delete.
     * @returns {Promise<void>}
     */
    async delete(id) {
        const sql = "DELETE FROM notes WHERE id = ?";
        await StorageService.execute(sql, [id]);
    },

    /**
     * Helper function to decrypt a single database row into a clean note object.
     * @param {object} row - The raw row object from StorageService.
     * @param {CryptoKey} masterKey - The master key for decryption.
     * @returns {Promise<object>} The decrypted and formatted note object.
     * @private
     */
    async decryptRow(row, masterKey) {
        // Decrypt fields in parallel for better performance
        const [title, content, tags] = await Promise.all([
            CryptoService.decrypt(row.title_encrypted, masterKey),
            CryptoService.decrypt(row.content_encrypted, masterKey),
            CryptoService.decrypt(row.tags_encrypted, masterKey).then(JSON.parse)
        ]);

        return {
            id: row.id,
            title,
            content,
            tags,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            isFavorite: row.is_favorite === 1
        };
    }
};
