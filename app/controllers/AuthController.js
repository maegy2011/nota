/**
 * app/controllers/AuthController.js
 *
 * Manages the entire authentication lifecycle of the application.
 * - Checks if a user is new or returning.
 * - Handles the setup of a new PIN.
 * - Verifies the PIN for returning users.
 * - Holds the masterKey and dispatches it to the app upon successful unlock.
 */
function authController() {
    return {
        // --- State ---
        isLocked: true,
        isNewUser: false,
        masterKey: null,

        // --- Initialization ---
        init() {
            // Check if security credentials (salt, verification data) exist
            const salt = localStorage.getItem('user_salt');
            const verificationData = localStorage.getItem('verification_data');

            if (!salt || !verificationData) {
                this.isNewUser = true;
                console.log("Auth: No credentials found. New user setup required.");
            } else {
                this.isNewUser = false;
                console.log("Auth: Credentials found. Awaiting PIN.");
            }
        },

        // --- Actions ---

        /**
         * Handles the unlock attempt event from the pin-lock-screen.
         * @param {CustomEvent} event - The event containing the user's PIN.
         */
        async handleUnlockAttempt(event) {
            const pin = event.detail.pin;
            const salt = new Uint8Array(JSON.parse(localStorage.getItem('user_salt')));
            const verificationData = localStorage.getItem('verification_data');

            // 1. Derive key from the provided PIN and stored salt
            const key = await CryptoService.deriveKeyFromPIN(pin, salt);

            // 2. Attempt to decrypt the verification data
            const decrypted = await CryptoService.decrypt(verificationData, key);

            // 3. Check if decryption was successful and the content matches
            if (decrypted === 'verified') {
                console.log("Auth: Unlock successful.");
                this.masterKey = key;
                this.isLocked = false;
                // Announce to the entire application that it is unlocked and provide the key
                this.$dispatch('app-unlocked', { masterKey: this.masterKey });
            } else {
                console.warn("Auth: Unlock failed. Incorrect PIN.");
                // Announce that the unlock attempt failed so the UI can react
                this.$dispatch('unlock-failed');
            }
        },

        /**
         * Sets up the application for a new user by creating and storing security credentials.
         * @param {string} pin - The new PIN chosen by the user.
         */
        async setupNewPIN(pin) {
            if (!this.isNewUser) return;
            console.log('Auth: Setting up new PIN...');

            // 1. Generate a new, unique salt
            const salt = CryptoService.generateSalt();

            // 2. Derive a master key from the new PIN and salt
            const key = await CryptoService.deriveKeyFromPIN(pin, salt);

            // 3. Create a verification message and encrypt it with the new key
            const verificationMessage = 'verified';
            const verificationData = await CryptoService.encrypt(verificationMessage, key);

            // 4. Store the salt and encrypted verification data in localStorage
            localStorage.setItem('user_salt', JSON.stringify(Array.from(salt)));
            localStorage.setItem('verification_data', verificationData);

            console.log('Auth: New user setup complete.');
            alert('تم إعداد رمز الدخول بنجاح. سيتم إعادة تحميل التطبيق.');
            window.location.reload();
        }
    };
}

