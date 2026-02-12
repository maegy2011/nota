/**
 * app/services/StorageService.js
 *
 * Manages the SQLite database persistence layer.
 */
const StorageService = {
    db: null,
    dbName: 'app_database',
    dbStoreName: 'database_file',
    isInitialized: false,
    isSaving: false,
    saveQueue: false,

    async init() {
        if (this.isInitialized) return;

        try {
            const SQL = await initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
            });

            const dbFile = await this.loadDbFromIndexedDB();

            if (dbFile) {
                console.log("StorageService: Loading existing database from IndexedDB.");
                this.db = new SQL.Database(dbFile);
            } else {
                console.log("StorageService: No existing database found. Creating a new one.");
                this.db = new SQL.Database();
                // --- FIX START ---
                // Set initialized to true BEFORE creating the schema.
                this.isInitialized = true; 
                await this.createSchema();
                // --- FIX END ---
            }

            // If we loaded an existing DB, set initialized to true here.
            if (!this.isInitialized) {
                this.isInitialized = true;
            }
            console.log("StorageService: Database initialized successfully.");

        } catch (error) {
            console.error("StorageService: Initialization failed.", error);
            this.isInitialized = false;
        }
    },

    async query(sql, params = []) {
        if (!this.isInitialized) throw new Error("Database not initialized.");
        const results = this.db.exec(sql, params);
        if (results.length === 0) return [];
        const columns = results[0].columns;
        return results[0].values.map(row => {
            const obj = {};
            columns.forEach((col, i) => { obj[col] = row[i]; });
            return obj;
        });
    },

    async execute(sql, params = []) {
        if (!this.isInitialized) throw new Error("Database not initialized.");
        this.db.run(sql, params);
        await this.scheduleSave();
    },

    async scheduleSave() {
        if (this.isSaving) {
            this.saveQueue = true;
            return;
        }
        this.isSaving = true;
        await this.saveDbToIndexedDB();
        this.isSaving = false;
        if (this.saveQueue) {
            this.saveQueue = false;
            await this.scheduleSave();
        }
    },

    async saveDbToIndexedDB() {
        return new Promise((resolve, reject) => {
            const dbData = this.db.export();
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.dbStoreName)) {
                    db.createObjectStore(this.dbStoreName);
                }
            };
            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction([this.dbStoreName], 'readwrite');
                transaction.objectStore(this.dbStoreName).put(dbData, 'db_file');
                transaction.oncomplete = () => resolve();
                transaction.onerror = (err) => reject(err);
            };
            request.onerror = (err) => reject(err);
        });
    },

    async loadDbFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (event) => {
                if (!event.target.result.objectStoreNames.contains(this.dbStoreName)) {
                    event.target.result.createObjectStore(this.dbStoreName);
                }
            };
            request.onsuccess = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.dbStoreName)) {
                    resolve(null);
                    return;
                }
                const getRequest = db.transaction([this.dbStoreName], 'readonly').objectStore(this.dbStoreName).get('db_file');
                getRequest.onsuccess = () => resolve(getRequest.result || null);
                getRequest.onerror = (err) => reject(err);
            };
            request.onerror = (err) => reject(err);
        });
    },

    async createSchema() {
        const schema = `
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY, title_encrypted TEXT, content_encrypted TEXT,
                created_at INTEGER, updated_at INTEGER, tags_encrypted TEXT, is_favorite INTEGER DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY, title_encrypted TEXT NOT NULL, description_encrypted TEXT,
                start_time INTEGER NOT NULL, end_time INTEGER, is_all_day INTEGER DEFAULT 0,
                calendar_type TEXT NOT NULL, rrule_encrypted TEXT
            );
            CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
            CREATE TABLE IF NOT EXISTS settings ( key TEXT PRIMARY KEY, value TEXT NOT NULL );
        `;
        await this.execute(schema);
        console.log("StorageService: Database schema created.");
    }
};

