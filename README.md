# @shipapp/metadata

[English](#english) | [中文](#中文)

---

<a id="english"></a>

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
- **Claude Code Skill** — generate multilingual metadata with AI and upload in one command

## Quick Start

### Option A: Claude Code (Recommended)

If you use [Claude Code](https://claude.ai/code), just clone this repo and use the built-in skill:

```bash
git clone https://github.com/doxiaoyu666/shipapp-metadata.git
cd shipapp-metadata
npm install && npm run build

# One-time setup
shipapp-metadata init

# Then use the skill in Claude Code:
/aso-metadata MyApp
```

The skill will generate optimized metadata in 8 languages, let you review, then upload to App Store Connect automatically.

### Option B: CLI

```bash
git clone https://github.com/doxiaoyu666/shipapp-metadata.git
cd shipapp-metadata
npm install && npm run build

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

## Prerequisites

- Your app must already exist in App Store Connect (at least one version created)
- This tool **cannot** create new apps — you must do that manually in the ASC web UI first
- The tool manages metadata for existing apps: descriptions, keywords, screenshots, etc.

## Typical Workflows

### First time: Pull existing metadata

If your app is already on the App Store, start by pulling your current metadata:

```bash
shipapp-metadata pull --app "MyApp" --output ./metadata
```

This creates one JSON file per language (e.g., `en-US.json`, `zh-Hans.json`) with your current descriptions, keywords, etc. Now you have a local copy to work with.

### Every release: Update What's New only

The most common use case — you're releasing a new version and only need to update the "What's New" text, without touching descriptions or keywords:

**With Claude Code (recommended):**
```
/aso-metadata MyApp --only whats_new
```
Tell it what changed → AI generates What's New in all languages → review → auto-upload. Other fields (description, keywords, etc.) are left unchanged.

**With CLI:**
1. Edit the `whats_new` field in each JSON file
2. `shipapp-metadata push --app "MyApp" --dir ./metadata --only whats_new`

### Full metadata refresh

When you want to rewrite everything — descriptions, keywords, promotional text, and What's New:

**With Claude Code:**
```
/aso-metadata MyApp
```
Describe your app or point to a changelog → AI generates all fields for all languages → review → upload.

**With CLI:**
1. Edit the JSON files (or use any AI tool to generate them)
2. `shipapp-metadata push --app "MyApp" --dir ./metadata`

### Update screenshots

Prepare screenshots in the required directory structure, then:

```bash
shipapp-metadata screenshots --app "MyApp" --dir ./screenshots
```

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

Any locale supported by App Store Connect works out of the box. Common ones:

| Code | Language |
|------|----------|
| `en-US` | English (US) — auto-synced to en-GB, en-AU, en-CA |
| `zh-Hans` | Simplified Chinese |
| `zh-Hant` | Traditional Chinese |
| `ja` | Japanese |
| `ko` | Korean |
| `fr` / `fr-FR` | French |
| `de` / `de-DE` | German |
| `es` / `es-ES` | Spanish |
| `it` | Italian |
| `pt-BR` | Portuguese (Brazil) |
| `ru` | Russian |
| `ar-SA` | Arabic |
| `th` | Thai |
| `vi` | Vietnamese |
| `tr` | Turkish |
| `nl-NL` | Dutch |
| `sv` | Swedish |
| `da` | Danish |
| `pl` | Polish |
| `uk` | Ukrainian |
| ... | [All ASC locales supported](https://developer.apple.com/help/app-store-connect/reference/app-store-localizations/) |

## Configuration

Credentials are stored in `~/.shipapp/`:

```
~/.shipapp/
├── credentials.json    # API Key (file permission 600)
└── config.json         # User preferences
```

## FAQ

**Q: Can I use this with CI/CD?**

Yes. Set up credentials on your CI machine with `shipapp-metadata init` or by creating `~/.shipapp/credentials.json` directly.

**Q: What if I lose my .p8 key file?**

You'll need to generate a new one in App Store Connect. Apple doesn't allow re-downloading .p8 files.

## License

MIT

---

<a id="中文"></a>

# @shipapp/metadata

通过命令行管理 App Store Connect 元数据。一条命令批量上传所有语言的描述、关键词、截图。

[ShipApp](https://github.com/shipapp) 独立开发者工具箱的一部分。

## 为什么需要这个工具？

每次发版都要在 App Store Connect 后台手动更新元数据，非常痛苦——尤其是多语言的时候：

1. 登录 App Store Connect
2. 逐个点击每种语言的标签页
3. 复制粘贴描述、关键词、更新日志
4. 为每种设备尺寸 × 每种语言上传截图
5. 10+ 种语言重复以上操作

**@shipapp/metadata** 把这一切变成一条命令。把元数据拉到本地 JSON 文件，用你喜欢的编辑器修改（或用 AI 生成），然后一键推送回去。截图也一样。

## 功能

- **拉取** App Store Connect 元数据到本地 JSON 文件
- **推送** 所有语言的描述、关键词、推广文本、更新日志
- **上传截图** 一条命令搞定所有设备和语言
- **自动同步** 英文变体（en-GB、en-AU、en-CA）从 en-US 同步
- **MCP Server** 支持 AI 代理集成（Claude 等）
- **Claude Code Skill** — AI 生成多语言文案并一键上传

## 快速开始

### 方式一：Claude Code（推荐）

如果你使用 [Claude Code](https://claude.ai/code)，clone 本仓库后直接用内置 Skill：

```bash
git clone https://github.com/doxiaoyu666/shipapp-metadata.git
cd shipapp-metadata
npm install && npm run build

# 首次配置
shipapp-metadata init

# 在 Claude Code 中使用：
/aso-metadata 我的App
```

Skill 会自动生成 8 种语言的优化文案，确认后一键上传到 App Store Connect。

### 方式二：CLI

```bash
git clone https://github.com/doxiaoyu666/shipapp-metadata.git
cd shipapp-metadata
npm install && npm run build

# 配置 API 凭证（只需一次）
shipapp-metadata init

# 查看账号下的所有 App
shipapp-metadata list

# 拉取元数据到本地
shipapp-metadata pull --app "我的App" --output ./metadata

# 编辑 JSON 文件后推送
shipapp-metadata push --app "我的App" --dir ./metadata

# 上传截图
shipapp-metadata screenshots --app "我的App" --dir ./screenshots
```

## 配置

需要一个 **App Store Connect API Key**：

1. 进入 [App Store Connect](https://appstoreconnect.apple.com/) → 用户和访问 → 集成 → 密钥
2. 点击 **生成 API 密钥**（需要管理员权限）
3. 下载 `.p8` 私钥文件（只能下载一次！）
4. 记下 **Key ID** 和 **Issuer ID**

然后运行：

```bash
shipapp-metadata init
```

按提示输入 Key ID、Issuer ID 和 `.p8` 文件路径。凭证保存在 `~/.shipapp/credentials.json`（权限 `600`）。

## 前提条件

- App 必须已经在 App Store Connect 中创建（至少有一个版本）
- 本工具**不能**创建新 App，需要先在 ASC 后台手动创建
- 工具用于管理已有 App 的元数据：描述、关键词、截图等

## 典型工作流

### 首次使用：拉取现有文案

如果你的 App 已经上架，先把当前文案拉到本地：

```bash
shipapp-metadata pull --app "我的App" --output ./metadata
```

每种语言生成一个 JSON 文件（`en-US.json`、`zh-Hans.json` 等），包含当前的描述、关键词等。

### 每次发版：只更新「新功能」

最常见的场景——发新版本时，只需要更新 What's New，不动描述和关键词：

**用 Claude Code（推荐）：**
```
/aso-metadata 我的App --only whats_new
```
告诉它改了什么 → AI 生成所有语言的更新日志 → 确认 → 自动上传。其他字段（描述、关键词等）不会被修改。

**用 CLI：**
1. 编辑每个 JSON 文件的 `whats_new` 字段
2. `shipapp-metadata push --app "我的App" --dir ./metadata --only whats_new`

### 全量更新文案

当你想重写所有内容——描述、关键词、推广文本、更新日志：

**用 Claude Code：**
```
/aso-metadata 我的App
```
描述你的 App 或指向 changelog → AI 生成所有语言的优化文案 → 确认 → 上传。

**用 CLI：**
1. 编辑 JSON 文件（或用 AI 工具生成）
2. `shipapp-metadata push --app "我的App" --dir ./metadata`

### 更新截图

准备好截图目录结构后：

```bash
shipapp-metadata screenshots --app "我的App" --dir ./screenshots
```

## 命令

### `init` — 初始化配置

```bash
shipapp-metadata init
```

### `list` — 列出所有 App

```bash
shipapp-metadata list
```

### `pull` — 拉取元数据

```bash
shipapp-metadata pull --app <关键词> [--output <目录>]
```

- `--app` — App 名称关键词（模糊匹配，不区分大小写）
- `--output` — 输出目录（默认 `./metadata`）

每种语言生成一个 JSON 文件（如 `en-US.json`、`zh-Hans.json`）。

### `push` — 推送元数据

```bash
shipapp-metadata push --app <关键词> --dir <目录> [--only <字段>]
```

- `--app` — App 名称关键词
- `--dir` — 包含 JSON 文件的元数据目录
- `--only` — 只更新指定字段（逗号分隔）：`description`、`keywords`、`promotional_text`、`whats_new`、`app_name`、`subtitle`

```bash
# 更新所有字段
shipapp-metadata push --app "我的App" --dir ./metadata

# 只更新更新日志
shipapp-metadata push --app "我的App" --dir ./metadata --only whats_new
```

### `screenshots` — 上传截图

```bash
shipapp-metadata screenshots --app <关键词> --dir <目录>
```

截图目录结构：

```
screenshots/
├── en-US/
│   ├── 6.7-inch/          # iPhone 15/16 Pro Max
│   │   ├── 01.png
│   │   └── 02.png
│   └── ipad-13/           # iPad Pro 13"
│       └── 01.png
└── zh-Hans/
    └── 6.7-inch/
        └── 01.png
```

支持的设备文件夹：

| 文件夹 | 设备 |
|--------|------|
| `6.9-inch` | iPhone 16 Pro Max |
| `6.7-inch` | iPhone 15 Pro Max |
| `6.5-inch` | iPhone 11 Pro Max / XS Max |
| `5.5-inch` | iPhone 8 Plus |
| `ipad-13` | iPad Pro 13" |
| `ipad-12.9` | iPad Pro 12.9" |
| `ipad-11` | iPad Pro 11" |

图片按文件名排序决定展示顺序。en-US 截图自动同步到 en-GB、en-AU、en-CA。

## 常见问题

**Q: 可以在 CI/CD 中使用吗？**

可以。在 CI 机器上运行 `shipapp-metadata init` 或直接创建 `~/.shipapp/credentials.json`。

**Q: .p8 密钥文件丢了怎么办？**

需要在 App Store Connect 重新生成。Apple 不支持重新下载 `.p8` 文件。

## 开源协议

MIT
