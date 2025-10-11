import crypto from 'crypto';

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY || 'vbsolution-default-key-change-in-production';
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 64;
  private static readonly TAG_LENGTH = 16;

  /**
   * Gera uma chave de criptografia derivada de uma senha
   */
  private static deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
  }

  /**
   * Criptografa um texto usando AES-256-GCM
   */
  public static encrypt(text: string): string {
    try {
      const salt = crypto.randomBytes(this.SALT_LENGTH);
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const key = this.deriveKey(this.SECRET_KEY, salt);
      
      const cipher = crypto.createCipherGCM(this.ALGORITHM, key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combina salt + iv + tag + encrypted
      const combined = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);
      
      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Erro ao criptografar: ${error}`);
    }
  }

  /**
   * Descriptografa um texto usando AES-256-GCM
   */
  public static decrypt(encryptedText: string): string {
    try {
      const combined = Buffer.from(encryptedText, 'base64');
      
      // Extrai salt, iv, tag e encrypted
      const salt = combined.subarray(0, this.SALT_LENGTH);
      const iv = combined.subarray(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const tag = combined.subarray(this.SALT_LENGTH + this.IV_LENGTH, this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);
      const encrypted = combined.subarray(this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);
      
      const key = this.deriveKey(this.SECRET_KEY, salt);
      
      const decipher = crypto.createDecipherGCM(this.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Erro ao descriptografar: ${error}`);
    }
  }

  /**
   * Gera um hash seguro para tokens
   */
  public static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Gera um token seguro aleatório
   */
  public static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Verifica se um token é válido (não expirado)
   */
  public static isTokenValid(expiresAt: Date | null): boolean {
    if (!expiresAt) return true;
    return new Date() < expiresAt;
  }

  /**
   * Calcula o tempo restante até a expiração do token
   */
  public static getTokenTimeToExpiry(expiresAt: Date | null): number {
    if (!expiresAt) return Infinity;
    return expiresAt.getTime() - Date.now();
  }
}
