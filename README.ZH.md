中文 | [English](https://github.com/Raven-Pensieve/obsidian-custom-icons/blob/master/README.md)

# 自定义图标

为 Obsidian 工作区的各个界面提供自定义图标——文件与文件夹、标签页、书签、Ribbon 侧边栏、第三方插件设置——并内置一套图标库，接入 Iconify 全量目录。

![GitHub Socialify](https://socialify.git.ci/Raven-Pensieve/obsidian-custom-icons/image?description=1&font=Rokkitt&forks=1&issues=1&language=1&name=1&owner=1&pattern=Floating+Cogs&pulls=1&stargazers=1&theme=Auto)

## 图标定制范围

每个界面在 **设置 → 自定义图标** 下各占一个页签，各有独立开关。原生图标只是被隐藏而非删除，因此关掉某项功能即恢复 Obsidian 原本的样子。

| 界面 | 能做什么 |
| --- | --- |
| **文件浏览器** | 文件夹默认图标与文件兜底图标；按扩展名的规则（支持批量添加，复合后缀优先，如 `excalidraw.md` 优先于 `md`）；扩展名分组，附常用预设（图片、视频、音频、文档、压缩包、代码）；在文件树中右键单独设置；可选继承，让子文件夹与未匹配规则的文件沿用最近祖先文件夹的图标。重命名自动迁移，删除自动清理。 |
| **标签页** | 侧栏工具页与编辑器标签，含弹出窗口。两级解析：单标签覆盖优先，按视图类型的映射兜底。右键已激活的标签页即可设置或重置。 |
| **书签** | 覆盖全部六种书签类型（文件、文件夹、分组、搜索、关系图、URL）。单项覆盖优先于按类型的默认；单项以稳定 id 为键，重命名或移动书签不会丢图标。 |
| **Ribbon 侧边栏** | 自定义左侧 Ribbon 按钮图标（按提示文本识别），可随时恢复原始图标。 |
| **第三方插件** | 为没有图标的插件补上图标（修复 Obsidian 1.11+ 的问题）：统一默认图标、单个或全部随机、在设置搜索结果中显示图标（需 Obsidian 1.13+）。 |

每处图标都可同时设置颜色；批量操作（随机、清空）只作用于当前筛选出的条目。

## 自定义图标库

通过 Ribbon 按钮或命令 **「打开自定义图标库」** 打开。

- **图标包** —— 从内置 [Iconify](https://iconify.design) 目录（220+ 图标集）一键安装整套图标，或从任意以散装 SVG 发布的 npm 包导入（支持路径 glob，附常用包预设）。安装前可预览；支持启用/停用、重新下载、卸载。图标存在插件目录下，装好后完全离线可用。
- **我的 SVG** —— 粘贴 SVG 源码或批量上传 `.svg` 文件（文件名即图标 ID）。支持分组、排序、多选，并可将图标库导出/导入为 JSON，在不同仓库间迁移。
- **Lucide** —— 浏览插件内置的全部 Lucide 图标，可筛选出 Obsidian 原生未包含的那批。
- **全部** —— 一次检索 Lucide、你的 SVG 与所有已安装图标包，结果按来源分组。

收藏、最近使用与网格密度会被记住，并与插件各处共用的图标选择器共享。

图标库中的图标以 `CI-<图标ID>` 注册为普通的 Obsidian 全局图标，即时生效无需重载，任何插件都可以使用。

## 使用

![Usage](docs/Usage.ZH.png)

图标在两处配置：上述设置页签，以及就地设置——右键文件、文件夹、书签或已激活的标签页。若显示异常，在命令面板执行 **「重新应用所有图标」**，重新注册并重应用全部图标。

### 实验性功能

**始终最先加载本插件** 会把本插件保持在社区插件加载顺序最前，使其他插件不会在图标注册前就渲染完成。仅调整顺序、不增删条目，下次启动生效。

## 安装方法

### 社区插件市场

[点击安装](obsidian://show-plugin?id=custom-sidebar-icons)，或打开 `设置 → 第三方插件`，搜索 “Custom Icons” 并安装。

### BRAT（测试版本）

1. 安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat) 插件
2. 在 BRAT 设置中点击「添加测试插件」
3. 输入 `Raven-Pensieve/obsidian-custom-icons`

## 给插件开发者

本插件在插件实例上暴露了一套跨插件 API（契约 v1）。把 [`docs/custom-icons-api.d.ts`](docs/custom-icons-api.d.ts) 复制进你自己的仓库即可——刻意不发 npm 包：零构建耦合，运行期本来就靠 `version` 守卫。

```ts
const provider = app.plugins.getPlugin("custom-sidebar-icons")?.api;
if (provider?.version === 1) {
    provider.renderTo(el, "CI-mdi-home");   // 唯一能画出 Lucide 差集的入口
    provider.describe("CI-mdi-home");       // 来源、短名、所属包
    provider.catalog();                     // 全部候选，按来源分段
    provider.openPicker({ onPick });        // 复用本插件的图标选择器
}

// 必接：图标集合会在插件集不变的情况下发生变化
this.registerEvent(
    this.app.workspace.on("custom-icons:changed", () => this.invalidate()),
);
```

不要缓存 API 引用（提供方可能被禁用后重新启用），也不要自己切分 `CI-<packId>-<name>`——两段都可能含连字符，请用 `describe()`。

[Inline Icons](https://github.com/Raven-Pensieve/obsidian-inline-icons) 是一个参考消费方：它借这套注册表把图标渲染进笔记正文。

## 常见问题

### 其他插件里我的图标显示空白

Obsidian 的 `setIcon` 是一次性渲染。若该插件在「自定义图标」加载**之前**就已渲染该图标，那个位置会留白。请依次尝试：

1. 执行命令 **「重新应用所有图标」**；
2. 重新打开对应界面；
3. 开启 **设置 → 实验性 →「始终最先加载本插件」** 并重启——这是根治方案，因为社区插件按 `.obsidian/community-plugins.json` 中的数组顺序加载；
4. 重载该插件，或重启 Obsidian。

### 从 0.x 升级

v1.0 为破坏性重制，此后 1.0 之前的经典功能均已通过原生方式重新实现，插件不再生成 CSS 片段。旧的 CSS 配置方式——包括自动生成的 `CustomIcon-AutoGen` 片段——不再使用、也不会迁移。请从仓库中删除该片段，并在设置页中重新配置图标。

## 许可证

GPL-3.0 —— 详见 [LICENSE](LICENSE)。

## Star 历史

[![Star 历史图表](https://api.star-history.com/svg?repos=Raven-Pensieve/obsidian-custom-icons&type=Timeline)](https://www.star-history.com/#Raven-Pensieve/obsidian-custom-icons&Timeline)

## 鸣谢

- [obsidian-metadata-icon](https://github.com/Benature/obsidian-metadata-icon)
- [Templater](https://github.com/SilentVoid13/Templater)
