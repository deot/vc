<template>
	<div class="v-customer">
		<h3>Customer：函数（渲染函数 / 插槽）→ 字符串 / { type, value }</h3>
		<ol class="v-customer__notes">
			<li>字符串和数字永远是文本；需要 HTML 时传 { type: 'html', value }</li>
			<li>「全局 sanitize」在写入 HTML 前清洗内容：开启后示例里的 onerror 不再执行（看「脚本执行次数」）；不含 &lt; 和 &amp; 的内容按文本写入，不会经过它</li>
			<li>「全局 formatter」只处理 { type, value }，用来扩展自定义类型（示例里的 amount）；html 类型的值经它处理后再交给 sanitize</li>
			<li>函数的内容不包裹；「wrap」开启后放进包裹元素，没有内容时也保留包裹元素。插槽也是函数，组件内部写成 render={slots.x || props.x}</li>
			<li>除 class / style / 事件外，写在组件上的属性（示例里的 index）都是函数的参数，不会出现在 DOM 上</li>
			<li>函数的第二个参数是组件的上下文：可调用写在组件里的插槽，也可用 emit 触发事件（选「渲染函数（插槽与 emit）」后点击内容）</li>
		</ol>
		<div class="v-customer__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>
		<div ref="stage" :key="stageKey" class="v-customer__stage">
			<Customer
				:tag="controls.tag"
				:wrap="controls.wrap === 'on'"
				:render="value"
				:index="1"
				class="v-customer__wrapper"
				@pick="picked++"
			>
				来自默认插槽的内容
			</Customer>
		</div>
		<pre class="v-customer__dom">{{ dom || '（没有输出）' }}</pre>
		<p>脚本执行次数：{{ executed }}；emit 次数：{{ picked }}</p>

		<h3>挂载耗时：{{ COUNT }} 条文本</h3>
		<div class="v-customer__controls">
			<Select v-model="mode" :data="MODES" label="渲染方式" />
		</div>
		<p>挂载耗时：{{ cost }}ms（切换时重新挂载；长任务与 JS 堆见右上角）</p>
		<div :key="mode" class="v-customer__list">
			<template v-if="mode === 'plain'">
				<span v-for="i in COUNT" :key="i">条目 {{ i }}</span>
			</template>
			<template v-else-if="mode === 'string'">
				<Customer v-for="i in COUNT" :key="i" tag="span" :render="`条目 ${i}`" />
			</template>
			<template v-else>
				<Customer v-for="i in COUNT" :key="i" :render="renderItem" :index="i" />
			</template>
		</div>
	</div>
</template>

<script setup>
import { computed, h, nextTick, onBeforeUnmount, reactive, ref, watch, watchEffect } from 'vue';
import { Customer } from '..';
import { Select } from '../../select';
import { VcInstance } from '../../vc';

// 按 HTML 解析时图片加载失败，onerror 执行一次
const MARKUP = '<b>加粗</b> 与 <img src="data:," alt="" onerror="window.$customerExecuted()">';

const VALUES = {
	string: MARKUP,
	number: 0,
	html: { type: 'html', value: MARKUP },
	text: { type: 'text', value: MARKUP },
	amount: { type: 'amount', value: 1234.5 },
	render: ({ index }) => h('em', `渲染函数内容（index: ${index}）`),
	context: ({ index }, { slots, emit }) => h('em', { onClick: () => emit('pick', index) }, ['点击触发 emit；', slots.default?.()]),
	empty: ''
};

// 对照项：每项一个 Select
const CONTROLS = [
	{
		key: 'value',
		label: '内容',
		data: [
			{ value: 'html', label: '{ type: \'html\' }' },
			{ value: 'string', label: '字符串' },
			{ value: 'number', label: '数字 0' },
			{ value: 'text', label: '{ type: \'text\' }' },
			{ value: 'amount', label: '{ type: \'amount\' }（自定义）' },
			{ value: 'render', label: '渲染函数' },
			{ value: 'context', label: '渲染函数（插槽与 emit）' },
			{ value: 'empty', label: '空字符串' }
		]
	},
	{ key: 'sanitize', label: '全局 sanitize', data: [{ value: 'off', label: '不配置' }, { value: 'on', label: '去掉 on* 属性' }] },
	{ key: 'formatter', label: '全局 formatter', data: [{ value: 'off', label: '不配置' }, { value: 'on', label: '转换 amount' }] },
	{ key: 'wrap', label: 'wrap', data: [{ value: 'off', label: '关闭' }, { value: 'on', label: '开启' }] },
	{ key: 'tag', label: 'tag', data: ['div', 'span', 'label'].map(value => ({ value, label: value })) }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const value = computed(() => VALUES[controls.value]);

// 仅作演示：去掉所有 on* 属性。实际项目请使用成熟的清洗库
const clean = (html) => {
	const doc = new DOMParser().parseFromString(html, 'text/html');
	doc.body.querySelectorAll('*').forEach((el) => {
		[...el.attributes].forEach(attr => /^on/i.test(attr.name) && el.removeAttribute(attr.name));
	});
	return doc.body.innerHTML;
};
const sanitize = ({ value: v }) => clean(v);
const formatter = ({ type, value: v }) => (type === 'amount' ? v.toFixed(2) : v);

const original = { Customer: VcInstance.options.Customer, sanitize: VcInstance.options.sanitize };
watchEffect(() => {
	VcInstance.configure({
		sanitize: controls.sanitize === 'on' ? sanitize : void 0,
		Customer: {
			formatter: controls.formatter === 'on' ? formatter : void 0
		}
	});
});

const executed = ref(0);
const picked = ref(0);
window.$customerExecuted = () => executed.value++;

// 每次切换都重新挂载，确保图片重新加载、输出的 DOM 与当前选项对应
const stage = ref();
const stageKey = ref(0);
const dom = ref('');
watch(controls, async () => {
	executed.value = 0;
	stageKey.value++;
	await nextTick();
	dom.value = stage.value.innerHTML;
}, { immediate: true });

// 挂载耗时对照
const COUNT = 5000;
const MODES = [
	{ value: 'plain', label: '直接渲染 span' },
	{ value: 'string', label: 'Customer（字符串）' },
	{ value: 'render', label: 'Customer（渲染函数）' }
];
const mode = ref('plain');
const cost = ref('-');
const renderItem = ({ index }) => h('span', `条目 ${index}`);
watch(mode, async () => {
	window.$perf?.reset();
	const start = performance.now();
	await nextTick();
	cost.value = (performance.now() - start).toFixed(1);
});

window.$perf?.observe();
onBeforeUnmount(() => {
	VcInstance.configure(original);
	delete window.$customerExecuted;
	window.$perf?.disconnect();
});
</script>

<style lang="scss">
.v-customer {
	padding: 20px 240px 20px 20px;
	line-height: 22px;

	&__notes {
		padding-left: 20px;
		margin: 8px 0 16px;
		list-style: decimal;
	}

	&__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 12px;

		.vc-select {
			width: 240px;
		}
	}

	&__stage {
		min-height: 46px;
		padding: 12px;
		border: 1px dashed #c5c8ce;
	}

	&__wrapper {
		outline: 1px solid #2d8cf0;
	}

	&__dom {
		padding: 12px;
		margin: 12px 0;
		font-size: 12px;
		word-break: break-all;
		white-space: pre-wrap;
		background: #f8f8f9;
	}

	&__list {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 12px;
		height: 220px;
		overflow: auto;
		border: 1px dashed #c5c8ce;
	}
}
</style>
