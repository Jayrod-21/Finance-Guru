"""
Fernet symmetric encryption for API key storage.
Generates a persistent key file in the data directory.
"""
import os
from cryptography.fernet import Fernet

KEY_FILE = "/app/data/.encryption_key"


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
    """Encrypt a string and return the base64-encoded ciphertext."""
    return _fernet.encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    """Decrypt a base64-encoded ciphertext string."""
    return _fernet.decrypt(ciphertext.encode()).decode()
