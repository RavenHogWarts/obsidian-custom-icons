中文 | [English](https://github.com/Raven-Pensieve/obsidian-custom-icons/blob/master/README.md)

# 自定义图标

通过为文档和文件夹设置可自定义的图标，增强您的工作空间美观及易用性。

![GitHub Socialify](https://socialify.git.ci/Raven-Pensieve/obsidian-custom-icons/image?description=1&font=Rokkitt&forks=1&issues=1&language=1&name=1&owner=1&pattern=Floating+Cogs&pulls=1&stargazers=1&theme=Auto)

## v1.0 重要公告：重制版与破坏性更新

本插件 **v1.0** 版本引入了**破坏性更新**，对插件进行了全面**重制**。

- **适配 Obsidian 1.11**：针对 Obsidian 1.11 版本新增的“设置页图标”功能，本插件现在支持**自定义设置页图标**。
- **未来规划**：1.0 版本之前的旧功能（依赖 CSS 实现的部分）计划在未来版本中通过新方法实现，并将不再支持通过 CSS 方式进行自定义。

请务必留意以避免配置失效，建议查看最新的使用文档。

## 使用

![Usage](docs/Usage.ZH.png)


## 安装方法
### 社区插件市场安装

[点击安装](obsidian://show-plugin?id=custom-sidebar-icons)，或按以下步骤操作：

1. 打开 Obsidian 并前往 `设置 > 第三方插件`。
2. 搜索 “Custom Icons”。
3. 点击 “安装”。

### BRAT（推荐给测试用户）

1. 安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件
2. 在 BRAT 设置中点击“添加测试插件”
3. 输入 `Raven-Pensieve/obsidian-custom-icons`
4. 启用插件

## 常见问题

### 其他插件能使用我的自定义 SVG 图标吗？

可以。图标库中的图标会以 `CI-<图标ID>` 的形式注册为**普通的 Obsidian 全局图标**，任何插件都可以通过 `setIcon(el, "CI-my-icon")` 使用；**新增 SVG 即时生效，无需重载 Obsidian**。

### 其他插件里我的图标显示空白？

Obsidian 的 `setIcon` 是一次性渲染：若该插件在「自定义图标」加载**之前**就已渲染该图标（插件加载顺序因人而异），该位置会空白。请依次尝试：

1. 执行命令 **「自定义图标：重新应用所有图标」**（刷新本插件管理的界面图标）；
2. 重新打开对应界面 / 面板；
3. 开启 **设置 → 实验性 →「始终最先加载本插件」** 并重启（见下文，根治方案）；
4. 重载该插件，或重启 Obsidian。

**进阶：让本插件始终最先加载。** 社区插件按 `.obsidian/community-plugins.json` 中的**数组顺序**依次加载。把 `"custom-sidebar-icons"` 移到数组最前面并重启 Obsidian，本插件会先于其他插件完成图标注册，可彻底避免 Ribbon 图标等启动期一次成型的界面出现空白。也可在 **本插件设置 → 实验性** 中开启 **「始终最先加载本插件」**——每次本插件加载时自动修正数组顺序（仅调整顺序、不增删条目，下次启动生效；实验性）。注意：手动调整顺序时勿删条目；新装/启用插件后该数组可能被重写；Ribbon 按钮也可在本插件设置 → Ribbon 侧边栏 中直接分配图标。

## 许可证

此项目基于 xxx LICENSE 许可 - 详情请参阅 [LICENSE](LICENSE) 文件。

## Star 历史

[![Star 历史图表](https://api.star-history.com/svg?repos=Raven-Pensieve/obsidian-custom-icons&type=Timeline)](https://www.star-history.com/#Raven-Pensieve/obsidian-custom-icons&Timeline)