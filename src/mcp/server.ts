import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { fetchAll, apiRequest } from '../core/asc-client';
import { hasCredentials } from '../core/auth';
import { LOCALE_MAP, EN_VARIANTS, EDITABLE_STATES } from '../core/types';
import type { MetadataFile } from '../core/types';

const server = new McpServer({
  name: 'shipapp-metadata',
  version: '0.1.0',
});

// Tool: list apps
server.tool('metadata_list', 'List all apps in your App Store Connect account', {}, async () => {
  if (!hasCredentials()) {
    return { content: [{ type: 'text', text: 'Not configured. Run "shipapp-metadata init" first.' }] };
  }

  const apps = await fetchAll('/apps?fields[apps]=name,bundleId,sku');
  const result = apps.map((a: any) => ({
    id: a.id,
    name: a.attributes.name,
    bundleId: a.attributes.bundleId,
  }));

  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// Tool: pull metadata
server.tool(
  'metadata_pull',
  'Pull metadata for an app from App Store Connect',
  { app: z.string().describe('App name keyword (partial match)') },
  async ({ app }) => {
    if (!hasCredentials()) {
      return { content: [{ type: 'text', text: 'Not configured. Run "shipapp-metadata init" first.' }] };
    }

    const apps = await fetchAll('/apps?fields[apps]=name,bundleId');
    const matched = apps.find((a: any) =>
      a.attributes.name.toLowerCase().includes(app.toLowerCase())
    );

    if (!matched) {
      return { content: [{ type: 'text', text: `No app matching "${app}". Available: ${apps.map((a: any) => a.attributes.name).join(', ')}` }] };
    }

    const versions = await fetchAll(`/apps/${matched.id}/appStoreVersions?filter[platform]=IOS`);
    if (versions.length === 0) {
      return { content: [{ type: 'text', text: 'No iOS versions found' }] };
    }

    const version = versions[0];
    const localizations = await fetchAll(
      `/appStoreVersions/${version.id}/appStoreVersionLocalizations`
    );

    const appInfos = await fetchAll(`/apps/${matched.id}/appInfos`);
    let appInfoLocs: any[] = [];
    if (appInfos.length > 0) {
      appInfoLocs = await fetchAll(`/appInfos/${appInfos[0].id}/appInfoLocalizations?limit=200`);
    }

    const infoMap: Record<string, any> = {};
    for (const loc of appInfoLocs) {
      infoMap[loc.attributes.locale] = { name: loc.attributes.name, subtitle: loc.attributes.subtitle };
    }

    const result: Record<string, any> = {};
    for (const loc of localizations) {
      const locale = loc.attributes.locale;
      const info = infoMap[locale] || {};
      result[locale] = {
        app_name: info.name,
        subtitle: info.subtitle,
        keywords: loc.attributes.keywords,
        promotional_text: loc.attributes.promotionalText,
        description: loc.attributes.description,
        whats_new: loc.attributes.whatsNew,
      };
    }

    return {
      content: [{
        type: 'text',
        text: `${matched.attributes.name} v${version.attributes.versionString}\n\n${JSON.stringify(result, null, 2)}`,
      }],
    };
  }
);

// Tool: push metadata
server.tool(
  'metadata_push',
  'Push metadata updates to App Store Connect for a specific locale',
  {
    app: z.string().describe('App name keyword'),
    locale: z.string().describe('Locale code (e.g., en-US, zh-Hans)'),
    description: z.string().optional().describe('App description'),
    keywords: z.string().optional().describe('Keywords (comma-separated)'),
    promotional_text: z.string().optional().describe('Promotional text'),
    whats_new: z.string().optional().describe("What's New text"),
  },
  async ({ app, locale, description, keywords, promotional_text, whats_new }) => {
    if (!hasCredentials()) {
      return { content: [{ type: 'text', text: 'Not configured.' }] };
    }

    const apps = await fetchAll('/apps?fields[apps]=name,bundleId');
    const matched = apps.find((a: any) =>
      a.attributes.name.toLowerCase().includes(app.toLowerCase())
    );
    if (!matched) {
      return { content: [{ type: 'text', text: `No app matching "${app}"` }] };
    }

    const versions = await fetchAll(`/apps/${matched.id}/appStoreVersions?filter[platform]=IOS`);
    let version = versions.find((v: any) => EDITABLE_STATES.includes(v.attributes.appStoreState));
    if (!version) version = versions[0];
    if (!version) {
      return { content: [{ type: 'text', text: 'No iOS version found' }] };
    }

    const localizations = await fetchAll(
      `/appStoreVersions/${version.id}/appStoreVersionLocalizations`
    );
    const loc = localizations.find((l: any) => l.attributes.locale === locale);
    if (!loc) {
      return { content: [{ type: 'text', text: `Locale "${locale}" not found for this app` }] };
    }

    const attributes: Record<string, string> = {};
    if (description) attributes.description = description;
    if (keywords) attributes.keywords = keywords;
    if (promotional_text) attributes.promotionalText = promotional_text;
    if (whats_new) attributes.whatsNew = whats_new;

    if (Object.keys(attributes).length === 0) {
      return { content: [{ type: 'text', text: 'No fields to update' }] };
    }

    await apiRequest('PATCH', `/appStoreVersionLocalizations/${loc.id}`, {
      data: { type: 'appStoreVersionLocalizations', id: loc.id, attributes },
    });

    return {
      content: [{
        type: 'text',
        text: `Updated ${locale} for ${matched.attributes.name}: ${Object.keys(attributes).join(', ')}`,
      }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
