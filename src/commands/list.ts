import ora from 'ora';
import { fetchAll } from '../core/asc-client';

export async function listCommand(): Promise<void> {
  const spinner = ora('Fetching apps from App Store Connect...').start();

  try {
    const apps = await fetchAll('/apps?fields[apps]=name,bundleId,sku');
    spinner.stop();

    if (apps.length === 0) {
      console.log('No apps found in your account.');
      return;
    }

    console.log(`\n📱 ${apps.length} app(s) found:\n`);
    console.log(
      `${'Name'.padEnd(40)} ${'Bundle ID'.padEnd(35)} ${'ID'.padEnd(12)}`
    );
    console.log('-'.repeat(90));

    for (const app of apps) {
      const { name, bundleId } = app.attributes;
      console.log(
        `${(name || '').padEnd(40)} ${(bundleId || '').padEnd(35)} ${app.id}`
      );
    }
    console.log('');
  } catch (err: any) {
    spinner.fail('Failed to fetch apps');
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
  }
}
