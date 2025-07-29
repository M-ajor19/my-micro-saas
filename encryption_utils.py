"""
AES Encryption Utilities for Micro-SaaS
Provides secure AES-256-GCM encryption for sensitive data
"""

import os
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import json
from typing import Union, Dict, Any


class AESEncryption:
    """
    AES-256-GCM encryption class for secure data handling
    """
    
    def __init__(self, master_key: str = None):
        """
        Initialize with master key (will be derived using PBKDF2)
        If no key provided, will look for ENCRYPTION_KEY environment variable
        """
        if master_key is None:
            master_key = os.environ.get('ENCRYPTION_KEY', 'default-key-change-in-production')
        
        self.master_key = master_key.encode('utf-8')
        
    def _derive_key(self, salt: bytes) -> bytes:
        """
        Derive encryption key from master key using PBKDF2
        """
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256 bits
            salt=salt,
            iterations=100000,  # Recommended by OWASP
            backend=default_backend()
        )
        return kdf.derive(self.master_key)
    
    def encrypt_data(self, data: Union[str, Dict[str, Any]]) -> str:
        """
        Encrypt data using AES-256-GCM
        Returns base64 encoded encrypted data with salt and nonce
        """
        try:
            # Convert to JSON string if data is dict/object
            if isinstance(data, (dict, list)):
                plaintext = json.dumps(data, separators=(',', ':'))
            else:
                plaintext = str(data)
            
            # Generate random salt and nonce
            salt = os.urandom(16)  # 128 bits
            nonce = os.urandom(12)  # 96 bits for GCM
            
            # Derive key
            key = self._derive_key(salt)
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(key),
                modes.GCM(nonce),
                backend=default_backend()
            )
            encryptor = cipher.encryptor()
            
            # Encrypt data
            ciphertext = encryptor.update(plaintext.encode('utf-8')) + encryptor.finalize()
            
            # Combine salt + nonce + tag + ciphertext
            encrypted_data = salt + nonce + encryptor.tag + ciphertext
            
            # Return base64 encoded
            return base64.b64encode(encrypted_data).decode('utf-8')
            
        except Exception as e:
            raise ValueError(f"Encryption failed: {str(e)}")
    
    def decrypt_data(self, encrypted_data: str) -> Union[str, Dict[str, Any]]:
        """
        Decrypt AES-256-GCM encrypted data
        Returns original data (string or parsed JSON object)
        """
        try:
            # Decode from base64
            encrypted_bytes = base64.b64decode(encrypted_data.encode('utf-8'))
            
            # Extract components
            salt = encrypted_bytes[:16]
            nonce = encrypted_bytes[16:28]
            tag = encrypted_bytes[28:44]
            ciphertext = encrypted_bytes[44:]
            
            # Derive key
            key = self._derive_key(salt)
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(key),
                modes.GCM(nonce, tag),
                backend=default_backend()
            )
            decryptor = cipher.decryptor()
            
            # Decrypt data
            plaintext = decryptor.update(ciphertext) + decryptor.finalize()
            decrypted_string = plaintext.decode('utf-8')
            
            # Try to parse as JSON, fallback to string
            try:
                return json.loads(decrypted_string)
            except json.JSONDecodeError:
                return decrypted_string
                
        except Exception as e:
            raise ValueError(f"Decryption failed: {str(e)}")
    
    def encrypt_user_profile(self, profile_data: Dict[str, Any]) -> str:
        """
        Encrypt user profile data specifically
        """
        # Remove sensitive fields that shouldn't be encrypted
        safe_profile = {k: v for k, v in profile_data.items() 
                       if k not in ['id', 'created_at', 'last_login']}
        
        return self.encrypt_data(safe_profile)
    
    def decrypt_user_profile(self, encrypted_profile: str) -> Dict[str, Any]:
        """
        Decrypt user profile data specifically
        """
        return self.decrypt_data(encrypted_profile)


# Utility functions for easy use
def encrypt_string(data: str, key: str = None) -> str:
    """Quick function to encrypt a string"""
    encryptor = AESEncryption(key)
    return encryptor.encrypt_data(data)


def decrypt_string(encrypted_data: str, key: str = None) -> str:
    """Quick function to decrypt a string"""
    encryptor = AESEncryption(key)
    return encryptor.decrypt_data(encrypted_data)


def encrypt_json(data: Dict[str, Any], key: str = None) -> str:
    """Quick function to encrypt JSON data"""
    encryptor = AESEncryption(key)
    return encryptor.encrypt_data(data)


def decrypt_json(encrypted_data: str, key: str = None) -> Dict[str, Any]:
    """Quick function to decrypt JSON data"""
    encryptor = AESEncryption(key)
    return encryptor.decrypt_data(encrypted_data)


# Security utility functions
def generate_secure_key() -> str:
    """Generate a cryptographically secure key for encryption"""
    return base64.b64encode(os.urandom(32)).decode('utf-8')


def hash_password(password: str, salt: bytes = None) -> tuple:
    """Hash password using PBKDF2 (for password storage, not encryption)"""
    if salt is None:
        salt = os.urandom(16)
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    
    hashed = kdf.derive(password.encode('utf-8'))
    return base64.b64encode(hashed).decode('utf-8'), base64.b64encode(salt).decode('utf-8')


def verify_password(password: str, hashed_password: str, salt: str) -> bool:
    """Verify password against stored hash"""
    try:
        salt_bytes = base64.b64decode(salt.encode('utf-8'))
        stored_hash = base64.b64decode(hashed_password.encode('utf-8'))
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt_bytes,
            iterations=100000,
            backend=default_backend()
        )
        
        kdf.verify(password.encode('utf-8'), stored_hash)
        return True
    except Exception:
        return False


if __name__ == "__main__":
    # Example usage and testing
    print("🔒 AES Encryption Utils - Testing")
    
    # Test string encryption
    test_string = "Sensitive user data that needs protection"
    encrypted = encrypt_string(test_string)
    decrypted = decrypt_string(encrypted)
    
    print(f"Original: {test_string}")
    print(f"Encrypted: {encrypted}")
    print(f"Decrypted: {decrypted}")
    print(f"Match: {test_string == decrypted}")
    
    # Test JSON encryption
    test_data = {
        "email": "user@example.com",
        "phone": "+1-555-123-4567",
        "api_keys": {
            "openai": "sk-test-key",
            "stripe": "pk_test_key"
        }
    }
    
    encrypted_json = encrypt_json(test_data)
    decrypted_json = decrypt_json(encrypted_json)
    
    print(f"\nJSON Original: {test_data}")
    print(f"JSON Encrypted: {encrypted_json}")
    print(f"JSON Decrypted: {decrypted_json}")
    print(f"JSON Match: {test_data == decrypted_json}")
    
    # Generate secure key
    secure_key = generate_secure_key()
    print(f"\nGenerated secure key: {secure_key}")
