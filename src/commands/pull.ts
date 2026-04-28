import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { fetchAll } from '../core/asc-client';

export async function pullCommand(appKeyword: string, outputDir: string): Promise<void> {
  const spinner = ora('Connecting to App Store Connect...').start();

  try {
    // 1. Find app
    const apps = await fetchAll('/apps?fields[apps]=name,bundleId');
    const matched = apps.find((a: any) =>
      a.attributes.name.toLowerCase().includes(appKeyword.toLowerCase())
    );

    if (!matched) {
      spinner.fail(`No app matching "${appKeyword}"`);
      const names = apps.map((a: any) => a.attributes.name).join(', ');
      console.error(`Available apps: ${names}`);
      process.exit(1);
    }

    spinner.text = `Found: ${matched.attributes.name}`;

    // 2. Get latest iOS version
    const versions = await fetchAll(
      `/apps/${matched.id}/appStoreVersions?filter[platform]=IOS`
    );

    if (versions.length === 0) {
      spinner.fail('No iOS versions found');
      process.exit(1);
    }

    const version = versions[0];
    spinner.text = `Version: ${version.attributes.versionString} (${version.attributes.appStoreState})`;

    // 3. Get version localizations (description, keywords, etc.)
    const localizations = await fetchAll(
      `/appStoreVersions/${version.id}/appStoreVersionLocalizations`
    );

    // 4. Get appInfo localizations (name, subtitle)
    const appInfos = await fetchAll(`/apps/${matched.id}/appInfos`);
    let appInfoLocs: any[] = [];
    if (appInfos.length > 0) {
      const appInfoId = appInfos[0].id;
      appInfoLocs = await fetchAll(
        `/appInfos/${appInfoId}/appInfoLocalizations?limit=200`
      );
    }

    // Build a map of appInfo locale → {name, subtitle}
    const infoMap: Record<string, { name?: string; subtitle?: string }> = {};
    for (const loc of appInfoLocs) {
      infoMap[loc.attributes.locale] = {
        name: loc.attributes.name,
        subtitle: loc.attributes.subtitle,
      };
    }

    // 5. Write JSON files
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    spinner.stop();
    console.log(`\n📦 ${matched.attributes.name} v${version.attributes.versionString}\n`);

    for (const loc of localizations) {
      const locale = loc.attributes.locale;
      const attrs = loc.attributes;
      const info = infoMap[locale] || {};

      const metadata: Record<string, string> = {
        language_code: locale,
      };

      if (info.name) metadata.app_name = info.name;
      if (info.subtitle) metadata.subtitle = info.subtitle;
      if (attrs.keywords) metadata.keywords = attrs.keywords;
      if (attrs.promotionalText) metadata.promotional_text = attrs.promotionalText;
      if (attrs.description) metadata.description = attrs.description;
      if (attrs.whatsNew) metadata.whats_new = attrs.whatsNew;

      const filePath = path.join(outputDir, `${locale}.json`);
      fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2) + '\n');
      console.log(`  ✅ ${locale}.json`);
    }

    console.log(`\n📁 Saved to ${outputDir}`);
  } catch (err: any) {
    spinner.fail('Failed');
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
  }
}
