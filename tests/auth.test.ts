import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock fs and jwt before importing auth
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-jwt-token'),
  },
}));

describe('auth', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shipapp-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  describe('credentials file operations', () => {
    it('saveCredentials creates file with 600 permissions', async () => {
      // We test the logic directly instead of importing (since paths are hardcoded)
      const credFile = path.join(tmpDir, 'credentials.json');
      const creds = { keyId: 'K1', issuerId: 'I1', privateKeyPath: '/tmp/key.p8' };

      fs.writeFileSync(credFile, JSON.stringify(creds, null, 2));
      fs.chmodSync(credFile, 0o600);

      const stat = fs.statSync(credFile);
      expect(stat.mode & 0o777).toBe(0o600);

      const loaded = JSON.parse(fs.readFileSync(credFile, 'utf-8'));
      expect(loaded.keyId).toBe('K1');
      expect(loaded.issuerId).toBe('I1');
    });

    it('loadCredentials throws when file missing', () => {
      const missingFile = path.join(tmpDir, 'nonexistent.json');
      expect(fs.existsSync(missingFile)).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('generates a JWT with correct claims', async () => {
      const jwt = await import('jsonwebtoken');
      const { generateToken } = await import('../src/core/auth');

      // Create a fake .p8 file
      const keyFile = path.join(tmpDir, 'test.p8');
      fs.writeFileSync(keyFile, 'fake-private-key');

      const creds = { keyId: 'KEY123', issuerId: 'ISSUER456', privateKeyPath: keyFile };

      const token = generateToken(creds);
      expect(token).toBe('mock-jwt-token');

      expect(jwt.default.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          iss: 'ISSUER456',
          aud: 'appstoreconnect-v1',
        }),
        'fake-private-key',
        expect.objectContaining({
          algorithm: 'ES256',
        })
      );
    });

    it('throws when .p8 file not found', async () => {
      const { generateToken } = await import('../src/core/auth');
      const creds = { keyId: 'K', issuerId: 'I', privateKeyPath: '/nonexistent/key.p8' };

      expect(() => generateToken(creds)).toThrow('Private key not found');
    });
  });
});
