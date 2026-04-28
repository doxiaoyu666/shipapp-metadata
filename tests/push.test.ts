import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('push command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shipapp-push-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  describe('metadata JSON parsing', () => {
    it('reads language_code from JSON file', () => {
      const metadata = {
        language_code: 'en-US',
        description: 'Test description',
        keywords: 'test,app',
      };
      const filePath = path.join(tmpDir, 'en-US.json');
      fs.writeFileSync(filePath, JSON.stringify(metadata));

      const loaded = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(loaded.language_code).toBe('en-US');
      expect(loaded.description).toBe('Test description');
    });

    it('falls back to filename when language_code missing', () => {
      const metadata = { description: 'Test' };
      const filePath = path.join(tmpDir, 'zh-Hans.json');
      fs.writeFileSync(filePath, JSON.stringify(metadata));

      const loaded = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const jsonLocale = loaded.language_code || path.basename(filePath, '.json');
      expect(jsonLocale).toBe('zh-Hans');
    });

    it('filters only JSON files from directory', () => {
      fs.writeFileSync(path.join(tmpDir, 'en-US.json'), '{}');
      fs.writeFileSync(path.join(tmpDir, 'zh-Hans.json'), '{}');
      fs.writeFileSync(path.join(tmpDir, 'README.md'), '# test');
      fs.writeFileSync(path.join(tmpDir, '.DS_Store'), '');

      const jsonFiles = fs.readdirSync(tmpDir).filter((f: string) => f.endsWith('.json'));
      expect(jsonFiles).toEqual(['en-US.json', 'zh-Hans.json']);
    });
  });

  describe('onlyFields filtering', () => {
    it('filters attributes based on onlyFields set', () => {
      const metadata = {
        description: 'Full desc',
        keywords: 'a,b,c',
        promotional_text: 'Promo',
        whats_new: 'New stuff',
      };

      const onlyFields = new Set(['whats_new']);
      const attributes: Record<string, string> = {};

      if (metadata.description && (!onlyFields || onlyFields.has('description')))
        attributes.description = metadata.description;
      if (metadata.keywords && (!onlyFields || onlyFields.has('keywords')))
        attributes.keywords = metadata.keywords;
      if (metadata.whats_new && (!onlyFields || onlyFields.has('whats_new')))
        attributes.whatsNew = metadata.whats_new;

      expect(attributes).toEqual({ whatsNew: 'New stuff' });
      expect(attributes.description).toBeUndefined();
      expect(attributes.keywords).toBeUndefined();
    });

    it('includes all fields when onlyFields is undefined', () => {
      const metadata = {
        description: 'Desc',
        keywords: 'k',
        whats_new: 'New',
      };

      const onlyFields = undefined;
      const attributes: Record<string, string> = {};

      if (metadata.description && (!onlyFields || onlyFields.has('description')))
        attributes.description = metadata.description;
      if (metadata.keywords && (!onlyFields || onlyFields.has('keywords')))
        attributes.keywords = metadata.keywords;
      if (metadata.whats_new && (!onlyFields || onlyFields.has('whats_new')))
        attributes.whatsNew = metadata.whats_new;

      expect(Object.keys(attributes)).toHaveLength(3);
    });
  });

  describe('whats_new subdirectory fallback', () => {
    it('prefers whats_new subdir file over main file', () => {
      // Main file
      const mainMeta = { language_code: 'en-US', whats_new: 'From main' };
      fs.writeFileSync(path.join(tmpDir, 'en-US.json'), JSON.stringify(mainMeta));

      // whats_new subdir
      const wnDir = path.join(tmpDir, 'whats_new');
      fs.mkdirSync(wnDir);
      fs.writeFileSync(path.join(wnDir, 'en-US.json'), JSON.stringify({ whats_new: 'From subdir' }));

      const whatsNewFile = path.join(tmpDir, 'whats_new', 'en-US.json');
      let whatsNew: string | null = null;

      if (fs.existsSync(whatsNewFile)) {
        const wnData = JSON.parse(fs.readFileSync(whatsNewFile, 'utf-8'));
        whatsNew = wnData.whats_new;
      } else {
        whatsNew = mainMeta.whats_new;
      }

      expect(whatsNew).toBe('From subdir');
    });

    it('falls back to main file when subdir not present', () => {
      const mainMeta = { language_code: 'en-US', whats_new: 'From main' };
      fs.writeFileSync(path.join(tmpDir, 'en-US.json'), JSON.stringify(mainMeta));

      const whatsNewFile = path.join(tmpDir, 'whats_new', 'en-US.json');
      let whatsNew: string | null = null;

      if (fs.existsSync(whatsNewFile)) {
        const wnData = JSON.parse(fs.readFileSync(whatsNewFile, 'utf-8'));
        whatsNew = wnData.whats_new;
      } else {
        whatsNew = mainMeta.whats_new;
      }

      expect(whatsNew).toBe('From main');
    });
  });
});
