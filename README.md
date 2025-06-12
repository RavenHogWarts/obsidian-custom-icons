English | [中文](./README-zh.md)

# Custom Icons

Enhance your workspace with customizable icons for documents and folders.

[![GitHub stars](https://img.shields.io/github/stars/RavenHogWarts/obsidian-custom-icons?style=flat&label=Stars)](https://github.com/RavenHogWarts/obsidian-custom-icons/stargazers)
[![Total Downloads](https://img.shields.io/github/downloads/RavenHogWarts/obsidian-custom-icons/total?style=flat&label=Total%20Downloads)](https://github.com/RavenHogWarts/obsidian-custom-icons/releases)
[![GitHub License](https://img.shields.io/github/license/RavenHogWarts/obsidian-custom-icons?style=flat&label=License)](https://github.com/RavenHogWarts/obsidian-custom-icons/blob/master/LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/RavenHogWarts/obsidian-custom-icons?style=flat&label=Issues)](https://github.com/RavenHogWarts/obsidian-custom-icons/issues)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/RavenHogWarts/obsidian-custom-icons?style=flat&label=Last%20Commit)](https://github.com/RavenHogWarts/obsidian-custom-icons/commits/master)

## Usage

Currently, there are two ways to set the icons:

- Custom: This includes using online URLs, local relative or absolute file paths, Base64 encodings, or SVG tags.
- Lucide icons: This method requires only the name of the icon from [Lucide](https://lucide.dev/icons/). Note that the official Obsidian icons also use Lucide icons.

### Examples

- Online URL: `https://www.example.com/favicon.ico`
- Local images:
  - Relative path: `.obsidian/svg/example.svg`
  - Absolute path (Unix-style): `/Users/YourUsername/Pictures/example.jpg`
  - Absolute path (Windows-style): `D:\Pictures\example.png`
- Base64 encoding: Starting with `data:`
- SVG tags: Enclosed within `<svg></svg>` tags
- Lucide source icons: Directly use the icon name from Lucide.

![Usage](attachment/Usage_EN.png)

## Installation
### Community plugin market installation

[Click to install](obsidian://show-plugin?id=custom-sidebar-icons), or:

1. Open Obsidian and go to `Settings > Community Plugins`.
2. Search for "Custom Icons".
3. Click "Install".

### Manual Installation

1. Download the latest release
2. Copy `main.js`, `styles.css`, and `manifest.json` to your vault's plugins folder: `<vault>/.obsidian/plugins/obsidian-custom-icons/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

### BRAT (Recommended for Beta Users)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin
2. Click "Add Beta plugin" in BRAT settings
3. Enter `RavenHogWarts/obsidian-custom-icons`
4. Enable the plugin

## Development

- Clone this repo
- Make sure your NodeJS is at least v16 (`node --version`)
- `npm i` or `yarn` to install dependencies
- `npm run dev` to start compilation in watch mode
- `npm run build` to build the plugin
- `npm run build:local` to build the plugin and copy it to your vault's plugins folder(need create a .env file in the project root and add the line: VAULT_PATH=/path/to/your/vault)
- `npm run version` to bump the version number and update the manifest.json, version.json, package.json
- `npm run release` to build the plugin and bump the version number

## Support

If you encounter any issues or have suggestions:
- [Open an issue](https://github.com/RavenHogWarts/obsidian-custom-icons/issues) on GitHub
- [Join the discussion](https://github.com/RavenHogWarts/obsidian-custom-icons/discussions) for questions and ideas

If you find this plugin helpful, you can support the development through:
- WeChat/Alipay: [QR Code](https://s2.loli.net/2024/05/06/lWBj3ObszUXSV2f.png)

## License

This project is licensed under the MIT LICENSE - see the [LICENSE](LICENSE) file for details.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=RavenHogWarts/obsidian-custom-icons&type=Timeline)](https://www.star-history.com/#RavenHogWarts/obsidian-custom-icons&Timeline)

## Acknowledgements

- [obsidian-metadata-icon](https://github.com/Benature/obsidian-metadata-icon)
- [Templater](https://github.com/SilentVoid13/Templater)
