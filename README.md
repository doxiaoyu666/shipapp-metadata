# @shipapp/metadata

Manage App Store Connect metadata from the command line. Upload descriptions, keywords, screenshots, and more — across all languages at once.

Part of the [ShipApp](https://github.com/shipapp) toolkit for indie iOS developers.

## Why?

Updating App Store metadata through the web UI is painful — especially when you support multiple languages. Every release, you have to:

1. Log into App Store Connect
2. Click through each language tab one by one
3. Copy-paste descriptions, keywords, What's New text
4. Upload screenshots for every device size × every language
5. Repeat for 10+ languages

**@shipapp/metadata** turns this into a single command. Pull your current metadata to local JSON files, edit them in your favorite editor (or generate them with AI), and push everything back in seconds. Screenshots too.

## Features

- **Pull** metadata from App Store Connect to local JSON files
- **Push** descriptions, keywords, promotional text, and What's New in all languages
- **Upload screenshots** for all devices and languages in one command
- **Auto-sync** English variants (en-GB, en-AU, en-CA) from en-US
- **MCP Server** for AI agent integration (Claude, etc.)

## Quick Start

```bash
npm install -g @shipapp/metadata

# Configure your API credentials (one-time setup)
shipapp-metadata init

# List all apps in your account
shipapp-metadata list

# Pull current metadata to local files
shipapp-metadata pull --app "MyApp" --output ./metadata

# Edit the JSON files, then push back
shipapp-metadata push --app "MyApp" --dir ./metadata

# Upload screenshots
shipapp-metadata screenshots --app "MyApp" --dir ./screenshots
```

## Setup

You need an **App Store Connect API Key**:

1. Go to [App Store Connect](https://appstoreconnect.apple.com/) → Users and Access → Integrations → Keys
2. Click **Generate API Key** (requires Admin role)
3. Download the `.p8` private key file (you can only download it once!)
4. Note the **Key ID** and **Issuer ID**

Then run:

```bash
shipapp-metadata init
```

It will ask for your Key ID, Issuer ID, and the path to your `.p8` file. Credentials are stored in `~/.shipapp/credentials.json` (file permission `600`).

## Commands

### `init`

Interactive setup for App Store Connect API credentials.

```bash
shipapp-metadata init
```

### `list`

List all apps in your App Store Connect account.

```bash
shipapp-metadata list
```

### `pull`

Download metadata from App Store Connect to local JSON files.

```bash
shipapp-metadata pull --app <keyword> [--output <dir>]
```

- `--app` — App name keyword (matches partially, case-insensitive)
- `--output` — Output directory (default: `./metadata`)

Each language gets its own JSON file (e.g., `en-US.json`, `zh-Hans.json`):

```json
{
  "language_code": "en-US",
  "app_name": "My App",
  "subtitle": "A great app",
  "keywords": "photo,camera,edit",
  "promotional_text": "Try our new features!",
  "description": "Full app description...",
  "whats_new": "Bug fixes and improvements"
}
```

### `push`

Upload metadata to App Store Connect from local JSON files.

```bash
shipapp-metadata push --app <keyword> --dir <path> [--only <fields>]
```

- `--app` — App name keyword
- `--dir` — Directory containing JSON metadata files
- `--only` — Only update specific fields (comma-separated): `description`, `keywords`, `promotional_text`, `whats_new`, `app_name`, `subtitle`

Examples:

```bash
# Update everything
shipapp-metadata push --app "MyApp" --dir ./metadata

# Only update What's New
shipapp-metadata push --app "MyApp" --dir ./metadata --only whats_new

# Update keywords and description
shipapp-metadata push --app "MyApp" --dir ./metadata --only keywords,description
```

### `screenshots`

Upload App Store screenshots for all languages and device sizes.

```bash
shipapp-metadata screenshots --app <keyword> --dir <path>
```

Screenshot directory structure:

```
screenshots/
├── en-US/
│   ├── 6.7-inch/          # iPhone 15/16 Pro Max
│   │   ├── 01.png
│   │   ├── 02.png
│   │   └── 03.png
│   └── ipad-13/           # iPad Pro 13"
│       └── 01.png
└── zh-Hans/
    └── 6.7-inch/
        └── 01.png
```

Supported device folders:

| Folder | Device |
|--------|--------|
| `6.9-inch` | iPhone 16 Pro Max |
| `6.7-inch` | iPhone 15 Pro Max |
| `6.5-inch` | iPhone 11 Pro Max / XS Max |
| `5.5-inch` | iPhone 8 Plus |
| `ipad-13` | iPad Pro 13" |
| `ipad-12.9` | iPad Pro 12.9" |
| `ipad-11` | iPad Pro 11" |

Images are ordered by filename (sorted alphabetically).

en-US screenshots are automatically synced to en-GB, en-AU, and en-CA.

## Supported Languages

| Code | Language |
|------|----------|
| `en-US` | English (US) — auto-synced to en-GB, en-AU, en-CA |
| `zh-Hans` | Simplified Chinese |
| `zh-Hant` | Traditional Chinese |
| `ja` | Japanese |
| `ko` | Korean |
| `fr` | French |
| `de` | German |
| `es` | Spanish |
| `it` | Italian |
| `pt-BR` | Portuguese (Brazil) |
| `ru` | Russian |

## Configuration

Credentials are stored in `~/.shipapp/`:

```
~/.shipapp/
├── credentials.json    # API Key (file permission 600)
└── config.json         # User preferences
```

## FAQ

**Q: How is this different from fastlane?**

fastlane is a comprehensive iOS automation suite. `@shipapp/metadata` is focused on one thing: managing App Store metadata. It's simpler, faster to set up, and works great as a standalone tool or alongside fastlane.

**Q: Can I use this with CI/CD?**

Yes. Set up credentials on your CI machine with `shipapp-metadata init` or by creating `~/.shipapp/credentials.json` directly.

**Q: What if I lose my .p8 key file?**

You'll need to generate a new one in App Store Connect. Apple doesn't allow re-downloading .p8 files.

## License

MIT
