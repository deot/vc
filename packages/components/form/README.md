## 表单（Form）

组织表单项、校验数据，并将字段恢复到初始值。桌面端使用 `Form / FormItem`，移动端使用 `MForm / MFormItem`。

### 何时使用

- 收集信息，并在提交前校验一个或多个字段。
- 为动态字段、嵌套字段组织标签和错误提示。
- Form 只负责校验和重置；数据提交由调用方处理。原生表单需要通过 `@submit.prevent` 阻止页面跳转。

### 基础用法

将数据传给 `model`，在 FormItem 上用 `prop` 指定字段路径。只有挂载时设置了 `prop` 的表单项才会注册到表单，参与校验、清除和重置。`required` 可以直接传入错误文案。

`validate()` 成功时 resolve `undefined`，失败时 reject 错误数组；`validateField()` 失败时 reject 单个错误对象。需要使用 `await` 和 `try/catch` 处理结果。`clear()` 只清除错误状态和提示，不改变字段值；`reset()` 会同时恢复初始值。`clear()` 之前发起、尚未完成的校验仍会返回结果，但不会再显示错误。如果在同一时刻修改了字段值，控件触发的 change 校验会在之后执行，此时应在 `await nextTick()` 之后再调用 `clear()`。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="form-demo">
		<Form ref="form" :model="model" :label-width="80" @submit.prevent>
			<FormItem prop="name" label="姓名" required="请输入姓名">
				<Input v-model="model.name" placeholder="请输入姓名" />
			</FormItem>
			<FormItem prop="email" label="邮箱" :rules="emailRules">
				<Input v-model="model.email" placeholder="name@example.com" />
			</FormItem>
			<FormItem>
				<div class="actions">
					<Button type="primary" @click="handleSubmit">校验全部</Button>
					<Button @click="handleValidateEmail">校验邮箱</Button>
					<Button @click="handleClear">清除提示</Button>
					<Button @click="handleReset">恢复初始值</Button>
				</div>
			</FormItem>
		</Form>
		<p role="status">{{ result }}</p>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { Form, FormItem, Input, Button } from '@deot/vc';

const form = ref();
const model = reactive({ name: '小明', email: '' });
const result = ref('姓名的初始值为“小明”。');
const emailRules = [
	{ required: true, message: '请输入邮箱' },
	{ pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '请输入有效邮箱' }
];
const handleSubmit = async () => {
	try {
		await form.value.validate({ scroll: false });
		result.value = '全部校验通过，可提交数据。';
	} catch (errors) {
		result.value = errors.map(item => item.message).join('；');
	}
};
const handleValidateEmail = async () => {
	try {
		await form.value.validateField('email', { scroll: false });
		result.value = '邮箱校验通过。';
	} catch (error) {
		result.value = error.message;
	}
};
const handleClear = () => {
	form.value.clear();
	result.value = '已清除错误提示，字段值保持不变。';
};
const handleReset = () => {
	form.value.reset();
	result.value = '已恢复挂载时的初始值。';
};
</script>

<style scoped>
.form-demo { max-width: 560px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
p { margin: 12px 0 0; overflow-wrap: anywhere; }
</style>
```
:::

### 行内布局与标签对齐

`inline` 将表单项排列为行内块。`labelPosition` 支持 `left / right / top`；设为 `top` 后不再使用标签宽度。FormItem 可以单独覆盖对齐方式和宽度。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div>
		<div class="controls">
			<label>标签位置
				<select v-model="position">
					<option value="left">左对齐</option>
					<option value="right">右对齐</option>
					<option value="top">顶部对齐</option>
				</select>
			</label>
			<label><input v-model="isInline" type="checkbox"> 行内布局</label>
		</div>
		<Form :model="model" :label-position="position" :label-width="72" :inline="isInline" @submit.prevent>
			<FormItem label="姓名"><Input v-model="model.name" /></FormItem>
			<FormItem label="城市"><Input v-model="model.city" /></FormItem>
		</Form>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { Form, FormItem, Input } from '@deot/vc';

const position = ref('right');
const isInline = ref(false);
const model = reactive({ name: '', city: '' });
</script>

<style scoped>
.controls { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; }
</style>
```
:::

### 动态字段与局部重置

字段路径支持 `profile.name`、`contacts.0.name` 等形式。动态列表使用稳定的 key，并根据当前数组下标设置 `prop`。`reset({ fields, original })` 只重置选中的已注册字段；指定值为 `null / undefined` 或不存在时恢复该字段挂载时的初始值。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="form-demo">
		<Form ref="form" :model="model" label-position="top" @submit.prevent>
			<FormItem
				v-for="(contact, index) in model.contacts"
				:key="contact.id"
				:prop="'contacts.' + index + '.name'"
				:label="'联系人 ' + (index + 1)"
				required="请输入联系人姓名"
			>
				<div class="contact">
					<Input v-model="contact.name" placeholder="联系人姓名" />
					<Button @click="handleRemove(index)">删除</Button>
				</div>
			</FormItem>
			<div class="actions">
				<Button @click="handleAdd">添加联系人</Button>
				<Button type="primary" @click="handleSubmit">校验联系人</Button>
				<Button :disabled="!model.contacts.length" @click="handleResetFirst">重置第一项</Button>
			</div>
		</Form>
		<p role="status">{{ result }}</p>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { Form, FormItem, Input, Button } from '@deot/vc';

const form = ref();
let nextId = 1;
const model = reactive({ contacts: [{ id: nextId++, name: '' }] });
const result = ref('添加或删除字段后再校验。');
const handleAdd = () => model.contacts.push({ id: nextId++, name: '' });
const handleRemove = index => model.contacts.splice(index, 1);
const handleSubmit = async () => {
	try {
		await form.value.validate({ scroll: false });
		result.value = '当前联系人校验通过。';
	} catch (errors) {
		result.value = errors.map(item => item.prop + '：' + item.message).join('；');
	}
};
const handleResetFirst = () => {
	form.value.reset({
		fields: ['contacts.0.name'],
		original: { contacts: [{ name: '默认联系人' }] }
	});
	result.value = '仅第一项已重置为“默认联系人”。';
};
</script>

<style scoped>
.form-demo { max-width: 560px; }
.contact { display: flex; align-items: center; gap: 8px; }
.contact > :first-child { flex: 1; min-width: 0; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
p { overflow-wrap: anywhere; }
</style>
```
:::

### 自定义校验与错误插槽

规则中的 `validate(value, context)` 可以返回错误字符串、`false`，或返回一个失败时 reject 的 Promise。返回 `undefined / true` 表示同步通过；Promise resolve 表示异步通过。使用多个规则分别表达必填、格式和自定义检查。

:::playground
<!-- <config lang="json5">{ previewInset: 20 }</config> -->
```vue
<template>
	<div class="form-demo">
		<Form ref="form" :model="model" :rules="rules" label-position="top" @submit.prevent>
			<FormItem prop="password" label="密码">
				<Input v-model="model.password" type="password" placeholder="至少 6 个字符" />
			</FormItem>
			<FormItem prop="confirm" label="确认密码">
				<Input v-model="model.confirm" type="password" placeholder="再次输入密码" />
				<template #error="{ show, message, class: errorClass, style }">
					<div v-if="show" :class="errorClass" :style="style">请检查：{{ message }}</div>
				</template>
			</FormItem>
			<Button type="primary" :loading="isValidating" @click="handleSubmit">校验密码</Button>
		</Form>
		<p role="status">{{ result }}</p>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { Form, FormItem, Input, Button } from '@deot/vc';

const form = ref();
const model = reactive({ password: '', confirm: '' });
const isValidating = ref(false);
const result = ref('确认密码使用异步校验。');
const rules = {
	password: {
		validate: value => value.length >= 6 || '密码至少需要 6 个字符'
	},
	confirm: {
		validate: async (value) => {
			await new Promise(resolve => setTimeout(resolve, 200));
			if (!value || value !== model.password) throw new Error('两次密码需要一致');
		}
	}
};
const handleSubmit = async () => {
	isValidating.value = true;
	try {
		await form.value.validate({ scroll: false });
		result.value = '密码校验通过。';
	} catch {
		result.value = '请根据字段提示修改。';
	} finally {
		isValidating.value = false;
	}
};
</script>

<style scoped>
.form-demo { max-width: 480px; }
</style>
```
:::

### 移动端

MForm 复用相同的数据、校验和重置逻辑。`showToast` 与 `showMessage` 同时为 `true` 时，手动校验失败会弹出第一条错误；`indent` 控制非嵌套项的左侧缩进。

:::playground
<!--
<config lang="json5">
{
	previewInset: 16,
	viewport: [375, 480],
	viewportOptions: ['auto', 375, [375, 480]]
}
</config>
-->
```vue
<template>
	<div>
		<MForm ref="form" :model="model" label-position="top" show-toast @submit.prevent>
			<MFormItem prop="name" label="联系人" required="请输入联系人">
				<input v-model="model.name" aria-label="联系人" placeholder="请输入联系人">
			</MFormItem>
		</MForm>
		<div class="actions">
			<MButton type="primary" @click="handleSubmit">校验</MButton>
			<MButton @click="handleReset">重置</MButton>
		</div>
		<p role="status">{{ result }}</p>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { MForm, MFormItem, MButton } from '@deot/vc';

const form = ref();
const model = reactive({ name: '' });
const result = ref('原生输入框通过下方按钮手动校验。');
const handleSubmit = async () => {
	try {
		await form.value.validate({ scroll: false });
		result.value = '校验通过。';
	} catch (errors) {
		result.value = errors[0].message;
	}
};
const handleReset = () => {
	form.value.reset();
	result.value = '已重置。';
};
</script>

<style scoped>
input { width: 100%; min-width: 0; padding: 8px 0; color: inherit; background: transparent; box-sizing: border-box; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }
p { margin: 12px 0 0; }
</style>
```
:::

## API

### Form 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| tag | 根元素标签 | `string` | - | `'form'` |
| model | 表单数据；校验和重置通过字段路径访问该对象 | `object` | - | - |
| rules | 按字段路径配置规则；字段值运行时支持单条规则或规则数组，也支持嵌套对象 | `Record<string, FormRule>` | - | - |
| inline | 行内布局 | `boolean` | - | `false` |
| labelPosition | 标签位置 | `string` | `left / right / top` | `'right'` |
| labelWidth | 标签宽度，单位 px | `number` | - | - |
| showMessage | 显示错误信息；也控制移动端校验 Toast | `boolean` | - | `true` |
| autocomplete | 根元素 autocomplete 属性 | `string` | `on / off` | `'off'` |
| styleless | 所有表单项只渲染 default/error 插槽，Form 根元素仍保留 | `boolean` | - | `false` |
| contentStyle / contentClass | 注入所有表单项内容区的样式 / 类名 | `object \| string` | - | - |
| labelStyle / labelClass | 注入所有表单项标签区的样式 / 类名 | `object \| string` | - | - |
| errorStyle / errorClass | 注入所有表单项错误区的样式 / 类名 | `object \| string` | - | - |
| nestedContentStyle / nestedContentClass | 额外注入嵌套表单项内容区 | `object \| string` | - | - |
| nestedLabelStyle / nestedLabelClass | 额外注入嵌套表单项标签区 | `object \| string` | - | - |
| nestedErrorStyle / nestedErrorClass | 额外注入嵌套表单项错误区 | `object \| string` | - | - |

### Form 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 表单项和操作区 | - |

### Form 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| validate | 校验已注册字段，失败时 reject `{ prop, message }[]`，按页面位置排序 | `{ fields?: string[], excludeFields?: string[], scroll?: boolean }`；默认全部字段、`scroll: true` | `Promise<void>` |
| validateField | 校验单个字段，失败时 reject `{ prop, message }` | `prop: string, options?: { scroll?: boolean }` | `Promise<void>` |
| reset | 清除校验状态，并恢复初始值或指定值；不增删动态列表项 | `{ fields?: string[], excludeFields?: string[], original?: object }` | `void` |
| clear | 清除校验状态和错误提示，不改变字段值 | `{ fields?: string[], excludeFields?: string[] }` | `void` |
| getField | 查找已注册字段；不存在时抛出错误 | `prop: string` | `ComponentInternalInstance` |

`fields / excludeFields` 按 prop 完全匹配：先按 `fields` 选择字段（不传则为全部），再排除 `excludeFields` 中的字段。没有字段或筛选结果为空时校验直接通过。`getField()` 返回 Vue 内部实例，字段方法位于其 `exposed` 上，普通调用建议直接使用表单方法。Form 没有自定义事件；原生 `submit` 事件可通过 `@submit.prevent` 处理。

### FormItem 属性

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| prop | 对应 model 的字段路径 | `string` | - | - |
| label | 标签文案；非空时优先于 label 插槽 | `string` | - | `''` |
| labelWidth | 覆盖标签宽度；嵌套项的标签默认宽度为 0 | `number` | - | 继承 Form |
| labelPosition | 覆盖标签位置 | `string` | `left / right / top` | 继承 Form |
| labelFor | 标签关联目标；当前桌面端将 for 放在标签外层 div，不能依赖它实现原生聚焦；移动端放在 label 上 | `string` | - | - |
| required | 标记必填；没有匹配规则时生成必填规则，字符串同时作为错误文案 | `boolean \| string` | - | `false` |
| asterisk | 是否显示必填标记；不影响校验 | `boolean` | - | `true` |
| rules | 本项规则，非空时优先于 Form.rules | `FormRule \| FormRule[]` | - | - |
| resetByRulesChanged | 本项 rules 引用改变时重置字段 | `boolean` | - | `false` |
| error | 外部错误文案；变化时更新错误状态，设为 `''` 清除；初始值不会立即触发该监听 | `string` | - | - |
| showMessage | 与 Form.showMessage 同时为 true 才显示错误；false 同时移除桌面端项的默认下间距 | `boolean` | - | `true` |
| styleless | 只渲染 default/error 插槽，不渲染标签和默认错误节点 | `boolean` | - | `false` |
| contentStyle / contentClass | 内容区样式 / 类名 | `object \| string` | - | - |
| labelStyle / labelClass | 标签区样式 / 类名 | `object \| string` | - | - |
| errorStyle / errorClass | 错误区样式 / 类名 | `object \| string` | - | - |

样式依次合并 Form、本项对应的 nested 配置、FormItem；类名同时保留。嵌套项通过嵌套 FormItem 创建，字段路径嵌套本身不会创建嵌套布局。

### FormItem 插槽

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 表单控件或嵌套表单项 | - |
| label | 自定义标签，label 为空时使用 | - |
| error | 自定义错误区；styleless 模式下也由此插槽负责错误展示 | 普通模式：`{ show, nest, message, class, style }`；styleless：`{ show, nested, message, class, style }` |

`show` 为是否应显示错误，`nest / nested` 为是否嵌套。自定义错误插槽需要自行处理 `show`，并按需绑定传入的 class/style。

### FormItem 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| validate | 按 trigger 筛选规则并校验，失败时 reject `{ prop, message }` | `trigger: string` | `Promise<void>` |
| reset | 清除状态；非 null/undefined 的参数替代初始值 | `value?: any` | `void` |
| clear | 清除校验状态和错误提示，不改变值 | - | `void` |
| getPosition | 获取表单项位置 | - | `Promise<{ top: number, left: number }>` |

### MForm 属性、插槽和方法

继承 Form 的属性、default 插槽和五个方法，额外属性如下：

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| showToast | 手动校验失败时弹出第一条错误，需同时启用 showMessage | `boolean` | - | `false` |
| border | 当前已声明但未绑定边框状态类，设置它不会启用外边框 | `boolean` | - | `false` |

### MFormItem 属性、插槽和方法

继承 FormItem 属性和四个方法，额外属性如下：

| 属性 | 说明 | 类型 | 可选值 | 默认值 |
| --- | --- | --- | --- | --- |
| indent | 非嵌套项的左侧缩进，单位 px；嵌套项为 0 | `number` | - | `12` |

| 名称 | 说明 | 参数 |
| --- | --- | --- |
| default | 表单控件或嵌套表单项 | - |
| label | 自定义标签，label 为空时使用 | - |
| error | 普通模式只在错误可见时调用；styleless 模式需自行控制显示 | 普通模式：`{ message }`；styleless：`{ show, nested, message, class, style }` |

当前移动端必填标记的样式选择器未匹配实际标签层级，因此不会显示星号；必填校验仍然生效。

### 校验规则与行为边界

`FormRule` 从 `@deot/vc` 导出，基于 `@deot/helper-validator` 的 `ValidatorRule`，额外支持 `trigger?: string | string[]`。

- 支持 `required`、`pattern`、`enum`、`transform`、`validate`、`fields` 和 `message`。不要将其他校验库的 `min / max / type` 当作直接生效的规则；长度、类型检查可用 `validate` 实现。
- 错误文案来自规则 `message`、required 字符串或自定义校验结果；未提供时可以为空。Form 不提供默认翻译文案。
- 自动 blur/change 校验依赖控件与 FormItem 的联动。原生输入框不会自动触发，应手动调用表单方法。
- 规则过滤实际使用 `!rule.trigger || rule.trigger.includes(trigger)`。表单手动校验传入空字符串：字符串 trigger 会匹配；数组 trigger 只有包含 `''` 才会匹配。需要兼顾手动校验时，可省略 trigger、使用单个字符串，或显式包含 `''`。
- 非空的 FormItem.rules 优先；否则查找 Form.rules。数组路径中的中间数字下标会被移除后查找规则，例如 `contacts.0.name` 查找 `contacts.name`；查找抛错时才尝试完整 prop 键。
- 布尔 required 主要控制必填标记和无匹配规则时的兜底，不会额外插入已有规则列表。需要保证必填时请在规则中明确写入 `required: true` 和 message。
- `reset()` 恢复挂载时保存的字段初始值，并非一律清空，也不替换整个 model。

### 主题

桌面端和移动端使用 `form` 主题命名空间。可覆盖 `--vc-form-background-color-light`、`--vc-form-color-error`；桌面端另使用 `--vc-form-foreground-color`、`--vc-form-color-dark-light`，移动端使用 `--vc-form-color-dark`。未覆盖时跟随共享亮暗主题。
