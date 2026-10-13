<template>
	<div class="search-example">
		<div class="search-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<p>
			inline：点击后直接在输入框里输入；单选时已选文字作为占位显示，多选时输入框跟在标签之后，输入为空时退格移除最后一个。
			popover：搜索栏在弹层顶部，打开后自动聚焦。
		</p>

		<div :style="{ width: `${controls.width}px` }">
			<Select
				:key="remountKey"
				v-model="value"
				:data="data"
				:max="controls.mode === 'multiple' ? 99 : 1"
				:max-tag-lines="controls.maxTagLines"
				:searchable="controls.searchable !== 'off' && controls.searchable"
				:load-data="controls.source === 'remote' ? loadData : undefined"
				:portal="controls.portal === 'body'"
				search-placeholder="输入条目名称"
				clearable
				@change="handleChange"
			/>
		</div>
		<div>value: {{ value }}</div>
		<div v-if="controls.source === 'remote'">loadData: {{ keywords }}</div>
	</div>
</template>
<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { Select } from '..';

// 对照项：每项一个 Select
const CONTROLS = [
	{
		key: 'searchable',
		label: '搜索方式',
		data: [{ value: 'inline', label: 'inline（触发器内输入）' }, { value: 'popover', label: 'popover（弹层搜索栏）' }, { value: 'off', label: '关闭' }]
	},
	{ key: 'mode', label: '选择', data: [{ value: 'single', label: '单选' }, { value: 'multiple', label: '多选' }] },
	{ key: 'maxTagLines', label: 'maxTagLines', data: [{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 0, label: '0（不限行）' }] },
	{ key: 'width', label: '宽度', data: [320, 200, 120].map(value => ({ value, label: `${value}px` })) },
	{ key: 'source', label: '数据', data: [{ value: 'local', label: '本地过滤' }, { value: 'remote', label: '远程搜索（loadData）' }] },
	{ key: 'portal', label: '挂载', data: [{ value: 'body', label: 'body' }, { value: 'inside', label: '组件内' }] }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const source = Array.from({ length: 30 }, (_, index) => ({
	value: index + 1,
	label: index % 7 === 3 ? `条目 ${index + 1} 名称较长的一项` : `条目 ${index + 1}`,
	disabled: index === 5
}));

const data = ref(source);
const value = ref();
const keywords = ref([]);

// 选择方式、数据来源变化时重新挂载，值与数据回到初始状态
const remountKey = computed(() => `${controls.mode}-${controls.source}`);
watch(
	remountKey,
	() => {
		value.value = controls.mode === 'multiple' ? [1, 2, 3, 4, 5] : 2;
		data.value = source;
		keywords.value = [];
	},
	{ immediate: true }
);

const loadData = (keyword) => {
	keywords.value.push(JSON.stringify(keyword));
	return new Promise((resolve) => {
		setTimeout(() => {
			data.value = source.filter(item => item.label.includes(keyword.trim()));
			resolve();
		}, 400);
	});
};

const handleChange = (v, labels) => {
	console.log('change', v, labels);
};
</script>
<style lang="scss">
.search-example {
	padding: 40px;

	// 右上角留给主题 / 变量 / 性能按钮
	&__controls {
		display: grid;
		max-width: 720px;
		margin-right: 220px;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}
}
</style>
