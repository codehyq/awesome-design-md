# Clear Ledger / 清账 · 清爽工具型

面向个人日常记账的原创移动端设计。白灰画布、单一蓝色主操作、对齐的数字和紧凑流水，适合快速记录、查账、预算和月度复盘。

- [应用交互演示](demo.html)：总览、账单、记一笔、统计。
- [组件预览](preview.html)：配色、字体、按钮、表单、流水、图表和异常状态。
- [阅读规范](spec.html) · [DESIGN.md 原文](DESIGN.md)。
- [返回分类页](../../catalog/index.html)。

从仓库根目录运行 `node scripts/serve.mjs`，访问 `http://127.0.0.1:8765/catalog/`。需要 HTTP 服务以加载模块和目录数据，不支持直接双击 HTML 文件的完整交互。

演示包含虚构账本，初始月份为 2026 年 10 月。数据仅保存在浏览器 localStorage，无后端、登录、云同步或备份。点击头像或演示页左侧的重置入口恢复示例。请勿输入真实敏感信息。

## 复用

把 DESIGN.md 放入自己的项目，并在 AGENTS.md 中注明规范路径。组件 CSS 的 token 位于 tokens.css；应用演示用 app.css、app.js 与 model.js 实现，均无运行时第三方依赖。

设计规范的组织方式参考本仓库 Wise、Linear、Revolut 条目。本条目是原创场景风格，不是上述品牌的官方设计系统；未引入品牌专有字体或素材。代码沿用仓库 MIT 许可。
