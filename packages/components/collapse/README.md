## 折叠面板（Collapse）

通过点击标题展开或收起分组内容。默认提供边框、间距与展开箭头；设置 `styleless` 后只保留折叠行为，外观完全由插槽自定义。

### 何时使用

- 分组展示较长内容，按需展开详情。
- 使用手风琴模式，在交互时只保留一个展开面板。

### 基础用法

普通模式使用数组保存展开项，可同时展开多个面板。标题可用 `title` 属性或默认插槽，内容放在 `content` 插槽。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="collapse-demo">
		<Collapse v-model="value">
			<CollapseItem v-for="item in items" :key="item.value" :value="item.value" :title="item.title">
				<template #content>{{ item.content }}</template>
			</CollapseItem>
		</Collapse>
		<p>已展开：{{ value.length ? value.join('、') : '无' }}</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Collapse, CollapseItem } from '@deot/vc';

const value = ref(['install']);
const items = [
	{ value: 'install', title: '安装', content: '通过包管理器安装后，按需引入 Collapse 与 CollapseItem。' },
	{ value: 'usage', title: '使用', content: '使用 v-model 绑定展开项，普通模式下为数组，可同时展开多个面板。' },
	{ value: 'style', title: '样式', content: '默认提供边框、间距与展开箭头，颜色与字号跟随主题变量。' }
];
</script>
<style scoped>
.collapse-demo { display: grid; gap: 12px; }
.collapse-demo p { margin: 0; }
</style>
```
:::

### 手风琴与内容保留

设置 `accordion` 后同一时间只展开一项，绑定值为单个标识，收起当前项时为 `undefined`。`:alive="false"` 在收起时卸载内容，重新展开后内容状态会重建；CollapseItem 的 `alive` 可单独覆盖。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="collapse-demo">
		<Collapse v-model="value" accordion :alive="false">
			<CollapseItem :value="1" title="收起后重置">
				<template #content>
					<Input v-model="draft" placeholder="输入内容后收起再展开" />
				</template>
			</CollapseItem>
			<CollapseItem :value="2" title="收起后保留" :alive="true">
				<template #content>
					<Input v-model="kept" placeholder="此项设置了 alive，内容会保留" />
				</template>
			</CollapseItem>
		</Collapse>
		<p>当前展开：{{ value === undefined ? '无' : value }}</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Collapse, CollapseItem, Input } from '@deot/vc';

const value = ref(1);
const draft = ref('');
const kept = ref('');
</script>
<style scoped>
.collapse-demo { display: grid; gap: 12px; }
.collapse-demo p { margin: 0; }
</style>
```
:::

### 始终展开一项

`:collapsible="false"` 时点击已展开的面板不会收起，不触发 `change`。与 `accordion` 一起使用即同一时间有且只有一项展开，适合步骤说明、设置分组等场景；未设置初始展开项时，首次点击后才开始保持展开。也可只在某个 CollapseItem 上设置，仅锁定该项。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="collapse-demo">
		<Collapse v-model="value" accordion :collapsible="false">
			<CollapseItem v-for="item in steps" :key="item.value" :value="item.value" :title="item.title" :content="item.content" />
		</Collapse>
		<p>当前步骤：{{ value }}</p>
		<Collapse v-model="opened">
			<CollapseItem value="basic" title="基本信息（不可收起）" :collapsible="false" content="此项设置了 :collapsible='false'，展开后不能收起。" />
			<CollapseItem value="more" title="更多信息" content="其余面板正常展开、收起。" />
		</Collapse>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Collapse, CollapseItem } from '@deot/vc';

const value = ref('account');
const opened = ref(['basic']);
const steps = [
	{ value: 'account', title: '1. 账号信息', content: '点击当前展开的面板不会收起。' },
	{ value: 'profile', title: '2. 个人资料', content: '点击其他面板时切换展开项。' },
	{ value: 'confirm', title: '3. 确认提交', content: '任何时候都有且只有一项展开。' }
];
</script>
<style scoped>
.collapse-demo { display: grid; gap: 12px; }
.collapse-demo p { margin: 0; }
</style>
```
:::

### 附加内容

`extra` 显示在标题右侧，可用属性或插槽（插槽接收 `{ visible }`）。点击附加内容不会展开或收起面板，适合放置操作按钮。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="collapse-demo">
		<Collapse v-model="value">
			<CollapseItem :value="1" title="订单信息" extra="3 项">
				<template #content>订单编号、下单时间、支付方式。</template>
			</CollapseItem>
			<CollapseItem :value="2" title="收货地址">
				<template #extra="{ visible }">
					<Button size="small" @click="count++">{{ visible ? '保存' : '编辑' }}</Button>
				</template>
				<template #content>点击右侧按钮不会切换面板。</template>
			</CollapseItem>
		</Collapse>
		<p>按钮点击次数：{{ count }}</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Button, Collapse, CollapseItem } from '@deot/vc';

const value = ref([]);
const count = ref(0);
</script>
<style scoped>
.collapse-demo { display: grid; gap: 12px; }
.collapse-demo p { margin: 0; }
</style>
```
:::

### 箭头

`arrow` 设置箭头位置，`false` 时隐藏，CollapseItem 可单独覆盖；`arrow` 插槽可替换内置箭头。`triggerRegion="arrow"` 时只有点击箭头才会切换。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="collapse-demo">
		<div class="toolbar">
			<RadioGroup v-model="arrow">
				<Radio value="left">左侧</Radio>
				<Radio value="right">右侧</Radio>
				<Radio :value="false">隐藏</Radio>
			</RadioGroup>
			<Checkbox v-model="arrowOnly">仅点击箭头切换</Checkbox>
		</div>
		<Collapse v-model="value" :arrow="arrow" :trigger-region="arrowOnly ? 'arrow' : 'header'">
			<CollapseItem :value="1" title="跟随 Collapse">
				<template #content>箭头位置由 Collapse 的 arrow 决定。</template>
			</CollapseItem>
			<CollapseItem :value="2" title="自定义箭头">
				<template #arrow="{ visible }">{{ visible ? '收起' : '展开' }}</template>
				<template #content>arrow 插槽接收 visible 状态。</template>
			</CollapseItem>
			<CollapseItem :value="3" title="单独隐藏箭头" :arrow="false">
				<template #content>此项设置了 :arrow="false"。</template>
			</CollapseItem>
		</Collapse>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Checkbox, Collapse, CollapseItem, Radio, RadioGroup } from '@deot/vc';

const value = ref([1]);
const arrow = ref('left');
const arrowOnly = ref(false);
</script>
<style scoped>
.collapse-demo { display: grid; gap: 12px; }
.toolbar { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; }
</style>
```
:::

### 边框与禁用

`border` 控制外边框；`disabled` 可作用于整个 Collapse，也可单独设置在 CollapseItem 上。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="collapse-demo">
		<div class="toolbar">
			<Checkbox v-model="border">边框</Checkbox>
			<Checkbox v-model="disabled">全部禁用</Checkbox>
		</div>
		<Collapse v-model="value" :border="border" :disabled="disabled">
			<CollapseItem :value="1" title="可用面板">
				<template #content>勾选“全部禁用”后此项也无法切换。</template>
			</CollapseItem>
			<CollapseItem :value="2" title="禁用面板" extra="不可展开" disabled>
				<template #content>不会显示</template>
			</CollapseItem>
		</Collapse>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Checkbox, Collapse, CollapseItem } from '@deot/vc';

const value = ref([1]);
const border = ref(true);
const disabled = ref(false);
</script>
<style scoped>
.collapse-demo { display: grid; gap: 12px; }
.toolbar { display: flex; gap: 16px; }
</style>
```
:::

### 自定义样式

`headerStyle` / `headerClass` 作用于标题栏，`contentStyle` / `contentClass` 作用于内容区。Collapse 与 CollapseItem 都可设置：类名叠加，样式同名时以 CollapseItem 为准。例如在 Collapse 上去掉内容区灰底，再单独给某一项设置背景。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="collapse-demo">
		<Checkbox v-model="plain">内容区去掉灰底</Checkbox>
		<Collapse
			v-model="value"
			:content-style="plain ? { background: 'transparent' } : undefined"
			header-class="demo-header"
		>
			<CollapseItem :value="1" title="跟随 Collapse" content="内容区样式由 Collapse 的 contentStyle 决定。" />
			<CollapseItem
				:value="2"
				title="单独设置"
				content="此项的 contentStyle 覆盖了 Collapse 的同名样式。"
				:header-style="{ color: 'var(--vc-color-primary)' }"
				:content-style="{ background: 'var(--vc-background-color-primary-light)' }"
			/>
		</Collapse>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Checkbox, Collapse, CollapseItem } from '@deot/vc';

const value = ref([1, 2]);
const plain = ref(true);
</script>
<style scoped>
.collapse-demo { display: grid; gap: 12px; }
.collapse-demo :deep(.demo-header) { padding-top: 10px; padding-bottom: 10px; }
</style>
```
:::

### 无样式

设置 `styleless` 后不添加任何默认类名，也不渲染内置箭头，外观完全由插槽决定；默认插槽同样接收 `{ visible }`，折叠行为不变。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<Collapse v-model="value" styleless class="faq">
		<CollapseItem v-for="item in items" :key="item.q" :value="item.q">
			<template #default="{ visible }">
				<div class="faq__question">
					<span>{{ item.q }}</span>
					<span>{{ visible ? '−' : '+' }}</span>
				</div>
			</template>
			<template #content><p class="faq__answer">{{ item.a }}</p></template>
		</CollapseItem>
	</Collapse>
</template>
<script setup>
import { ref } from 'vue';
import { Collapse, CollapseItem } from '@deot/vc';

const value = ref([]);
const items = [
	{ q: '是否支持手风琴模式？', a: '支持，设置 accordion 即可。' },
	{ q: '能否完全自定义外观？', a: '可以，设置 styleless 后只保留折叠行为。' }
];
</script>
<style scoped>
.faq__question {
	display: flex;
	justify-content: space-between;
	padding: 12px 0;
	border-bottom: 1px solid var(--vc-color-neutral-light);
	font-weight: 500;
	cursor: pointer;
}
.faq__answer { margin: 0; padding: 12px 0; font-size: 13px; opacity: .8; }
</style>
```
:::

## API

### Collapse 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| modelValue | 展开项；普通模式应传数组，非数组视为全部收起。手风琴模式可传单个标识或数组，建议使用单个标识 | `Array<string \| number> \| string \| number` | - | `undefined` |
| accordion | 手风琴模式，点击展开时只保留最后展开的一项；传入的数组不会自动截断 | `boolean` | - | `false` |
| tag | 外层标签 | `string` | - | `'div'` |
| alive | 收起时保留内容节点；为 false 时卸载内容 | `boolean` | - | `true` |
| border | 显示外边框 | `boolean` | - | `true` |
| disabled | 禁用所有面板 | `boolean` | - | `false` |
| collapsible | 能否点击收起已展开的面板；为 false 时点击已展开项不响应，与 `accordion` 一起使用可始终保持一项展开。CollapseItem 可单独覆盖 | `boolean` | - | `true` |
| arrow | 箭头位置，`false` 时不显示 | `'left' \| 'right' \| false` | - | `'left'` |
| triggerRegion | 可触发切换的区域；为 `'arrow'` 时只有点击箭头切换 | `'header' \| 'arrow'` | - | `'header'` |
| headerStyle | 标题栏样式，与 CollapseItem 的同名属性合并 | `string \| object` | - | - |
| headerClass | 标题栏类名，与 CollapseItem 的同名属性叠加 | `string \| object` | - | - |
| contentStyle | 内容区样式，与 CollapseItem 的同名属性合并 | `string \| object` | - | - |
| contentClass | 内容区类名，与 CollapseItem 的同名属性叠加 | `string \| object` | - | - |
| styleless | 不添加 Collapse 及 CollapseItem 的默认样式类名，也不渲染内置箭头 | `boolean` | - | `false` |

### Collapse 事件

| 事件名 | 说明 | 回调参数 | 参数说明 |
| --- | --- | --- | --- |
| change | 点击标题切换展开项时触发 | `(value: Array<string \| number> \| string \| number \| undefined) => void` | 普通模式为展开项数组；手风琴模式为单个标识，全部收起为 undefined |
| update:modelValue | 更新绑定值，支持 v-model；与 change 同时触发 | 同 change | 同 change |

### Collapse 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 放置 CollapseItem | - |

### CollapseItem 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| value | 面板标识，与 modelValue 中的值严格匹配；动态列表建议显式提供唯一标识 | `string \| number` | - | 挂载注册时分配的数字索引，从 0 开始 |
| title | 标题，default 插槽优先。字符串按文本渲染，也可传渲染函数（接收 `{ visible }`）或 `{ type, value }`，见 [Customer](../customer/README.md) | `string \| number \| Function \| { type: string; value: any }` | - | - |
| extra | 标题右侧附加内容，extra 插槽优先；点击不会切换面板。取值同 `title` | `string \| number \| Function \| { type: string; value: any }` | - | - |
| content | 折叠内容，content 插槽优先。取值同 `title` | `string \| number \| Function \| { type: string; value: any }` | - | - |
| disabled | 禁用此面板 | `boolean` | - | `false` |
| arrow | 箭头位置，`false` 时不显示；未设置时继承 Collapse | `'left' \| 'right' \| false` | - | `undefined` |
| collapsible | 展开后能否点击收起；未设置时继承 Collapse | `boolean` | - | `undefined` |
| alive | 收起时保留内容节点；未设置时继承 Collapse | `boolean` | - | `undefined` |
| headerStyle | 标题栏样式；与 Collapse 合并，同名样式以此为准 | `string \| object` | - | - |
| headerClass | 标题栏类名；与 Collapse 叠加 | `string \| object` | - | - |
| contentStyle | 内容区样式；与 Collapse 合并，同名样式以此为准 | `string \| object` | - | - |
| contentClass | 内容区类名；与 Collapse 叠加 | `string \| object` | - | - |
| tag | 外层标签 | `string` | - | `'div'` |

### CollapseItem 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 可点击的标题内容，优先于 `title` 属性 | `{ visible: boolean }`，表示当前是否展开 |
| extra | 标题右侧附加内容，点击不会切换面板 | `{ visible: boolean }`，表示当前是否展开 |
| arrow | 替换内置箭头；`styleless` 下同样生效 | `{ visible: boolean }`，表示当前是否展开 |
| content | 折叠内容，优先于 `content` 属性 | `{ visible: boolean }`，表示当前是否展开 |

### CollapseItem 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| toggle | 仅设置此项的展开状态，不同步父级 modelValue，也不触发 change；通常通过父级状态控制 | `visible: boolean` | `boolean`，设置后的状态 |

实例还暴露 `isActive`，表示当前展开状态。

### 使用注意

- 支持 `v-model`，也可使用 `:model-value` 和 `@change` 组合回写状态。
- 普通模式内部会修改传入数组；若需要隔离父级数组，可传入其副本。
- CollapseItem 需要放在 Collapse 内使用。`styleless` 不移除折叠行为和过渡结构；此时 `triggerRegion="arrow"` 需配合 `arrow` 插槽，否则没有可点击的区域。
- 标题文字可以拖选复制，拖选后松开不会切换面板；双击、三击标题时不会选中文字。
- `styleless` 下标题栏与内容区没有默认类名，可通过 `headerClass`、`contentClass` 指定。
- 原 `icon` 插槽已移除，改用 `extra`（附加内容）或 `arrow`（展开指示）插槽。
- `MCollapse`、`MCollapseItem` 分别是 `Collapse`、`CollapseItem` 的别名，使用同一实现与样式，可从 `@deot/vc` 导入。
