/**
 * Citadel — Zero-Knowledge Encryption Layer
 * Uses Web Crypto API: PBKDF2 for key derivation, AES-256-GCM for encryption.
 * All encryption/decryption happens client-side only.
 */

const PBKDF2_ITERATIONS = 600000;
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Derive an AES-256-GCM key from a master password using PBKDF2.
 */
export async function deriveKey(
  masterPassword: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a salt for key derivation.
 */
export function generateSalt(): string {
  return arrayBufferToBase64(generateRandomBytes(SALT_LENGTH).buffer);
}

/**
 * Encrypt plaintext data using AES-256-GCM.
 * Returns { ciphertext, iv, salt } — all base64 encoded.
 */
export async function encryptData(
  data: string,
  masterPassword: string
): Promise<{ ciphertext: string; iv: string; salt: string }> {
  const encoder = new TextEncoder();
  const salt = generateRandomBytes(SALT_LENGTH);
  const iv = generateRandomBytes(IV_LENGTH);
  const key = await deriveKey(masterPassword, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(salt.buffer),
  };
}

/**
 * Decrypt ciphertext using AES-256-GCM.
 */
export async function decryptData(
  ciphertext: string,
  iv: string,
  salt: string,
  masterPassword: string
): Promise<string> {
  const key = await deriveKey(
    masterPassword,
    new Uint8Array(base64ToArrayBuffer(salt))
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(base64ToArrayBuffer(iv)) },
    key,
    base64ToArrayBuffer(ciphertext)
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Hash the master password for verification (stored in Supabase).
 * This is NOT the encryption key — it's only used to verify the password is correct.
 */
export async function hashMasterPassword(
  password: string,
  salt: Uint8Array
): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return arrayBufferToBase64(bits);
}

/**
 * Generate a strong random password.
 */
export function generatePassword(
  length: number = 20,
  options: {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
  } = {}
): string {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
  } = options;

  let chars = '';
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) chars += '0123456789';
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (chars.length === 0) chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

  const randomValues = generateRandomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length];
  }
  return password;
}

/**
 * Calculate password strength (0-4 scale).
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  score = Math.min(score, 4);

  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

  return { score, label: labels[score], color: colors[score] };
}
