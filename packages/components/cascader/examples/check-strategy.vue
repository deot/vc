<template>
	<div class="check-strategy-demo">
		<div class="check-strategy-demo__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<p>
			all：v-model 为完整路径；child：只存最深一级的 value，回显时从 data 中找出路径（传数组时取最后一项）；v-model 是数组时输出 [最后一级]、清空为 []，否则输出单值。开启 changeOnSelect 时，child 回填所点的那一级。
			data 延迟到达时，值先设好、data 到达后再回显。切换选项时恢复初始值。
		</p>

		<Cascader
			:key="key"
			v-model="value"
			:data="data"
			:check-strategy="controls.checkStrategy"
			:change-on-select="!!controls.changeOnSelect"
			:searchable="!!controls.searchable"
			class="check-strategy-demo__trigger"
			clearable
			@change="handleChange"
		/>
		<div class="check-strategy-demo__value">value: {{ format(value) }}</div>
		<div>change:</div>
		<ol class="check-strategy-demo__logs">
			<li v-for="(log, index) in logs" :key="index">{{ log }}</li>
		</ol>
	</div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { Cascader } from '..';
import { Select } from '../../select';

const INITIAL_VALUES = [
	{ value: 'path', label: '完整路径数组' },
	{ value: 'leaf', label: '叶子的值' },
	{ value: 'middle', label: '中间一级的值' },
	{ value: 'leaf-string', label: '叶子的值（字符串形式）' },
	{ value: 'leaf-array', label: '只有叶子的数组' },
	{ value: 'partial-path', label: '前两级的数组' },
	{ value: 'missing', label: '不存在的值' },
	{ value: 'undefined', label: 'undefined' },
	{ value: 'null', label: 'null' },
	{ value: 'empty-string', label: '空字符串' },
	{ value: 'empty-array', label: '空数组' }
];

const CONTROLS = [
	{ key: 'checkStrategy', label: 'checkStrategy', data: ['all', 'child'].map(value => ({ value, label: value })) },
	{ key: 'changeOnSelect', label: 'changeOnSelect', data: [{ value: 0, label: '否' }, { value: 1, label: '是' }] },
	{ key: 'initial', label: '初始值', data: INITIAL_VALUES },
	{ key: 'valueType', label: 'data 的 value', data: [{ value: 'string', label: '字符串' }, { value: 'number', label: '数字' }] },
	{ key: 'delay', label: 'data', data: [{ value: 0, label: '立即' }, { value: 1000, label: '延迟 1 秒' }] },
	{ key: 'searchable', label: 'searchable', data: [{ value: 0, label: '否' }, { value: 1, label: '是' }] }
];

// Select 的值不支持布尔：开关用 0 / 1
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const key = computed(() => JSON.stringify(controls));

// 三级数据：字符串形如 item-B-1-2，数字形如 212（分组 2、子组 1、条目 2）
const makeData = (type) => {
	const toValue = (prefix, ...indexes) => (type === 'number' ? +indexes.join('') : `${prefix}-${indexes.join('-')}`);
	return [1, 2, 3].map(g => ({
		value: toValue('group', g),
		label: `分组 ${g}`,
		children: [1, 2].map(s => ({
			value: toValue('sub', g, s),
			label: `子组 ${g}-${s}`,
			children: [1, 2, 3].map(i => ({
				value: toValue('item', g, s, i),
				label: `条目 ${g}-${s}-${i}`
			}))
		}))
	}));
};

const getInitialValue = () => {
	const isNumber = controls.valueType === 'number';
	const [group, sub, item] = isNumber ? [2, 21, 212] : ['group-2', 'sub-2-1', 'item-2-1-2'];
	switch (controls.initial) {
		case 'leaf': return item;
		case 'middle': return sub;
		case 'leaf-string': return `${item}`;
		case 'path': return [group, sub, item];
		case 'leaf-array': return [item];
		case 'partial-path': return [group, sub];
		case 'missing': return isNumber ? 999 : 'missing';
		case 'undefined': return void 0;
		case 'null': return null;
		case 'empty-string': return '';
		default: return [];
	}
};

const format = v => (typeof v === 'undefined' ? 'undefined' : `${JSON.stringify(v)}（${Array.isArray(v) ? 'array' : typeof v}）`);

const data = ref([]);
const value = ref();
const logs = ref([]);
let timer;

const reset = () => {
	clearTimeout(timer);
	value.value = getInitialValue();
	logs.value = [];
	data.value = [];
	const source = makeData(controls.valueType);
	controls.delay
		? (timer = setTimeout(() => (data.value = source), controls.delay))
		: (data.value = source);
};

const handleChange = (v, labels) => {
	logs.value.push(`${format(v)}，labels: ${JSON.stringify(labels)}`);
};

watch(controls, reset, { immediate: true });
</script>

<style>
.check-strategy-demo {
	display: grid;
	gap: 12px;
}

.check-strategy-demo__controls {
	display: grid;
	max-width: 720px;
	margin-right: 220px;
	grid-template-columns: repeat(3, 1fr);
	gap: 12px;
}

.check-strategy-demo p {
	margin: 0;
	line-height: 1.6;
}

.check-strategy-demo__trigger {
	width: 320px !important;
}

.check-strategy-demo__logs {
	margin: 0;
	padding-left: 20px;
	line-height: 1.6;
}
</style>
