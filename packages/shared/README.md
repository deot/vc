# @deot/vc-shared

`@deot/vc-shared` 存放组件、Hooks 与聚合入口之间共享的轻量能力，不依赖 Vue。

## 安装

```bash
pnpm add @deot/vc-shared
```

## 导出

- `IS_SERVER`：判断当前是否为服务端环境。
- `Utils`：组件库内部复用的工具集合。

这些能力主要服务于组件库内部；应用侧通常从 `@deot/vc` 使用公开导出。
