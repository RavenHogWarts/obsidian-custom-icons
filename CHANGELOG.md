## [2.2.0](https://github.com/Raven-Pensieve/obsidian-custom-icons/compare/2.1.0...2.2.0) (2026-08-18)


### ✨ 新增功能 (Features)

* 保证插件第一个加载 ([5344cc9](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/5344cc9b4774eca65b8ed93f0ea67dd37a5a720c))
* 新增 Ribbon 图标处理器 ([6eb6bb2](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/6eb6bb25d107d4996df9990bae221af8b0547928))


### 🐛 问题修复 (Bug Fixes)

* 修复 CustomIconLib 启动显示问题 ([a6c4c1c](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/a6c4c1c6849bbaa0957391f451364c8593db8e6d))


### ♻️ 重构 (Refactor)

* 移除合作协议 ([85373ef](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/85373ef93f94a6456239d36d75cb60feff0fe8cb))


### 📝 文档 (Documentation)

* 更新相关文档 ([a3212cf](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/a3212cf46abfa1099bc361a5c3e26241a76b41d0))

## [2.8.1](https://github.com/Raven-Pensieve/obsidian-custom-icons/compare/2.8.0...2.8.1) (2026-09-06)


### ⚡ 性能优化 (Performance)

* 优化虚拟网格首次加载 ([7a74c1e](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/7a74c1e5d94a0647948c1e4d7373b042801c5925))


### 📝 文档 (Documentation)

* 更新相关文档表述 ([f29f4a6](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/f29f4a6be4a38245b55985c6af7a17f7c2918510))

## [2.8.0](https://github.com/Raven-Pensieve/obsidian-custom-icons/compare/2.7.0...2.8.0) (2026-08-27)


### ✨ 新增功能 (Features)

* 导出跨插件 API 与图标变更事件，供正文内联图标插件消费 ([1736f58](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/1736f580f3904812d65e56fd49676c92fb43c9e0))


### 🐛 问题修复 (Bug Fixes)

* 图标包停用后引用失效的项回落到下一级，不再残留旧图标或留白 ([0bd0803](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/0bd0803274d3042ff66fc6165a256b380920ec30))

## [2.7.0](https://github.com/Raven-Pensieve/obsidian-custom-icons/compare/2.6.0...2.7.0) (2026-08-26)


### ✨ 新增功能 (Features)

* SVG 分组支持重命名与删除 ([4e0fd33](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/4e0fd33ff241d9504d7c00ad8e70231930cdb02b))
* 分组可折叠，筛选与批量动作移到原生分组标题区 ([e99593d](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/e99593df6c3f8c37ea74f6fb2b95c3f269a045cb))
* 图标包页搜索联动、行内进度与取消、目录筛选排序与 a11y 清账 ([f2c9197](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/f2c9197ec1bb35d43ce7decc1304fd64a2d8fb83))
* 图标库新增全部页统一搜索、卡片右键菜单、收藏置顶与密度切换 ([4911337](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/4911337fd67a7171a5ac0919ce1d641fbe23b0b2))
* 图标库消除静默失败，补齐表单校验、SVG 预览与空态引导 ([d4c012e](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/d4c012e3375f51d5f4082d86b3cc222a468a2087))
* 图标库视图偏好持久化，并补齐复核发现的遗留缺口 ([f8caf56](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/f8caf560bb75ebaee429ba8d12f10feb09387aed))
* 图标选择器重做为分组网格，新增收藏与最近使用 ([33e8bf7](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/33e8bf787961a972a8d69294f4fe95f056f35217))
* 我的 SVG 页支持多选批量、JSON 导入导出、拖放与最近添加排序 ([49b15a6](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/49b15a60df90c522d45b313c23ddca1ab9657ea2))
* 扩展名支持分组统一配图标，并补齐筛选排序与批量动作 ([4b2c79b](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/4b2c79b53d355d6aaa17fa4828384d50f9bfa8bc))
* 横向条溢出提示与激活项自动对位 ([0023dd2](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/0023dd29062a0f23436c0f2b077052ab081d43fd))
* 自定义 SVG 支持分组管理 ([271f043](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/271f043097388def00cf8c8a2e779ad9813b8b7f))
* 随机图标按当前来源随机，并通用化到全部处理器 ([2c313aa](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/2c313aa52c58d48a22d819d7d7e4f8b53cf17ed9))


### 🐛 问题修复 (Bug Fixes)

* 分组改名删除后筛选落盘同步，并补齐弹窗窗口归属与菜单文案 ([1a5f813](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/1a5f81316e1b04d0d2d489e63fc77a116e0a3246))
* 分组标题槽位懒建一次，避免整组跳到后面的分组下面 ([dae2873](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/dae28731922721cf71e0bfad3097136ad7270d01))
* 图标选择器点分段不再夺走焦点，并补齐输入法与空分组的键位边界 ([f1ba671](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/f1ba671076448f2f92f1ecfb87bee535d2d83a29))
* 图标重命名后缀从 -1 起编号 ([27b6f0e](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/27b6f0eff0d01188b086e66a7ac410f387a42f7b))
* 收藏与最近使用过滤失效图标，并在删除改名时同步清理 ([f99c056](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/f99c056e61f234aa1a35466ff3db88681c4db336))
* 设置页禁用态与静默失败，修掉按钮监听器累积的根因 ([77b6dc0](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/77b6dc02cfb92b7d6b69d41ce7a94374aa7e8f7a))
* 骰子按钮监听器累积、随机池含未注册图标、默认图标写两次盘 ([447fe15](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/447fe15e020f72b9e4e576bd4911d2c2996d7b25))


### ♻️ 重构 (Refactor)

* 统一「重置/删除」语义，写入路径深拷贝从 6 趟降到 1 趟 ([5ed8634](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/5ed863426093a863e1b532835f0532370d40bdea))

## [2.6.0](https://github.com/Raven-Pensieve/obsidian-custom-icons/compare/2.5.1...2.6.0) (2026-08-24)


### ✨ 新增功能 (Features)

* 初步实现 bookmarks icon 处理 ([9ccb66f](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/9ccb66fb70841acf7f9a071372daa4f5f7c5f3c7))
* 实现 bookmarks 右键菜单 ([abbd73b](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/abbd73bc8f5988c9bfd8fcbf459745769ca04b91))

## [2.5.1](https://github.com/Raven-Pensieve/obsidian-custom-icons/compare/2.5.0...2.5.1) (2026-08-24)


### 🐛 问题修复 (Bug Fixes)

* file-explorer 首次展开不渲染，关闭功能仍残留图标 ([6dea6b4](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/6dea6b4a993d56326fd2273a32a7be09cdcbdcd7))


### 📝 文档 (Documentation)

* 更新 README 文档 ([a07718b](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/a07718b03350910385c94dc1911c388c5b413f77))

## [2.5.0](https://github.com/Raven-Pensieve/obsidian-custom-icons/compare/2.4.0...2.5.0) (2026-08-21)


### ✨ 新增功能 (Features)

* 修改 TabHeaderIconHandler 解析优先级 ([1f96ab6](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/1f96ab6c2a8549cd09dbd568371a0c0e7831b31f))
* 新增 标签页 图标替换 ([b72751a](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/b72751a8da7bbd18bb8e86aece8990ae5b0ca243))


### 🐛 问题修复 (Bug Fixes)

* FileExplorerIconHandler 只在 file-explorer-context-menu 来源时加菜单项 ([2075ae3](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/2075ae3ca184c68522e32f352efb3573336d5066))
* 更新 tabHeader 逻辑 ([6d08552](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/6d0855216c7b82e21297830f3417944569a35b1a))


### ♻️ 重构 (Refactor)

* 优化翻译文本 ([aed31df](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/aed31df49694ac0e9b9fae69aa0a27dec4efe148))
* 更新 i18n 文本说明 ([26468ad](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/26468ad373b9f6be4a4e90478b414bbc18cde95b))
* 替换侧边栏图标库图标为 book-image ([e8bd225](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/e8bd2257cb4e4343e01223a1f7f7a0ce651bcd94))

## [2.4.0](https://github.com/Raven-Pensieve/obsidian-custom-icons/compare/2.3.0...2.4.0) (2026-08-20)


### ✨ 新增功能 (Features)

* 为图标库增加重新下载功能 ([d8f3f40](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/d8f3f406bdc08ef58fb951efdb362443fc701119))
* 初步实现对于文件浏览器图标的替换管理 ([497edd0](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/497edd0bedd73a715e00286209ab122ac4fc0cfd))
* 增加 子文件夹 / 子文件 图标自动继承父文件夹图标 功能 ([fec4f21](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/fec4f21c847d284065eec12afe3280c808411677))


### 🐛 问题修复 (Bug Fixes)

* 修正完整i18n文本 ([23ac9c9](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/23ac9c9813da821e81dbc1bd8707fa4f4dfbc7aa))

## [2.3.0](https://github.com/Raven-Pensieve/obsidian-custom-icons/compare/2.2.0...2.3.0) (2026-08-20)


### ✨ 新增功能 (Features)

* 增加 lucide 库，对比与obsidian原生lucide 的差异 ([3cadaa3](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/3cadaa36095b129d934f20d486432f391063894d))
* 增加图标包的预览 ([f39850f](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/f39850ffd9472447ff08687ec22e7bf279abab35))
* 实现第三方图标库的导入 ([a7a6327](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/a7a632755259924b60d892340a14d56536b91a43))


### 🐛 问题修复 (Bug Fixes)

* 修复1.13弹窗打开位置 ([cb07e97](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/cb07e97accb63665fc245b14564744a9b765461f))
* 修复modal打开位置 ([a9d92d8](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/a9d92d854b59bb8fda97d2798ae76c27bbe15bfe))


### ⚡ 性能优化 (Performance)

* 优化显示，lucide增加筛选 ([9110aa6](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/9110aa660b5259668055ac9c7952176563041153))
* 使用 @tanstack/react-virtual 优化虚拟加载 ([a459ed3](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/a459ed3da5a73796b5f3d1953bf4e5e6ce258bcd))
* 修复 lint error ([b74c37d](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/b74c37d5a669932efc876aa5ebba7f4f88dbbb80))

## [2.1.0](https://github.com/Raven-Pensieve/obsidian-custom-icons/compare/2.0.5...2.1.0) (2026-06-28)


### Bug Fixes

* 修改SVG解析逻辑 ([32fa1cb](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/32fa1cbeae53420637146d529b1e5b2c7db70c36))


### Features

* 为设置搜索页的插件设置项补充图标 ([168be40](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/168be40f2daa86e0ec291e721229648ec1facce6))

## [2.0.5](https://github.com/Raven-Pensieve/obsidian-custom-icons/compare/2.0.4...2.0.5) (2026-05-20)


### 🐛 Bug Fixes

* 修复自动审查错误 (#81) ([5f679e2](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/5f679e26fa3311a9e77114f7c300ecae47f7aecc)), closes [#81](https://github.com/Raven-Pensieve/obsidian-custom-icons/issues/81)
## [2.0.2](https://github.com/Raven-Pensieve/obsidian-custom-icons/compare/2.0.1...2.0.2) (2026-01-29)


### 🐛 Bug Fixes

* 优化社区插件图标处理逻辑 (#68) ([63a133d](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/63a133da138bd4f7383c03b8a8ae347c8efe3a12)), closes [#68](https://github.com/Raven-Pensieve/obsidian-custom-icons/issues/68)


### 🔨 Chore

* 升级依赖并重组构建配置 (#69) ([68e44d4](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/68e44d429902daccded3b653dc8f28a8e4ac9c3d)), closes [#69](https://github.com/Raven-Pensieve/obsidian-custom-icons/issues/69)
* **lint:** 重构 ESLint 配置并优化规则设置 (#70) ([5a81574](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/5a81574e1cf279becf1cbdb6d50f69bd5c10d6f2)), closes [#70](https://github.com/Raven-Pensieve/obsidian-custom-icons/issues/70)



## [2.0.1](https://github.com/Raven-Pensieve/obsidian-custom-icons/compare/2.0.0...2.0.1) (2026-01-27)


### ✨ Features

* 为社区插件图标添加容器类并修复样式 (#64) ([b0b3f12](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/b0b3f125e8dc765fe37914b97c2af1499267dcb6)), closes [#64](https://github.com/Raven-Pensieve/obsidian-custom-icons/issues/64)


### 🐛 Bug Fixes

* **settings:** 防止原型污染并改进属性检测 (#65) ([287605a](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/287605ae28f47714c31108d4a7430c2ba08a2f57)), closes [#65](https://github.com/Raven-Pensieve/obsidian-custom-icons/issues/65)


### 🔧 CI

* **pnpm:** 在 CI 中切换到 pnpm 并缓存 store (#66) ([936df61](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/936df61113c1d81f904539406c0aebdca35ec89f)), closes [#66](https://github.com/Raven-Pensieve/obsidian-custom-icons/issues/66)



# [2.0.0](https://github.com/Raven-Pensieve/obsidian-custom-icons/compare/1.1.1...2.0.0) (2026-01-25)


### 🔨 Chore

* 转移仓库所有权给 Raven-Pensieve ([05f7315](https://github.com/Raven-Pensieve/obsidian-custom-icons/commit/05f7315a695a4a61d6c2b6c01e08cfd82dd23232))



## [1.1.1](https://github.com/RavenHogWarts/obsidian-custom-icons/compare/1.1.0...1.1.1) (2026-01-20)


### 🐛 Bug Fixes

* 修复表单提交行为 ([2847ea0](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/2847ea0ddbb10e3e51e1725a995d00f3a0184830))



# [1.1.0](https://github.com/RavenHogWarts/obsidian-custom-icons/compare/1.0.0...1.1.0) (2026-01-19)


### ✨ Features

* 添加自定义图标库 (#53) ([727de78](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/727de78096f21bb478a63c3e598f1f1bfb70dd3a)), closes [#53](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/53)
* 优化自定义图标库样式与功能 (#59) ([0610c55](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/0610c554987aa911d6f3fd282b15aae944cd99bd)), closes [#59](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/59)


### 🔨 Chore

* 调整样式导入与代码格式化 (#58) ([c97dbf1](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/c97dbf1190fb88a10b17a63a963a5714af0cb224)), closes [#58](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/58)
* 注释未使用的资助平台 (#57) ([15f3b86](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/15f3b86da6d0c2e33ec105d6d7fb2bd05709f7c1)), closes [#57](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/57)
* lock 和升级部分依赖版本 (#54) ([009156f](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/009156fc4735052e390e49a875ae757b9005ad1a)), closes [#54](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/54)



# [1.0.0](https://github.com/RavenHogWarts/obsidian-custom-icons/compare/1.0.0-beta.4...1.0.0) (2026-01-15)


### ♻️ Refactor

* 将图标逻辑内联到处理器类 (#45) ([351ecc7](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/351ecc7f76b458ef966fc14d66db27e85165be63)), closes [#45](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/45)
* **icon:** 统一 SVG 图标的 class 名称 (#49) ([df71555](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/df71555a3825a575463cbaec3c30dfc611a13312)), closes [#49](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/49)


### ✨ Features

* 优化 Lucide 图标测试与去重提取 (#43) ([0b86533](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/0b865335ba9edb58df4963c43e2b19cc77de0d91)), closes [#43](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/43)
* 增加随机图标功能 (#50) ([80fb973](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/80fb973efbeea028e524191ca0e9a74f801dd732)), closes [#50](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/50)
* **i18n:** 初始化 typesafe-i18n 支持并修正脚本导入 (#47) ([79bc277](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/79bc277ba2abbd6111c169afabb6e52c0cb5af9e)), closes [#47](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/47)


### 📝 Documentation

* update README and CONTRIBUTING texts (#51) ([7c73455](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/7c73455964c0e3c66238cf29d4c3b456aa485445)), closes [#51](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/51)


### 🔨 Chore

* 修改 FUNDING (#48) ([b59bac5](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/b59bac5c9211c623b1919da2e56fe2a70b8db141)), closes [#48](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/48)
* remove conventional-changelog related deps (#44) ([5c577a9](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/5c577a9f3b0dab88533f3461b90850f1a6d48326)), closes [#44](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/44)



# [1.0.0-beta.4](https://github.com/RavenHogWarts/obsidian-custom-icons/compare/1.0.0-beta.3...1.0.0-beta.4) (2025-12-16)


### ♻️ Refactor

* 调整插件加载顺序和初始化逻辑 (#40) ([e1fe645](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/e1fe64519682e435967c23b27e01f456d7017f8c)), closes [#40](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/40)


### ✨ Features

* 避免重复渲染并缓存图标状态 (#41) ([9479aad](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/9479aad977eefc454d7a41cf4c06da6519af2441)), closes [#41](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/41)



# [1.0.0-beta.3](https://github.com/RavenHogWarts/obsidian-custom-icons/compare/1.0.0-beta.2...1.0.0-beta.3) (2025-12-16)


### ✨ Features

* 抽离默认图标设置到独立分组 (#33) ([ae9814b](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/ae9814bf6f0e1d463c8bc7925c0a949f3a0ac849)), closes [#33](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/33)
* 引入图标管理器与处理器架构 (#35) ([b9a19eb](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/b9a19eb9b4adea1b094e3b1bccc8d95c332e468c)), closes [#35](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/35)
* 增加搜索筛选 (#37) ([5d92a9e](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/5d92a9e6603798f2f85f349ade50a785668c57d3)), closes [#37](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/37)
* 支持 lucide-react 图标并改进渲染逻辑 (#38) ([ab1886b](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/ab1886bb3031fd505841ae70baf4bc80efb1dad6)), closes [#38](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/38)
* 重构 Obsidian Setting 的 react 组件 (#32) ([47a9d59](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/47a9d599badd01b7be8a4cc67ffefc81367e7e56)), closes [#32](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/32)
* **settings:** 添加社区外掛启用开关及异步设置更新 (#34) ([daa390a](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/daa390a83154fd3a4838a4b107a99bcace4bc31b)), closes [#34](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/34)


### 🐛 Bug Fixes

* **setting:** 移除 Obsidian 设置项的 DOM 元素 (#36) ([9e6428b](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/9e6428b5466c22acecad236397c43d1ed71d36e4)), closes [#36](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/36)


### 🔨 Chore

* **deps:** 升级若干依赖以修复漏洞和保持兼容 (#31) ([2870bde](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/2870bdea9aee1cacff2956b981c27a9231284163)), closes [#31](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/31)



# [1.0.0-beta.2](https://github.com/RavenHogWarts/obsidian-custom-icons/compare/1.0.0-beta.1...1.0.0-beta.2) (2025-12-11)


### 🐛 Bug Fixes

* 修复设置存储与图标更新的异步和路径处理 (#29) ([df4bcb9](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/df4bcb9483410c32212b15e1f971fbdf26980f7f)), closes [#29](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/29)



# [1.0.0-beta.1](https://github.com/RavenHogWarts/obsidian-custom-icons/compare/0.6.3...1.0.0-beta.1) (2025-12-11)


### ✨ Features

* 注释掉 manageLeaf 框架，便于后续实现 ([591e656](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/591e6566c1671e1a758987ed4c98305fab1ddc8a))


### 🐛 Bug Fixes

* BREAKING CHANGE (#25) ([663aad1](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/663aad1e5d097a51669f8d5ec36c8f881daf2a75)), closes [#25](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/25)


### 🔨 Chore

* Add manifest-beta.json for custom sidebar icons ([2151799](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/2151799f1e9ab86d64e48540e8dddc962f1f8aaf))
* **release:** 更新发布工作流并添加赞助信息 (#24) ([8162c2a](https://github.com/RavenHogWarts/obsidian-custom-icons/commit/8162c2a032fd294a13d022107996753f8800167d)), closes [#24](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/24)
