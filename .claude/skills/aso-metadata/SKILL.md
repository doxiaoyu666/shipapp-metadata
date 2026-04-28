---
name: aso-metadata
description: Generate and upload App Store metadata (description, keywords, subtitle, whats_new) in multiple languages. Full workflow from content generation to App Store Connect upload.
argument-hint: <app name> [--only whats_new] [version]
---

# ASO Metadata — Generate & Upload

Generate multilingual App Store metadata and upload to App Store Connect in one workflow.

## Prerequisites

- `shipapp-metadata` CLI installed (`npm install -g @shipapp/metadata`)
- App Store Connect API credentials configured (`shipapp-metadata init`)

## Arguments

- `<app name>` — required. App name keyword for matching (e.g., `fotime`, `tapal`)
- `--only <fields>` — optional. Only generate and upload specific fields. Common values:
  - `whats_new` — only update What's New (most common for releases)
  - `keywords,description` — update keywords and description
  - `description,keywords,promotional_text,whats_new,app_name,subtitle` — all fields (default if omitted)
- `[version]` — optional. Version number to read from CHANGELOG

**Examples:**
- `/aso-metadata MyApp` — generate all fields for all languages
- `/aso-metadata MyApp --only whats_new` — only generate and upload What's New
- `/aso-metadata MyApp --only keywords,description` — only keywords and description

## Workflow

### Step 1 — Determine scope and content

- Parse `--only` flag to determine which fields to generate. If not specified, generate all fields.
- If user specifies a version or changelog, read the update content
- If a CHANGELOG.md exists in the current project, read the latest version
- Otherwise, ask user to describe the update

### Step 2 — Read existing metadata (if any)

Look for existing JSON metadata files in the project. Common locations:
- `./ASO_Materials/`
- `./metadata/`
- User-specified directory

Read existing files to understand the current description style and tone.

### Step 3 — Generate metadata for all languages

Generate these JSON files (one per language):

- `en-US.json` — English (U.S.)
- `zh-Hans.json` — Chinese Simplified
- `zh-Hant.json` — Traditional Chinese
- `ja.json` — Japanese
- `ko.json` — Korean
- `fr-FR.json` — French
- `de-DE.json` — German
- `es-ES.json` — Spanish

**If `--only` is specified**, only update the specified fields in each JSON file. Keep other fields unchanged from the existing files.

**If `--only whats_new`**, only generate and write the `whats_new` field. This is the fastest workflow for routine releases.

Each file format:
```json
{
  "language": "English (U.S.)",
  "language_code": "en-US",
  "app_name": "MyApp",
  "subtitle": "Short tagline",
  "keywords": "keyword1,keyword2,keyword3",
  "promotional_text": "What's great about this update",
  "description": "Full app description...",
  "whats_new": "What's new in this version"
}
```

### Step 4 — Write files and confirm

Write JSON files to the metadata directory. Show a summary of what was generated and ask user to confirm before uploading.

### Step 5 — Upload to App Store Connect

After user confirms, run the push command with matching `--only` flag:

```bash
# If --only was specified:
shipapp-metadata push --app <keyword> --dir <metadata_dir> --only <fields>

# If no --only (full update):
shipapp-metadata push --app <keyword> --dir <metadata_dir>
```

### Step 6 — Upload screenshots (optional)

If user has new screenshots:

```bash
shipapp-metadata screenshots --app <keyword> --dir <screenshots_dir>
```

## Content Rules

- **description**: Highlight core value, natural and fluent — NOT machine translation. Each language should feel native.
- **keywords**: Under 100 characters, comma-separated, don't repeat app name, prioritize high-volume keywords
- **subtitle**: Under 30 characters, concise and impactful
- **promotional_text**: Under 170 characters, highlight this update
- **whats_new**: Concise release notes for this version
- No emoji (Apple review guidelines)
- All languages independently optimized, not simple translations

## Other Useful Commands

```bash
# Pull current metadata from App Store Connect
shipapp-metadata pull --app <keyword> --output <dir>

# List all apps in your account
shipapp-metadata list
```
