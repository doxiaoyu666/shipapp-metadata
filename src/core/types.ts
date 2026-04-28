export interface ShipAppCredentials {
  keyId: string;
  issuerId: string;
  privateKeyPath: string;
}

export interface ShipAppConfig {
  defaultApp?: string;
  defaultProfile?: string;
}

export interface AppInfo {
  id: string;
  name: string;
  bundleId: string;
  sku: string;
}

export interface VersionInfo {
  id: string;
  versionString: string;
  appStoreState: string;
  platform: string;
}

export interface LocalizationInfo {
  id: string;
  locale: string;
  description?: string;
  keywords?: string;
  promotionalText?: string;
  whatsNew?: string;
}

export interface AppInfoLocalization {
  id: string;
  locale: string;
  name?: string;
  subtitle?: string;
}

export interface MetadataFile {
  language?: string;
  language_code?: string;
  app_name?: string;
  subtitle?: string;
  keywords?: string;
  promotional_text?: string;
  description?: string;
  whats_new?: string;
}

// Folder name → App Store Connect screenshotDisplayType
export const DISPLAY_TYPE_MAP: Record<string, string> = {
  '6.9-inch': 'APP_IPHONE_67',
  '6.7-inch': 'APP_IPHONE_67',
  '6.5-inch': 'APP_IPHONE_65',
  '5.5-inch': 'APP_IPHONE_55',
  'ipad-13': 'APP_IPAD_PRO_3GEN_129',
  'ipad-12.9': 'APP_IPAD_PRO_3GEN_129',
  'ipad-11': 'APP_IPAD_PRO_3GEN_11',
};

// JSON locale → ASC API locale
export const LOCALE_MAP: Record<string, string> = {
  'en-US': 'en-US',
  'zh-Hans': 'zh-Hans',
  'zh-Hant': 'zh-Hant',
  'ja': 'ja',
  'ko': 'ko',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'es': 'es-ES',
  'it': 'it',
  'pt-BR': 'pt-BR',
  'ru': 'ru',
};

export const EN_VARIANTS = ['en-GB', 'en-AU', 'en-CA'];

export const EDITABLE_STATES = [
  'PREPARE_FOR_SUBMISSION',
  'DEVELOPER_REJECTED',
  'REJECTED',
  'METADATA_REJECTED',
  'WAITING_FOR_REVIEW',
  'INVALID_BINARY',
];
