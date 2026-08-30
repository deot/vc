# @deot/vc

`@deot/vc` 是 Vue 3 组件库的聚合入口，统一导出组件、Hooks、语言包和共享工具。

## 安装

```bash
pnpm add @deot/vc vue
```

## 使用

```ts
import { Button, createVcPlugin } from '@deot/vc';
```

可以直接按需导入组件，也可以通过 `createVcPlugin()` 注册全部组件：

```ts
import { createApp } from 'vue';
import { createVcPlugin } from '@deot/vc';
import App from './App.vue';

createApp(App)
	.use(createVcPlugin())
	.mount('#app');
```

需要更细粒度的依赖边界时，可分别使用 `@deot/vc-components`、`@deot/vc-hooks`、`@deot/vc-locale` 和 `@deot/vc-shared`。
