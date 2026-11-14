# @deot/vc-hooks

`@deot/vc-hooks` 提供组件库内部和应用侧可复用的 Vue 组合式工具。

## 安装

```bash
pnpm add @deot/vc-hooks vue
```

## 导出

- `getInstance`
- `useAttrs`
- `useDrag`
- `useGesture`
- `useKeyboard`
- `useRem`：750 稿上 1 个单位当前的 px（即 `--vc-rem` 的计算值），全局共享的只读 `ref`，随视口、封顶宽度与业务注入的 `--rem` 变化；用于在 JS 里把 750 稿长度算成 px。依赖 `@deot/helper`（可选的 peer 依赖），需要组件库的样式已加载
- `useScrollbar`：打开浮层时锁定页面滚动（`body` 的 `overflow`）
- `useScrollContain`：浮层内触摸滚动不外溢（滚动区域照常滚动，滚到边界或在遮罩上拖动时页面不随之滚动），调用方可接管手势（`claim`）实现滑动关闭等；接管时也响应鼠标拖动（桌面端）

这些能力也会从聚合包 `@deot/vc` 重新导出。
