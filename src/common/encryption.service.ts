import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class EncryptionService {
    private readonly key: Buffer;

    constructor(private readonly configService: ConfigService) {
        const hexKey = this.configService.get<string>('ENCRYPTION_KEY', 'a2e4ec558a1fe8e4e1886fd67bbe45dcc05de527d5f4dd75f9e3db426b7f464b');
        this.key = Buffer.from(hexKey, 'hex');
        if (this.key.length !== 32) {
            throw new Error('ENCRYPTION_KEY must be a 32-byte (64 hex char) string');
        }
    }

    encrypt(plaintext: string): string {
        const iv = randomBytes(12);
        const cipher = createCipheriv('aes-256-gcm', this.key, iv);
        const encrypted = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        // Format: iv:authTag:ciphertext (all hex)
        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
    }

    decrypt(encryptedString: string): string {
        const [ivHex, authTagHex, ciphertextHex] = encryptedString.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const ciphertext = Buffer.from(ciphertextHex, 'hex');
        const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final(),
        ]);
        return decrypted.toString('utf8');
    }
}
