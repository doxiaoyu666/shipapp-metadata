import { describe, it, expect } from 'vitest';
import { LOCALE_MAP, EN_VARIANTS, EDITABLE_STATES, DISPLAY_TYPE_MAP } from '../src/core/types';

describe('LOCALE_MAP', () => {
  it('maps short locale codes to ASC API codes', () => {
    expect(LOCALE_MAP['fr']).toBe('fr-FR');
    expect(LOCALE_MAP['de']).toBe('de-DE');
    expect(LOCALE_MAP['es']).toBe('es-ES');
    expect(LOCALE_MAP['nl']).toBe('nl-NL');
    expect(LOCALE_MAP['ar']).toBe('ar-SA');
  });

  it('passes through unmapped locales', () => {
    // Unmapped locales should not exist in the map — they are used as-is
    expect(LOCALE_MAP['en-US']).toBeUndefined();
    expect(LOCALE_MAP['zh-Hans']).toBeUndefined();
    expect(LOCALE_MAP['ja']).toBeUndefined();
    expect(LOCALE_MAP['ko']).toBeUndefined();
  });
});

describe('EN_VARIANTS', () => {
  it('contains en-GB, en-AU, en-CA', () => {
    expect(EN_VARIANTS).toEqual(['en-GB', 'en-AU', 'en-CA']);
  });

  it('does not contain en-US', () => {
    expect(EN_VARIANTS).not.toContain('en-US');
  });
});

describe('EDITABLE_STATES', () => {
  it('includes PREPARE_FOR_SUBMISSION', () => {
    expect(EDITABLE_STATES).toContain('PREPARE_FOR_SUBMISSION');
  });

  it('does not include READY_FOR_SALE', () => {
    expect(EDITABLE_STATES).not.toContain('READY_FOR_SALE');
  });
});

describe('DISPLAY_TYPE_MAP', () => {
  it('maps device folder names to ASC display types', () => {
    expect(DISPLAY_TYPE_MAP['6.7-inch']).toBe('APP_IPHONE_67');
    expect(DISPLAY_TYPE_MAP['6.5-inch']).toBe('APP_IPHONE_65');
    expect(DISPLAY_TYPE_MAP['5.5-inch']).toBe('APP_IPHONE_55');
    expect(DISPLAY_TYPE_MAP['ipad-13']).toBe('APP_IPAD_PRO_3GEN_129');
    expect(DISPLAY_TYPE_MAP['ipad-11']).toBe('APP_IPAD_PRO_3GEN_11');
  });

  it('maps both 6.9-inch and 6.7-inch to iPhone 67', () => {
    expect(DISPLAY_TYPE_MAP['6.9-inch']).toBe('APP_IPHONE_67');
    expect(DISPLAY_TYPE_MAP['6.7-inch']).toBe('APP_IPHONE_67');
  });
});
