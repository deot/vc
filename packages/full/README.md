# @deot/vc-full

`@deot/vc-full` 是 `@deot/vc` 的全量注册包：在导出 `@deot/vc` 全部内容的基础上，提供注册全部组件的 `createVcPlugin()` 和组件集合 `Components`。

`createVcPlugin()` 会引用入口内的全部组件，因此该包**不会被 tree-shaking**。需要按需引入时请使用 [`@deot/vc`](../index/README.md) 与 `defineVcPlugin()`。

## 安装

```bash
pnpm add @deot/vc-full vue
```

## 使用

```ts
import { createApp } from 'vue';
import { createVcPlugin, zhCN } from '@deot/vc-full';
import '@deot/vc-components/style.css';
import App from './App.vue';

createApp(App)
	.use(createVcPlugin({ locale: zhCN }, name => `V${name}`))
	.mount('#app');
```

## 入口

| 入口 | 注册的组件 |
| --- | --- |
| `@deot/vc-full` | 桌面端与移动端组件 |
| `@deot/vc-full/m` | 仅移动端组件（如 `MButton`） |
| `@deot/vc-full/desktop` | 仅桌面端组件（如 `Button`） |

三个入口导出的 API 相同，区别只在 `Components` 与 `createVcPlugin()` 注册的组件范围；按端入口只减少 JS 体积，样式仍使用完整的 `@deot/vc-components/style.css`。

```ts
import { createVcPlugin } from '@deot/vc-full/m';
```

## API

| 名称 | 说明 | 类型 |
| --- | --- | --- |
| createVcPlugin | 创建注册当前入口全部组件的 Vue 插件；同时调用 `VcInstance.configure(options)` 并挂载 `$vc`，组件名转换函数返回空值时保留原名 | `(options?: VcOptions, transfromComponentKey?: (name: string) => string) => { install: (app: App) => void }` |
| Components | 当前入口注册的组件集合 | `Record<string, Component>` |
