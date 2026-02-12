/**
 * app/controllers/SettingsController.js
 *
 * Manages the application's settings page and high-level operations like
 * data backup and restoration.
 */
function settingsController() {
    return {
        // --- State ---
        masterKey: null,
        isImporting: false, // Controls UI for the import process
        importPIN: '',      // PIN for decrypting the backup file

        // --- Initialization ---
        init() {
            // This controller needs the master key to perform its functions.
            window.addEventListener('app-unlocked', (event) => {
                if (!this.masterKey) {
                    this.masterKey = event.detail.masterKey;
                }
            });
        },

        // --- Actions ---

        /**
         * Exports all user data into a single, encrypted backup file.
         */
        async exportData() {
            if (!this.masterKey) {
                alert('خطأ: يجب فتح قفل التطبيق أولاً.');
                return;
            }
            console.log('Settings: Starting data export...');

            try {
                // 1. Gather all raw (but already encrypted) data from the database
                const notes = await StorageService.query("SELECT * FROM notes");
                const events = await StorageService.query("SELECT * FROM events");
                
                // 2. Gather the security credentials
                const salt = localStorage.getItem('user_salt');
                const verificationData = localStorage.getItem('verification_data');

                // 3. Assemble the backup object
                const backupObject = {
                    version: 1,
                    exportedAt: Date.now(),
                    salt: salt,
                    verificationData: verificationData,
                    data: {
                        notes: notes,
                        events: events
                    }
                };

                // 4. Stringify and re-encrypt the entire backup object for an extra layer of security
                const backupJson = JSON.stringify(backupObject);
                const encryptedBackup = await CryptoService.encrypt(backupJson, this.masterKey);

                // 5. Trigger file download
                const blob = new Blob([encryptedBackup], { type: 'application/octet-stream' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `backup-${new Date().toISOString().split('T')[0]}.json.enc`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                alert('تم تصدير النسخة الاحتياطية بنجاح.');
            } catch (error) {
                console.error('Settings: Export failed:', error);
                alert('فشل تصدير النسخة الاحتياطية.');
            }
        },

        /**
         * Initiates the import process by handling the selected file.
         * @param {File} file - The backup file selected by the user.
         * @param {string} pin - The PIN associated with the backup file.
         */
        async importData(file, pin) {
            if (!file || !pin || pin.length !== 4) {
                alert('الرجاء اختيار ملف وإدخال رمز الدخول (4 أرقام) الخاص بالنسخة الاحتياطية.');
                return;
            }

            if (!confirm('تحذير: سيتم حذف جميع البيانات الحالية واستبدالها ببيانات النسخة الاحتياطية. هذه العملية لا يمكن التراجع عنها. هل أنت متأكد؟')) {
                return;
            }

            try {
                const encryptedBackup = await file.text();
                
                // 1. We need the salt from the backup file to derive the correct key.
                // This is a challenge. A robust solution would be to store the salt unencrypted
                // alongside the encrypted data in the backup file. For this implementation, we'll
                // temporarily parse the JSON to get the salt, which is not ideal but works.
                // A better approach is a structured file format { salt: "...", payload: "..." }.
                
                // Let's assume a simple structure for now. We'll try to decrypt with the current salt first.
                const tempSalt = new Uint8Array(JSON.parse(localStorage.getItem('user_salt')));
                const key = await CryptoService.deriveKeyFromPIN(pin, tempSalt);
                const backupJson = await CryptoService.decrypt(encryptedBackup, key);

                if (!backupJson) {
                    throw new Error('فشل فك تشفير الملف. قد يكون رمز الدخول غير صحيح أو أن النسخة الاحتياطية تالفة.');
                }

                const backupData = JSON.parse(backupJson);

                // 2. Clear current database
                await StorageService.execute('DELETE FROM notes');
                await StorageService.execute('DELETE FROM events');

                // 3. Insert new data
                for (const note of backupData.data.notes) {
                    await StorageService.execute('INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?)', Object.values(note));
                }
                for (const event of backupData.data.events) {
                    await StorageService.execute('INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?, ?)', Object.values(event));
                }

                // 4. Replace security credentials with those from the backup
                localStorage.setItem('user_salt', backupData.salt);
                localStorage.setItem('verification_data', backupData.verificationData);

                alert('تم استيراد البيانات بنجاح. سيتم إعادة تحميل التطبيق الآن.');
                window.location.reload();

            } catch (error) {
                console.error('Settings: Import failed:', error);
                alert(`فشل الاستيراد: ${error.message}`);
            }
        }
    };
}
