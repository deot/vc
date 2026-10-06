# @deot/vc

`@deot/vc` 是 Vue 3 组件库的聚合入口，统一导出组件、Hooks、语言包和共享工具，支持 `tree-shaking`。

## 安装

```bash
pnpm add @deot/vc vue
```

## 使用

按需导入组件：

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

需要一次注册全部组件时，使用 [`@deot/vc-full`](../full/README.md)。

需要更细粒度的依赖边界时，可分别使用 `@deot/vc-components`、`@deot/vc-hooks`、`@deot/vc-locale` 和 `@deot/vc-shared`。

## 迁移

`createVcPlugin` 与 `Components` 已移至 `@deot/vc-full`：

```diff
- import { createVcPlugin } from '@deot/vc';
+ import { createVcPlugin } from '@deot/vc-full';
```
