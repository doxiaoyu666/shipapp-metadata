import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { saveCredentials, hasCredentials, getConfigDir } from '../core/auth';
import { fetchAll } from '../core/asc-client';
import type { ShipAppCredentials } from '../core/types';

export async function initCommand(): Promise<void> {
  console.log('\n🚀 ShipApp Metadata — Setup\n');

  if (hasCredentials()) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Credentials already configured. Overwrite?',
        default: false,
      },
    ]);
    if (!overwrite) {
      console.log('✅ Keeping existing credentials.');
      return;
    }
  }

  console.log('You need an App Store Connect API Key.');
  console.log('Generate one at: App Store Connect → Users and Access → Integrations → Keys\n');

  const answers = await inquirer.prompt([
    { type: 'input', name: 'keyId', message: 'Key ID:', validate: (v: string) => v.trim() ? true : 'Required' },
    { type: 'input', name: 'issuerId', message: 'Issuer ID:', validate: (v: string) => v.trim() ? true : 'Required' },
    {
      type: 'input',
      name: 'privateKeyPath',
      message: 'Path to .p8 private key file:',
      validate: (v: string) => {
        const p = v.startsWith('~') ? path.join(process.env.HOME || '', v.slice(1)) : v;
        return fs.existsSync(p) ? true : `File not found: ${p}`;
      },
    },
  ]);

  // Resolve ~ in path
  let keyPath = answers.privateKeyPath;
  if (keyPath.startsWith('~')) {
    keyPath = path.join(process.env.HOME || '', keyPath.slice(1));
  }
  keyPath = path.resolve(keyPath);

  const credentials: ShipAppCredentials = {
    keyId: answers.keyId.trim(),
    issuerId: answers.issuerId.trim(),
    privateKeyPath: keyPath,
  };

  // Verify connection
  const spinner = ora('Verifying connection to App Store Connect...').start();
  try {
    saveCredentials(credentials);
    const apps = await fetchAll('/apps?limit=5');
    spinner.succeed(`Connected! Found ${apps.length} app(s) in your account.`);
    console.log(`\n📁 Credentials saved to ${getConfigDir()}/credentials.json`);
    console.log('\nRun "shipapp-metadata list" to see all your apps.');
  } catch (err: any) {
    spinner.fail('Connection failed');
    console.error(`\n❌ ${err.message}`);
    console.error('\nPlease check your Key ID, Issuer ID, and .p8 file.');
    process.exit(1);
  }
}
