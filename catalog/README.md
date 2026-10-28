# 场景风格库

本 fork 在品牌规范集合上增加本地分类页、规范阅读器和原创应用演示。保留原有 84 份规范；首个场景是记账，首套原创风格是 Clear Ledger／清账。

## 本地运行

在仓库根目录运行：

```sh
node scripts/serve.mjs
```

打开 http://127.0.0.1:8765/catalog/ 。无需 npm 安装、外部字体、图标 CDN 或付费 API。需要 HTTP，不支持直接双击 HTML 的完整交互。

## 功能与范围

- 分类与来源筛选，覆盖全部分类的关键词搜索，URL 保留分类和关键词。
- 原创风格包含应用演示、组件预览、规范阅读和原文下载。
- 84 个品牌条目可以本站阅读；外部预览保留 getdesign.md 链接。色块是规范配色示意，不是网站截图。
- Markdown 阅读器安全转义原文，支持常用标题、表格、列表、代码、链接、引用；不声称实现完整 CommonMark。
- 清账包含总览、账单、记一笔、统计，支持新增、查看详情、确认删除、预算调整、搜索与月份切换。
- 所有账本记录为虚构数据，以整数分存储在浏览器 localStorage，初始月份为 2026 年 10 月。头像／关于菜单可以重置。
- 不包含登录、后端存储、真实账户余额、转账、退款、云同步、备份或正式财务控制。

## 更新与验证

```sh
node scripts/build-catalog.mjs
node scripts/check.mjs
```

生成脚本从原 README 分类和实际 design-md 目录生成 styles.json。Slack 原文存在，但上游 README 漏列，因此含一条补充映射；未映射条目会报错，避免遗漏。

新增原创条目提供 README.md、DESIGN.md、preview.html、demo.html、实际演示封面，再在生成脚本注册元数据。条目增多时再抽离注册表。

校验脚本覆盖金额、日期、聚合一致性、目录完整性和本地 HTML 静态链接。浏览器交互、焦点和响应式仍需实际检查。

## 静态发布

可托管整个仓库，根 index.html 跳转到 catalog/index.html；只发布 catalog 会缺少 design-md 资源。可选 GitHub Pages 等静态托管。本次实现不自动启用远程 Pages，不修改 getdesign.md。

## 来源

参考原项目 Wise、Linear、Revolut 的规范组织深度，包括结构化 token、颜色角色、字级、状态、响应式和使用提示。清账是原创场景风格，没有使用其标志、图片或专有字体。保留原有规范及仓库 MIT 许可。
