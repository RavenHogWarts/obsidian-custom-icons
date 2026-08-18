English | [中文](https://github.com/Raven-Pensieve/obsidian-custom-icons/blob/master/README.ZH.md)

# Custom Icons

Enhance your workspace with customizable icons for documents and folders.

![GitHub Socialify](https://socialify.git.ci/Raven-Pensieve/obsidian-custom-icons/image?description=1&font=Rokkitt&forks=1&issues=1&language=1&name=1&owner=1&pattern=Floating+Cogs&pulls=1&stargazers=1&theme=Auto)

## v1.0 Important Notice: Remaster and Breaking Changes

Version **v1.0** of this plugin introduces **breaking changes** and a complete **remaster**.

- **Support for Obsidian 1.11**: Aligned with the new "Settings Page Icons" feature in Obsidian 1.11, this plugin now allows you to **customize icons for the settings page**.
- **Future Roadmap**: Features from versions prior to 1.0 (previously relying on CSS) are planned to be reimplemented using a new method in the future, and CSS-based configuration will no longer be supported.

Please be aware of these changes to ensure your setup continues to work correctly.

## Usage

![Usage](docs/Usage.EN.png)

## Installation
### Community plugin market installation

[Click to install](obsidian://show-plugin?id=custom-sidebar-icons), or:

1. Open Obsidian and go to `Settings > Community Plugins`.
2. Search for "Custom Icons".
3. Click "Install".

### BRAT (Recommended for Beta Users)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin
2. Click "Add Beta plugin" in BRAT settings
3. Enter `Raven-Pensieve/obsidian-custom-icons`
4. Enable the plugin

## FAQ

### Can other plugins use my custom SVG icons?

Yes. Library icons are registered as **regular Obsidian global icons** with the id `CI-<icon-id>`. Any plugin can render them with `setIcon(el, "CI-my-icon")`, and newly added SVGs take effect **immediately — no app reload required**.

### My icon shows blank inside another plugin?

Obsidian's `setIcon` is a one-shot render: if that plugin rendered the icon **before** Custom Icons was loaded (plugin load order varies by user), the spot stays blank. Try in order:

1. Run the command **"Custom Icons: Reapply all icons"** (refreshes icons on surfaces managed by this plugin);
2. Reopen the affected view / panel;
3. Enable **Settings → Experimental → "Always load this plugin first"** and restart (see below — the root fix);
4. Reload that plugin, or restart Obsidian.

**Advanced: always load this plugin first.** Community plugins load in the order of the array in `.obsidian/community-plugins.json`. Moving `"custom-sidebar-icons"` to the front of the array (then restarting Obsidian) makes it register icons before any other plugin loads — completely avoiding blank icons on one-shot surfaces such as ribbon actions. Or enable **"Always load this plugin first"** under **Settings → Experimental** of this plugin — it automatically re-enforces the front position whenever the plugin loads (reorders only, never adds/removes entries; takes effect on next restart; experimental). Note: when reordering manually, never remove entries; enabling new plugins may rewrite the array. Ribbon actions can also be assigned icons directly in Settings → Ribbon sidebar of this plugin.

## License

This project is licensed under the MIT LICENSE - see the [LICENSE](LICENSE) file for details.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Raven-Pensieve/obsidian-custom-icons&type=Timeline)](https://www.star-history.com/#Raven-Pensieve/obsidian-custom-icons&Timeline)

## Acknowledgements

- [obsidian-metadata-icon](https://github.com/Benature/obsidian-metadata-icon)
- [Templater](https://github.com/SilentVoid13/Templater)
