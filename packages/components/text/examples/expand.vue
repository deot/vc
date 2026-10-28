<template>
	<div class="text-expand">
		<div class="text-expand__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
				style="width: 200px;"
			/>
		</div>
		<pre class="text-expand__readout">{{ readout }}</pre>

		<div
			:key="controls.mode"
			:class="['text-expand__box', { 'is-float': controls.float === 'float' }]"
			:style="{ width: controls.width }"
		>
			<h3>展开 / 收起</h3>
			<Text
				v-bind="textProps"
				:value="CONTENT"
				@expand-change="handleExpandChange"
				@update:expanded="handleUpdate"
			>
				<template #expand="{ expanded: v }">
					<span class="text-expand__link">{{ v ? '收起' : '展开' }}</span>
				</template>
			</Text>

			<h3>Flex 子项（左侧固定标签）</h3>
			<div class="text-expand__flex">
				<span class="text-expand__label">说明</span>
				<Text v-bind="textProps" :value="CONTENT">
					<template #expand="{ expanded: v }">
						<span class="text-expand__link">{{ v ? '收起' : '展开' }}</span>
					</template>
				</Text>
			</div>

			<h3>未超出：不显示入口</h3>
			<Text v-bind="textProps" value="一段较短的文本">
				<template #expand="{ expanded: v }">
					<span class="text-expand__link">{{ v ? '收起' : '展开' }}</span>
				</template>
			</Text>
		</div>
	</div>
</template>
<script setup>
import { computed, h, reactive, ref } from 'vue';
import { Text } from '..';
import { Select } from '../../select';

const CONTENT = '这是一段用于演示的较长文本，超出指定行数后会在省略符后显示展开入口；点击入口显示全文，并在末尾显示收起入口，再次点击回到截断状态。拖动或切换容器宽度时，入口会随截断结果出现或消失。';

const CONTROLS = [
	{ key: 'line', label: '行数', data: [2, 1, 3].map(value => ({ value, label: `${value} 行` })) },
	{
		key: 'width',
		label: '容器宽度',
		data: ['320px', '200px', '480px', '100%'].map(value => ({ value, label: value }))
	},
	{
		key: 'float',
		label: '入口位置',
		data: [{ value: 'inline', label: '跟在省略符后' }, { value: 'float', label: '右浮动' }]
	},
	{
		key: 'slice',
		label: '保留尾部',
		data: [{ value: 'none', label: '不保留' }, { value: -8, label: 'slice = -8' }]
	},
	{
		key: 'renderRow',
		label: 'renderRow',
		data: [{ value: 'default', label: '默认' }, { value: 'mark', label: '高亮前缀' }]
	},
	{
		key: 'mode',
		label: '状态',
		data: [{ value: 'inner', label: '组件内部' }, { value: 'model', label: 'v-model:expanded' }]
	}
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const renderRow = ({ value, index }) => {
	return index > 0
		? [h('mark', value.slice(0, index)), value.slice(index)]
		: value;
};

const expanded = ref(false);
const events = ref([]);

const textProps = computed(() => {
	return {
		line: controls.line,
		slice: controls.slice === 'none' ? void 0 : controls.slice,
		renderRow: controls.renderRow === 'mark' ? renderRow : void 0,
		// 受控时所有 Text 共用一个状态
		...(controls.mode === 'model' && {
			'expanded': expanded.value,
			'onUpdate:expanded': v => (expanded.value = v)
		})
	};
});

const handleExpandChange = v => events.value = [`expand-change(${v})`, ...events.value].slice(0, 3);
const handleUpdate = v => events.value = [`update:expanded(${v})`, ...events.value].slice(0, 3);

const readout = computed(() => {
	return [
		`v-model:expanded = ${expanded.value}`,
		`最近事件：${events.value.join('，') || '无'}`
	].join('\n');
});
</script>
<style>
.text-expand {
	padding: 20px;
}

.text-expand__controls {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	max-width: calc(100% - 220px);
}

.text-expand__readout {
	margin: 12px 0;
	font-size: 12px;
}

.text-expand__box {
	line-height: 22px;
	transition: width 0.3s;
}

.text-expand__link {
	margin-left: 4px;
	color: var(--vc-color-primary);
}

.text-expand__box.is-float .vc-text__expand {
	float: right;
}

.text-expand__flex {
	display: flex;
	gap: 8px;
}

.text-expand__label {
	flex-shrink: 0;
	opacity: 0.65;
}
</style>
