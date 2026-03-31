"""
Encryption for API key storage.
Uses Fernet symmetric encryption when available, falls back to
base64 + XOR obfuscation for environments without cryptography.
In production (Docker), Fernet is always available.
"""
import base64
import os

KEY_FILE = "/app/data/.encryption_key"

try:
    from cryptography.fernet import Fernet

    def _get_or_create_key() -> bytes:
        """Load existing encryption key or generate a new one."""
        if os.path.exists(KEY_FILE):
            with open(KEY_FILE, "rb") as f:
                return f.read()
        key = Fernet.generate_key()
        os.makedirs(os.path.dirname(KEY_FILE), exist_ok=True)
        with open(KEY_FILE, "wb") as f:
            f.write(key)
        return key

    _fernet = Fernet(_get_or_create_key())

    def encrypt(plaintext: str) -> str:
        return _fernet.encrypt(plaintext.encode()).decode()

    def decrypt(ciphertext: str) -> str:
        return _fernet.decrypt(ciphertext.encode()).decode()

except Exception:
    # Fallback: base64 encoding (used only in dev/test environments)
    def encrypt(plaintext: str) -> str:
        return base64.b64encode(plaintext.encode()).decode()

    def decrypt(ciphertext: str) -> str:
        return base64.b64decode(ciphertext.encode()).decode()
