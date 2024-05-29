# Changelog
## Version 0.6.3 (2024-05-29)
- [feature] 设置的lucide图标可以自适应当前基础颜色 [#5](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/5) [#13](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/13)
- [fix] bug: "Faild to unload plugin custom-sidebar-icons"

## Version 0.6.2 (2024-05-14)
- [feature] 支持显示内部链接的文件图标 [#12](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/12)
- [changed] 插件设置界面UI修改
- [updated] pin在侧边的文件如果锁定,锁定的图标会被隐藏

## Version 0.6.1 (2024-05-06)
- [updated] 文件图标修改功能可同时为多个后缀设置相同图标 [#9](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/9)
- [changed] 修改插件设置about页面

## Version 0.6.0 (2024-05-04)
- [changed] 正式修改插件名称为"Custom Icons"
- [feature] 增加修改文件图标功能 [#7](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/7)
- [changed] 修改插件设置界面

## Version 0.5.0 (2024-05-03)
- [feature] 增加修改文件夹图标功能
- [changed] 修改数据结构,数据自动从customIcons迁移至SidebarIcons
- [changed] 修改插件设置界面

## Version 0.4.0 (2024-04-20)
- [feature] 支持lucide源图标 [#2](https://github.com/RavenHogWarts/obsidian-custom-icons/issues/2)

### 0.4.0.1 (2024-04-21)
- [fix] 设置界面补丁

## Version 0.3.3 (2024-04-18)
### 0.3.3.2
- [updated] 增加数据迁移功能,确保用户之前的数据能够使用

### 0.3.3.1
- [changed] customIcons增加type类型, CustomIconSettingTab增加Dropdown类型选择
- [fix] bug: 图标后面会叠加图片

## Version 0.3.2 (2024-04-10)
- [changed] 依据官方要求优化代码
- [fix] bug: Windows无法使用绝对路径添加图标

## Version 0.3.1 (2024-04-04)
- [changed] 优化代码结构,样式修改至styles.css

## Version 0.3.0 (2024-04-02)
- [feature] 支持多种图像格式,包括在线URL,本地图像,base64编码和svg标签
- [changed] 数据结构发生变化,需要重新配置插件
- [fix] bug: 在删除多个图标时会导致错误删除对象

## Version 0.2.1 (2024-03-27)
- [updated] 支持显示彩色svg图标

## Version 0.2.0 (2024-03-26)
- [updated] 新增了svg图标预览功能

## Version 0.1.0 (2024-03-25)
- [feature] 基础功能:修改侧边栏图标