import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import type { ShipAppCredentials } from './types';

const CONFIG_DIR = path.join(process.env.HOME || '~', '.shipapp');
const CREDENTIALS_FILE = path.join(CONFIG_DIR, 'credentials.json');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function hasCredentials(): boolean {
  return fs.existsSync(CREDENTIALS_FILE);
}

export function loadCredentials(): ShipAppCredentials {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    throw new Error(
      'No credentials found. Run "shipapp-metadata init" to configure.'
    );
  }
  return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
}

export function saveCredentials(credentials: ShipAppCredentials): void {
  ensureConfigDir();
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2));
  fs.chmodSync(CREDENTIALS_FILE, 0o600);
}

export function loadConfig(): Record<string, any> {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
}

export function saveConfig(config: Record<string, any>): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function generateToken(credentials: ShipAppCredentials): string {
  const keyPath = path.isAbsolute(credentials.privateKeyPath)
    ? credentials.privateKeyPath
    : path.resolve(credentials.privateKeyPath);

  if (!fs.existsSync(keyPath)) {
    throw new Error(`Private key not found: ${keyPath}`);
  }

  const privateKey = fs.readFileSync(keyPath, 'utf-8');
  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    { iss: credentials.issuerId, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' },
    privateKey,
    { algorithm: 'ES256', header: { alg: 'ES256', kid: credentials.keyId, typ: 'JWT' } }
  );
}
