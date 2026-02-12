/**
 * app/services/CryptoService.js
 *
 * A stateless service providing all necessary cryptographic functions.
 * It uses the browser's native Web Crypto API for secure and performant operations.
 * This service is the foundation of the app's security model.
 */
const CryptoService = {

    /**
     * Derives a strong 256-bit AES-GCM key from a user's PIN and a salt.
     * Uses PBKDF2 to make the key resistant to brute-force attacks.
     * @param {string} pin - The user's PIN.
     * @param {Uint8Array} salt - A unique, per-user salt.
     * @returns {Promise<CryptoKey>} A CryptoKey suitable for encryption and decryption.
     */
    async deriveKeyFromPIN(pin, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(pin),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        return window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 200000, // Increased iterations for stronger security
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    },

    /**
     * Encrypts a string of data using a provided CryptoKey.
     * @param {string} data - The plaintext data to encrypt.
     * @param {CryptoKey} key - The AES-GCM key derived from the user's PIN.
     * @returns {Promise<string>} A Base64 encoded string containing the IV and encrypted data.
     */
    async encrypt(data, key) {
        const encoder = new TextEncoder();
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV is standard for AES-GCM

        const encryptedData = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            encoder.encode(data)
        );

        // Prepend the IV to the encrypted data for use during decryption
        const combined = new Uint8Array(iv.length + encryptedData.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encryptedData), iv.length);

        // Convert the combined buffer to a Base64 string for easy storage
        return btoa(String.fromCharCode.apply(null, combined));
    },

    /**
     * Decrypts a Base64 encoded string using a provided CryptoKey.
     * @param {string} encryptedBase64 - The Base64 string from the encrypt function.
     * @param {CryptoKey} key - The AES-GCM key used for the original encryption.
     * @returns {Promise<string|null>} The decrypted plaintext string, or null if decryption fails.
     */
    async decrypt(encryptedBase64, key) {
        try {
            // Decode the Base64 string back to a byte array
            const combined = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));

            // Extract the IV and the encrypted data
            const iv = combined.slice(0, 12);
            const data = combined.slice(12);

            const decryptedData = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                data
            );

            const decoder = new TextDecoder();
            return decoder.decode(decryptedData);
        } catch (error) {
            console.error("Decryption failed. This could be due to an incorrect PIN or corrupted data.", error);
            return null; // Critical: Return null on any decryption error.
        }
    },

    /**
     * Generates a new, cryptographically secure salt.
     * @returns {Uint8Array} A 16-byte random salt.
     */
    generateSalt() {
        return window.crypto.getRandomValues(new Uint8Array(16));
    }
};

