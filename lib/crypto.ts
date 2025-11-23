import CryptoJS from "crypto-js"

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-key-change-in-production"

/**
 * Encrypt sensitive data (tokens) before storing in database
 */
export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString()
}

/**
 * Decrypt sensitive data (tokens) from database
 */
export function decrypt(encryptedText: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

