import crypto from 'crypto';

// Use a fixed key or environment variable. Ensure it's 32 bytes for aes-256-ctr.
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3'; 
const ALGORITHM = 'aes-256-ctr';

// Deterministic encryption requires a fixed IV or one derived from the data. 
// For URL slugs, we want stability (same ID = same URL).
// We'll use a fixed IV for simplicity and stability.
const FIXED_IV = Buffer.from('1234567890123456'); // 16 bytes

export function encodeId(id: number | string): string {
  try {
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET_KEY), FIXED_IV);
    let encrypted = cipher.update(id.toString());
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
  } catch (error) {
    console.error('Encryption error:', error);
    return id.toString();
  }
}

export function decodeId(encryptedId: string): string {
  try {
    // If it looks like a plain number (and short), it might be a legacy ID. 
    // But hex strings can be numbers too. We'll try to decrypt.
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(SECRET_KEY), FIXED_IV);
    let decrypted = decipher.update(Buffer.from(encryptedId, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    // Fallback: return original if decryption fails (assuming it might be raw ID)
    return encryptedId;
  }
}
