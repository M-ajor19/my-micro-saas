/**
 * Client-side encryption utilities for ResponseAI
 * Note: For maximum security, sensitive operations should be done server-side
 * This is for non-critical data encryption and demonstration purposes
 */

class ClientEncryption {
    constructor() {
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
    }

    /**
     * Generate a random encryption key for client-side use
     */
    async generateKey() {
        const key = await crypto.subtle.generateKey(
            {
                name: "AES-GCM",
                length: 256
            },
            true,
            ["encrypt", "decrypt"]
        );
        
        const exported = await crypto.subtle.exportKey("raw", key);
        return btoa(String.fromCharCode(...new Uint8Array(exported)));
    }

    /**
     * Import a key from base64 string
     */
    async importKey(keyData) {
        const keyBytes = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
        return await crypto.subtle.importKey(
            "raw",
            keyBytes,
            { name: "AES-GCM" },
            false,
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Encrypt data using Web Crypto API (AES-GCM)
     */
    async encryptData(data, keyData = null) {
        try {
            const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
            
            // Generate or import key
            let key;
            if (keyData) {
                key = await this.importKey(keyData);
            } else {
                key = await crypto.subtle.generateKey(
                    { name: "AES-GCM", length: 256 },
                    true,
                    ["encrypt", "decrypt"]
                );
            }
            
            // Generate random IV
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // Encrypt the data
            const encrypted = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                key,
                this.encoder.encode(plaintext)
            );
            
            // Combine IV and encrypted data
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);
            
            // Return base64 encoded result
            return btoa(String.fromCharCode(...combined));
            
        } catch (error) {
            throw new Error(`Encryption failed: ${error.message}`);
        }
    }

    /**
     * Decrypt data using Web Crypto API
     */
    async decryptData(encryptedData, keyData) {
        try {
            // Decode from base64
            const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
            
            // Extract IV and encrypted data
            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);
            
            // Import key
            const key = await this.importKey(keyData);
            
            // Decrypt
            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                encrypted
            );
            
            const plaintext = this.decoder.decode(decrypted);
            
            // Try to parse as JSON, fallback to string
            try {
                return JSON.parse(plaintext);
            } catch {
                return plaintext;
            }
            
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    /**
     * Hash data using SHA-256 (for integrity checking, not encryption)
     */
    async hashData(data) {
        const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
        const hash = await crypto.subtle.digest('SHA-256', this.encoder.encode(plaintext));
        return btoa(String.fromCharCode(...new Uint8Array(hash)));
    }

    /**
     * Secure password hashing (client-side only for demos - use server-side in production)
     */
    async hashPassword(password, salt = null) {
        if (!salt) {
            salt = crypto.getRandomValues(new Uint8Array(16));
        } else {
            salt = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
        }
        
        const key = await crypto.subtle.importKey(
            'raw',
            this.encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits']
        );
        
        const hash = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            key,
            256
        );
        
        return {
            hash: btoa(String.fromCharCode(...new Uint8Array(hash))),
            salt: btoa(String.fromCharCode(...salt))
        };
    }
}

// Utility functions for easy use
const clientEncryption = new ClientEncryption();

// Export for module systems or global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ClientEncryption, clientEncryption };
} else {
    window.ClientEncryption = ClientEncryption;
    window.clientEncryption = clientEncryption;
}

// Demo functions for testing
async function demonstrateClientEncryption() {
    console.log('🔒 Client-side Encryption Demo');
    
    try {
        // Generate a key
        const key = await clientEncryption.generateKey();
        console.log('Generated key:', key);
        
        // Test data
        const testData = {
            user: 'john@example.com',
            preferences: {
                theme: 'dark',
                notifications: true
            }
        };
        
        // Encrypt
        const encrypted = await clientEncryption.encryptData(testData, key);
        console.log('Encrypted:', encrypted);
        
        // Decrypt
        const decrypted = await clientEncryption.decryptData(encrypted, key);
        console.log('Decrypted:', decrypted);
        
        // Hash for integrity
        const hash = await clientEncryption.hashData(testData);
        console.log('Hash:', hash);
        
        console.log('✅ Client encryption test passed');
        
    } catch (error) {
        console.error('❌ Client encryption test failed:', error);
    }
}

// Auto-run demo if script is loaded directly
if (typeof window !== 'undefined') {
    console.log('Client encryption utilities loaded');
    // Uncomment to run demo:
    // demonstrateClientEncryption();
}
