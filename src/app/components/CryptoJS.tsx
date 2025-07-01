import CryptoJS from "crypto-js";

// 暗号化
export function encryptText(plainText: string, key: string): string {
  plainText.trim();
  if (!key) return plainText;
  return CryptoJS.AES.encrypt(JSON.stringify(plainText), key).toString();
}

// 復号
export function decryptText(encryptText: string, key: string): string {
  encryptText.trim();
  if (!key) return "";
  const bytes = CryptoJS.AES.decrypt(encryptText, key);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  if (!decrypted) return encryptText;
  return JSON.parse(decrypted);
}
