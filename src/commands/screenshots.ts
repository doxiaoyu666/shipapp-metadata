import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import ora from 'ora';
import { apiRequest, fetchAll, uploadBinary } from '../core/asc-client';
import { LOCALE_MAP, DISPLAY_TYPE_MAP, EN_VARIANTS, EDITABLE_STATES } from '../core/types';

async function uploadScreenshotsForSet(
  localizationId: string,
  displayType: string,
  imagePaths: string[]
): Promise<void> {
  // Get or create screenshot set
  const sets = await fetchAll(
    `/appStoreVersionLocalizations/${localizationId}/appScreenshotSets`
  );
  let screenshotSet = sets.find(
    (s: any) => s.attributes.screenshotDisplayType === displayType
  );

  if (!screenshotSet) {
    const created = await apiRequest('POST', '/appScreenshotSets', {
      data: {
        type: 'appScreenshotSets',
        attributes: { screenshotDisplayType: displayType },
        relationships: {
          appStoreVersionLocalization: {
            data: { type: 'appStoreVersionLocalizations', id: localizationId },
          },
        },
      },
    });
    screenshotSet = created.data;
  }

  const setId = screenshotSet.id;

  // Delete existing screenshots
  const existing = await fetchAll(`/appScreenshotSets/${setId}/appScreenshots`);
  for (const ss of existing) {
    await apiRequest('DELETE', `/appScreenshots/${ss.id}`);
  }
  if (existing.length > 0) {
    console.log(`    🗑️  Deleted ${existing.length} old screenshots`);
  }

  // Upload new screenshots
  for (const imgPath of imagePaths) {
    const fileName = path.basename(imgPath);
    const fileData = fs.readFileSync(imgPath);
    const fileSize = fileData.length;
    const checksum = crypto.createHash('md5').update(fileData).digest('base64');

    // Reserve
    const reservation = await apiRequest('POST', '/appScreenshots', {
      data: {
        type: 'appScreenshots',
        attributes: { fileName, fileSize },
        relationships: {
          appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } },
        },
      },
    });

    const screenshotId = reservation.data.id;
    const uploadOps = reservation.data.attributes.uploadOperations;

    // Upload chunks
    for (const op of uploadOps) {
      const chunk = fileData.subarray(op.offset, op.offset + op.length);
      const headers: Record<string, string> = {};
      for (const h of op.requestHeaders) {
        headers[h.name] = h.value;
      }
      const res = await fetch(op.url, { method: op.method, headers, body: chunk });
      if (!res.ok) {
        throw new Error(`Upload chunk failed [${res.status}]`);
      }
    }

    // Commit
    await apiRequest('PATCH', `/appScreenshots/${screenshotId}`, {
      data: {
        type: 'appScreenshots',
        id: screenshotId,
        attributes: { uploaded: true, sourceFileChecksum: checksum },
      },
    });

    console.log(`    📸 ${fileName}`);
  }
}

export async function screenshotsCommand(
  appKeyword: string,
  screenshotDir: string
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

    spinner.text = `Found: ${matched.attributes.name}`;

    // 2. Get editable version
    const versions = await fetchAll(
      `/apps/${matched.id}/appStoreVersions?filter[platform]=IOS`
    );
    const version = versions.find((v: any) =>
      EDITABLE_STATES.includes(v.attributes.appStoreState)
    );

    if (!version) {
      spinner.fail('No editable version found (screenshots can only be uploaded before submission)');
      process.exit(1);
    }

    spinner.text = `Version: ${version.attributes.versionString}`;

    // 3. Get localizations
    const localizations = await fetchAll(
      `/appStoreVersions/${version.id}/appStoreVersionLocalizations`
    );
    const locMap: Record<string, string> = {};
    for (const loc of localizations) {
      locMap[loc.attributes.locale] = loc.id;
    }

    spinner.stop();
    console.log(`\n🎯 ${matched.attributes.name} v${version.attributes.versionString}\n`);

    // 4. Scan screenshot directory
    const localeDirs = fs.readdirSync(screenshotDir).filter((d: string) =>
      fs.statSync(path.join(screenshotDir, d)).isDirectory()
    );

    let totalSuccess = 0;
    let totalError = 0;

    for (const localeDir of localeDirs) {
      const apiLocale = LOCALE_MAP[localeDir] || localeDir;
      const targetLocales = [apiLocale];
      if (apiLocale === 'en-US') targetLocales.push(...EN_VARIANTS);

      const deviceDirs = fs.readdirSync(path.join(screenshotDir, localeDir)).filter(
        (d: string) => fs.statSync(path.join(screenshotDir, localeDir, d)).isDirectory()
      );

      for (const deviceDir of deviceDirs) {
        const displayType = DISPLAY_TYPE_MAP[deviceDir];
        if (!displayType) {
          console.log(`  ⚠️  Skipping unknown device: ${localeDir}/${deviceDir}`);
          continue;
        }

        const imgDir = path.join(screenshotDir, localeDir, deviceDir);
        const images = fs
          .readdirSync(imgDir)
          .filter((f: string) => /\.(png|jpg|jpeg)$/i.test(f))
          .sort()
          .map((f: string) => path.join(imgDir, f));

        if (images.length === 0) continue;

        for (const locale of targetLocales) {
          const locId = locMap[locale];
          if (!locId) continue;

          console.log(`  🌐 ${locale} / ${deviceDir} — ${images.length} screenshots`);

          try {
            await uploadScreenshotsForSet(locId, displayType, images);
            totalSuccess++;
          } catch (err: any) {
            console.error(`    ❌ Failed: ${err.message}`);
            totalError++;
          }
        }
      }
    }

    console.log(`\n📊 Done! Success: ${totalSuccess} sets, Failed: ${totalError} sets`);
  } catch (err: any) {
    spinner.fail('Failed');
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
  }
}
