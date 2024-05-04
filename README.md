# Custom Icons

Enhance your workspace with customizable icons for documents and folders.

<div align="center">

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22custom-sidebar-icons%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json) ![GitHub stars](https://img.shields.io/github/stars/RavenHogWarts/obsidian-custom-icons?style=flat) ![latest download](https://img.shields.io/github/downloads/RavenHogWarts/obsidian-custom-icons/latest/total?style=plastic) 
[![Github release](https://img.shields.io/github/manifest-json/v/RavenHogWarts/obsidian-custom-icons?color=blue)](https://github.com/RavenHogWarts/obsidian-custom-icons/releases/latest) ![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/RavenHogWarts/obsidian-custom-icons?include_prereleases&label=BRAT%20beta)

[ [中文](https://github.com/RavenHogWarts/obsidian-custom-icons/blob/master/README_ZH.md) | English ]

</div>

This plugin allows you to customize the icons for pinned files in your Obsidian sidebar, making your workspace more personalized and easier to navigate.

## Usage

Currently, there are two ways to set the icons, one is custom, and the other is using lucide source icons
- Custom
  - Custom includes using online URL, local relative (absolute) file path, base64 encoding, svg tags
- Lucide icons
  - This method only requires the icon name obtained from [lucide](https://lucide.dev/icons/)
  - Importantly, the official icons also use lucide icons

### Examples

- Online URL
  - Example: `https://www.baidu.com/favicon.ico`
- Local images
  - Relative path: `.obsidian/svg/RavenHogwarts.svg`
  - Absolute path (Unix-style): `/Users/RavenHogwarts/Pictures/RavenHogwarts.jpg`
  - Absolute path (Windows-style): `D:\RavenHogwarts.png`, `D:/RavenHogwarts.png`
- Base64 encoding
  - Starting with `data:`
- SVG tags
  - Enclosed within `<svg></svg>` tags
- Lucide source icons
  - Icon name from [lucide](https://lucide.dev/icons/)

![Usage](attachment/Usage_EN.png)

## Support

If you find this plugin useful and would like to support its development, you can sponsor me through the following methods: WeChat, Alipay, or [Love Power Donation](https://afdian.net/a/ravenhogwarts). Any amount is welcome, thank you!

<p align="center">
<img src="https://s2.loli.net/2024/04/02/4lCUdaSf5bOXEPM.png" width="500px">
</p>

## Installation

### Install from plugin community

[click to install](https://obsidian.md/plugins?id=custom-sidebar-icons), or:

- Open Obsidian and go to Settings > Community Plugins
- Search for `Custom Icons`
- Click `Install` 

### Install via [BRAT plugin](https://obsidian.md/plugins?id=obsidian42-brat)

- First, install the [BRAT plugin](https://obsidian.md/plugins?id=obsidian42-brat):
- In the BRAT plugin, click `Add Beta plugin`
- Enter https://github.com/RavenHogWarts/obsidian-custom-icons
- Enable `Custom Icons` in `Third-party Plugins`

### Manual Installation

- Download the latest release from the [releases page](https://github.com/RavenHogWarts/obsidian-custom-icons/releases/latest)
- Copy `main.js` and `manifest.json` to your vault folder `VaultFolder/.obsidian/plugins/custom-sidebar-icons/`
- Reload plugins and enable `Custom Icons` in `Third-party Plugins`

## How to Build

- `git clone https://github.com/RavenHogWarts/obsidian-custom-sidebar-icons` to clone the repository.
- `npm i` to install dependencies.
- `npm run dev` to start real-time compilation.
- `npm run build` to build for production.

## Acknowledgements

During the development of the `Custom Sidebar Icons` plugin, I drew inspiration and incorporated some code constructs from [Benature](https://github.com/Benature)'s project [obsidian-metadata-icon](https://github.com/Benature/obsidian-metadata-icon). I would like to especially thank this project and its contributors for their contributions to the open-source community, which have greatly facilitated the development of the Obsidian plugin ecosystem. If you are also interested in their project, please support and follow [obsidian-metadata-icon](https://github.com/Benature/obsidian-metadata-icon).
