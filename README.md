# Custom Sidebar Icons
自定义固定在Obsidian侧边栏的文件的图标。

这款插件让你可以为Obsidian侧边栏中的固定文件自定义图标，使你的工作空间更个性化，也更易于导航。

## 支持

如果你觉得这个插件对你有用，并且想支持它的发展，你可以通过以下方式赞助我：微信，支付宝或[爱发电](https://afdian.net/a/ravenhogwarts)。任何金额都是受欢迎的，谢谢你！

<p align="center">
<img src="https://s2.loli.net/2024/04/02/wKRoN72myJ6tnr5.png" width="500px">
</p>

## 安装

### 通过 [BRAT 插件](https://obsidian.md/plugins?id=obsidian42-brat) 安装

- 首先安装 [BRAT 插件](https://obsidian.md/plugins?id=obsidian42-brat)：
- 在BRAT插件中，点击 `Add Beta plugin`
- 输入 https://github.com/RavenHogWarts/obsidian-custom-sidebar-icons
- 在 `第三方插件` 中启用 `Custom Sidebar Icons`

### 手动安装

- 在 [发布页面](https://github.com/RavenHogWarts/obsidian-custom-sidebar-icons/releases/latest)下载最新版本
- 复制 `main.js`，`manifest.json` 到你的库 `VaultFolder/.obsidian/plugins/custom-sidebar-icons/`
- 重新加载插件，在 `第三方插件` 中启用 `Custom Sidebar Icons`

## 如何构建

- `git clone https://github.com/RavenHogWarts/obsidian-custom-sidebar-icons` 克隆这个仓库。
- `npm i`  安装依赖。
- `npm run dev` 开启实时编译。
- `npm run build` 构建生产版本。