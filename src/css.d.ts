// 消除 tsc 产型阶段对 css 副作用导入的 TS2882（typescript 6.0.3 实测会报错，见 docs/工程骨架决策.md 留档⑧）。
// 选择独立 shim 而非引入 vite/client：构建期类型面更纯净，不连带整套 vite 模块声明。
declare module "*.css";
