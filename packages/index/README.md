# @deot/vc

`@deot/vc` 是 Vue 3 组件库的聚合入口，统一导出组件、Hooks、语言包和共享工具。

## 安装

```bash
pnpm add @deot/vc vue
```

## 入口

| 入口 | 说明 | tree-shaking |
| --- | --- | --- |
| `@deot/vc` | 导出组件、Hooks、语言包和共享工具 | 支持 |
| `@deot/vc/full` | 在 `@deot/vc` 的基础上提供注册桌面端与移动端全部组件的 `createVcPlugin()` | 不支持 |
| `@deot/vc/desktop` | 同上，仅注册桌面端组件（如 `Button`） | 不支持 |
| `@deot/vc/mobile` | 同上，仅注册移动端组件（如 `MButton`） | 不支持 |

样式统一引入 `@deot/vc-components/style.css`；按端入口只减少 JS 体积，样式仍为完整样式。

## 按需使用

```ts
import { Button } from '@deot/vc';
```

需要通过插件注册组件时，使用 `defineVcPlugin()` 自行挑选组件，未挑选的组件不会进入产物：

```ts
import { createApp } from 'vue';
import { defineVcPlugin, Button, MButton, zhCN } from '@deot/vc';
import App from './App.vue';

const createVcPlugin = defineVcPlugin({ Button, MButton });

createApp(App)
	.use(createVcPlugin({ locale: zhCN }))
	.mount('#app');
```

## 全量注册

`createVcPlugin()` 会引用入口内的全部组件，因此这些入口不会被 tree-shaking。

```ts
import { createApp } from 'vue';
import { createVcPlugin, zhCN } from '@deot/vc/full'; // 或 '@deot/vc/desktop'、'@deot/vc/mobile'
import App from './App.vue';

createApp(App)
	.use(createVcPlugin({ locale: zhCN }, name => `V${name}`))
	.mount('#app');
```

| 名称 | 说明 | 类型 |
| --- | --- | --- |
| createVcPlugin | 创建注册当前入口全部组件的 Vue 插件；同时调用 `VcInstance.configure(options)` 并挂载 `$vc`，组件名转换函数返回空值时保留原名 | `(options?: VcOptions, transfromComponentKey?: (name: string) => string) => { install: (app: App) => void }` |
| Components | 当前入口注册的组件集合 | `Record<string, Component>` |

需要更细粒度的依赖边界时，可分别使用 `@deot/vc-components`、`@deot/vc-hooks`、`@deot/vc-locale` 和 `@deot/vc-shared`。

## 迁移

`createVcPlugin` 与 `Components` 已从主入口移至 `@deot/vc/full`：

```diff
- import { createVcPlugin } from '@deot/vc';
+ import { createVcPlugin } from '@deot/vc/full';
```
