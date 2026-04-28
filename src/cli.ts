import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { initCommand } from './commands/init';
import { listCommand } from './commands/list';
import { pullCommand } from './commands/pull';
import { pushCommand } from './commands/push';
import { screenshotsCommand } from './commands/screenshots';
import { hasCredentials } from './core/auth';

function requireCredentials(argv: any): void {
  if (argv._[0] !== 'init' && !hasCredentials()) {
    console.error('❌ Not configured. Run "shipapp-metadata init" first.');
    process.exit(1);
  }
}

yargs(hideBin(process.argv))
  .scriptName('shipapp-metadata')
  .usage('$0 <command> [options]')
  .middleware([requireCredentials])
  .command('init', 'Configure App Store Connect credentials', {}, async () => {
    await initCommand();
  })
  .command('list', 'List all apps in your account', {}, async () => {
    await listCommand();
  })
  .command(
    'pull',
    'Pull metadata from App Store Connect',
    (y) =>
      y
        .option('app', { type: 'string', demandOption: true, describe: 'App name keyword' })
        .option('output', { type: 'string', default: './metadata', describe: 'Output directory' }),
    async (argv) => {
      await pullCommand(argv.app, argv.output);
    }
  )
  .command(
    'push',
    'Push metadata to App Store Connect',
    (y) =>
      y
        .option('app', { type: 'string', demandOption: true, describe: 'App name keyword' })
        .option('dir', { type: 'string', demandOption: true, describe: 'Metadata directory' })
        .option('only', { type: 'string', describe: 'Only update specific fields (comma-separated)' }),
    async (argv) => {
      const onlyFields = argv.only ? new Set(argv.only.split(',')) : undefined;
      await pushCommand(argv.app, argv.dir, onlyFields);
    }
  )
  .command(
    'screenshots',
    'Upload screenshots to App Store Connect',
    (y) =>
      y
        .option('app', { type: 'string', demandOption: true, describe: 'App name keyword' })
        .option('dir', { type: 'string', demandOption: true, describe: 'Screenshots directory' }),
    async (argv) => {
      await screenshotsCommand(argv.app, argv.dir);
    }
  )
  .demandCommand(1, 'Please specify a command')
  .strict()
  .help()
  .version()
  .parseAsync()
  .catch((err) => {
    console.error('💥 Fatal:', err.message);
    process.exit(1);
  });
