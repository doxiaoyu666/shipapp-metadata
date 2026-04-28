import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { apiRequest, fetchAll } from '../core/asc-client';
import { LOCALE_MAP, EN_VARIANTS, EDITABLE_STATES } from '../core/types';
import type { MetadataFile } from '../core/types';

export async function pushCommand(
  appKeyword: string,
  metadataDir: string,
  onlyFields?: Set<string>
): Promise<void> {
  const spinner = ora('Connecting to App Store Connect...').start();

  try {
    // 1. Find app
    const apps = await fetchAll('/apps?fields[apps]=name,bundleId');
    const matched = apps.find((a: any) =>
      a.attributes.name.toLowerCase().includes(appKeyword.toLowerCase())
    );

    if (!matched) {
      spinner.fail(`No app matching "${appKeyword}"`);
      process.exit(1);
    }

    const appId = matched.id;
    spinner.text = `Found: ${matched.attributes.name}`;

    // 2. Get editable version
    const versions = await fetchAll(`/apps/${appId}/appStoreVersions?filter[platform]=IOS`);
    let version = versions.find((v: any) => EDITABLE_STATES.includes(v.attributes.appStoreState));

    if (!version) {
      version = versions[0];
      if (!version) {
        spinner.fail('No iOS versions found');
        process.exit(1);
      }
    }

    spinner.text = `Version: ${version.attributes.versionString} (${version.attributes.appStoreState})`;

    if (!EDITABLE_STATES.includes(version.attributes.appStoreState)) {
      spinner.warn(
        `Version ${version.attributes.versionString} is in "${version.attributes.appStoreState}" state and may not be editable. ` +
        `Create a new version in App Store Connect first, or some fields (like whatsNew) will fail.`
      );
    }

    // 3. Get existing localizations
    const localizations = await fetchAll(
      `/appStoreVersions/${version.id}/appStoreVersionLocalizations`
    );
    const locMap: Record<string, string> = {};
    for (const loc of localizations) {
      locMap[loc.attributes.locale] = loc.id;
    }

    // 3b. Get appInfo localizations
    const appInfos = await fetchAll(`/apps/${appId}/appInfos`);
    let appInfoId: string | null = null;
    const appInfoLocMap: Record<string, string> = {};

    if (appInfos.length > 0) {
      const editableInfo = appInfos.find(
        (i: any) => i.attributes.appStoreState === 'PREPARE_FOR_SUBMISSION'
      );
      appInfoId = (editableInfo || appInfos[0]).id;
      const appInfoLocs = await fetchAll(
        `/appInfos/${appInfoId}/appInfoLocalizations?limit=200`
      );
      for (const loc of appInfoLocs) {
        appInfoLocMap[loc.attributes.locale] = loc.id;
      }
    }

    spinner.stop();
    console.log(`\n🎯 ${matched.attributes.name} v${version.attributes.versionString}\n`);

    // 4. Read JSON files and update
    const jsonFiles = fs.readdirSync(metadataDir).filter((f: string) => f.endsWith('.json'));
    let successCount = 0;
    let errorCount = 0;
    let enUSAttributes: Record<string, string> | null = null;
    let enUSInfoAttrs: Record<string, string> | null = null;

    for (const file of jsonFiles) {
      const filePath = path.join(metadataDir, file);
      const metadata: MetadataFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const jsonLocale = metadata.language_code || path.basename(file, '.json');
      const apiLocale = LOCALE_MAP[jsonLocale] || jsonLocale;

      const attributes: Record<string, string> = {};
      if (metadata.description && (!onlyFields || onlyFields.has('description')))
        attributes.description = metadata.description;
      if (metadata.keywords && (!onlyFields || onlyFields.has('keywords')))
        attributes.keywords = metadata.keywords;
      if (metadata.promotional_text && (!onlyFields || onlyFields.has('promotional_text')))
        attributes.promotionalText = metadata.promotional_text;

      // whats_new: prefer standalone file in whats_new/ subdir
      if (!onlyFields || onlyFields.has('whats_new')) {
        const whatsNewFile = path.join(metadataDir, 'whats_new', file);
        let whatsNew: string | null = null;
        if (fs.existsSync(whatsNewFile)) {
          const wnData = JSON.parse(fs.readFileSync(whatsNewFile, 'utf-8'));
          whatsNew = wnData.whats_new;
        } else if (metadata.whats_new) {
          whatsNew = metadata.whats_new;
        }
        if (whatsNew) attributes.whatsNew = whatsNew;
      }

      if (apiLocale === 'en-US') {
        enUSAttributes = attributes;
        if (metadata.app_name || metadata.subtitle) {
          const infoAttrs: Record<string, string> = {};
          if (metadata.app_name && (!onlyFields || onlyFields.has('app_name')))
            infoAttrs.name = metadata.app_name;
          if (metadata.subtitle && (!onlyFields || onlyFields.has('subtitle')))
            infoAttrs.subtitle = metadata.subtitle;
          if (Object.keys(infoAttrs).length > 0) enUSInfoAttrs = infoAttrs;
        }
      }

      // Update or create version localization
      const locId = locMap[apiLocale];
      try {
        if (locId) {
          await apiRequest('PATCH', `/appStoreVersionLocalizations/${locId}`, {
            data: { type: 'appStoreVersionLocalizations', id: locId, attributes },
          });
        } else {
          await apiRequest('POST', '/appStoreVersionLocalizations', {
            data: {
              type: 'appStoreVersionLocalizations',
              attributes: { locale: apiLocale, ...attributes },
              relationships: {
                appStoreVersion: { data: { type: 'appStoreVersions', id: version.id } },
              },
            },
          });
        }
        console.log(`  ✅ ${apiLocale} — metadata updated`);
        successCount++;
      } catch (err: any) {
        console.error(`  ❌ ${apiLocale} — ${err.message}`);
        errorCount++;
      }

      // Update name/subtitle via appInfoLocalizations
      const wantName = metadata.app_name && (!onlyFields || onlyFields.has('app_name'));
      const wantSubtitle = metadata.subtitle && (!onlyFields || onlyFields.has('subtitle'));
      if (appInfoId && (wantName || wantSubtitle)) {
        const infoAttrs: Record<string, string> = {};
        if (wantName) infoAttrs.name = metadata.app_name!;
        if (wantSubtitle) infoAttrs.subtitle = metadata.subtitle!;

        const infoLocId = appInfoLocMap[apiLocale];
        try {
          if (infoLocId) {
            await apiRequest('PATCH', `/appInfoLocalizations/${infoLocId}`, {
              data: { type: 'appInfoLocalizations', id: infoLocId, attributes: infoAttrs },
            });
          } else {
            await apiRequest('POST', '/appInfoLocalizations', {
              data: {
                type: 'appInfoLocalizations',
                attributes: { locale: apiLocale, ...infoAttrs },
                relationships: {
                  appInfo: { data: { type: 'appInfos', id: appInfoId } },
                },
              },
            });
          }
          console.log(`  ✅ ${apiLocale} — name/subtitle updated`);
          successCount++;
        } catch (err: any) {
          console.error(`  ❌ ${apiLocale} name/subtitle — ${err.message}`);
          errorCount++;
        }
      }
    }

    // 5. Sync EN variants
    if (enUSAttributes) {
      for (const variant of EN_VARIANTS) {
        const locId = locMap[variant];
        if (!locId) continue;
        try {
          await apiRequest('PATCH', `/appStoreVersionLocalizations/${locId}`, {
            data: { type: 'appStoreVersionLocalizations', id: locId, attributes: enUSAttributes },
          });
          console.log(`  ✅ ${variant} — synced from en-US`);
          successCount++;
        } catch (err: any) {
          console.error(`  ❌ ${variant} — ${err.message}`);
          errorCount++;
        }

        if (appInfoId && enUSInfoAttrs) {
          const infoLocId = appInfoLocMap[variant];
          if (infoLocId) {
            try {
              await apiRequest('PATCH', `/appInfoLocalizations/${infoLocId}`, {
                data: { type: 'appInfoLocalizations', id: infoLocId, attributes: enUSInfoAttrs },
              });
              console.log(`  ✅ ${variant} — name/subtitle synced from en-US`);
              successCount++;
            } catch (err: any) {
              console.error(`  ❌ ${variant} name/subtitle — ${err.message}`);
              errorCount++;
            }
          }
        }
      }
    }

    console.log(`\n📊 Done! Success: ${successCount}, Failed: ${errorCount}`);
  } catch (err: any) {
    spinner.fail('Failed');
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
  }
}
