# @deot/vc-locale

`@deot/vc-locale` 提供 `@deot/vc` 使用的语言类型和语言数据。子包本身不依赖 Vue，也不包含响应式状态、Translator、Hook 或 Provider。

组件侧的翻译和响应式处理由 `@deot/vc-components` 提供，并通过 `@deot/vc` 聚合导出。

## 安装

```bash
pnpm add @deot/vc @deot/vc-locale vue
```

如果只需要语言类型或语言数据，可以单独安装：

```bash
pnpm add @deot/vc-locale
```

## 内置语言

当前导出 `zhCN` 和 `enUS`：

```ts
import { enUS, zhCN } from '@deot/vc-locale';

zhCN.name; // zh-CN
enUS.name; // en-US
```

语言文件使用具名 ESM 导出，包声明为无副作用。使用支持 tree-shaking 的 ESM 构建工具时，可以只保留实际导入的语言：

```ts
import { zhCN } from '@deot/vc-locale';
```

## 配置 VcInstance

全局语言通过 `VcInstance.configure()` 配置：

```ts
import { VcInstance } from '@deot/vc';
import { enUS } from '@deot/vc-locale';

VcInstance.configure({
	locale: enUS
});
```

未配置时默认使用 `zhCN`。不传 `locale` 或传入 `locale: undefined` 时，会保留当前语言。

聚合入口也导出了内置语言，因此可以简写为：

```ts
import { enUS, VcInstance } from '@deot/vc';

VcInstance.configure({
	locale: enUS
});
```

## 在组件中使用 useLocale

`useLocale` 不属于纯 `@deot/vc-locale` 子包，它由 `@deot/vc-components` 提供。业务组件可以从聚合包导入：

```tsx
import { defineComponent } from 'vue';
import { useLocale } from '@deot/vc';

export default defineComponent({
	setup() {
		const { locale, lang, t } = useLocale();

		return () => (
			<div lang={lang.value}>
				{t('vc.component.title')}
				<span>{locale.value.name}</span>
			</div>
		);
	}
});
```

仓库内的 `packages/components` 不能反向导入聚合包，应从组件侧 Locale 适配层使用相对路径：

```text
import { defineComponent } from 'vue';
import { useLocale } from '../locale';

export default defineComponent({
	setup() {
		const { t } = useLocale();

		return () => (
			<div>{t('vc.component.title')}</div>
		);
	}
});
```

以上 `vc.component.*` 仅用于说明调用方式，不代表内置语言包已经提供对应组件文案。

## 插值

Translator 支持 `{name}` 形式的插值：

```tsx
const { t } = useLocale();

t('vc.component.summary', {
	count: 10
});
```

语言数据的伪代码如下：

```ts
const locale = {
	name: 'en-US',
	vc: {
		component: {
			summary: '{count} items'
		}
	}
};
```

缺少插值参数时会保留原占位符；找不到 key 或 key 对应的值不是字符串时，会返回原 key。

## 自定义语言

可以使用 `Language` 定义完整语言对象，再交给 `VcInstance`：

```ts
import type { Language } from '@deot/vc-locale';
import { VcInstance } from '@deot/vc';

const customLocale: Language = {
	name: 'custom',
	vc: {
		component: {
			title: 'Custom title'
		}
	}
};

VcInstance.configure({
	locale: customLocale
});
```

当前版本要求传入完整的 `Language` 对象，不处理字符串语言代码、异步加载、语言别名或语言包合并。

## 公共导出

- 语言数据：`zhCN`、`enUS`。
- 语言类型：`Language`、`TranslatePair`。
- 组件侧能力：`useLocale`、`translate`、`buildTranslator`、`LocaleKey`、`Translator`，由 `@deot/vc-components` 和 `@deot/vc` 导出。

## 仓库内验证

```bash
npm run test -- --package-name locale --no-coverage
npm run test -- --package-name components --subpackage locale --no-coverage
npm run build -- --package-name locale
npm run typecheck
```
