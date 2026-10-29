<template>
	<div class="descriptions-example">
		<p>
			columns / span（含单项的 span）都可以写成 { xs, sm, md, lg, xl, xxl }，按 Descriptions 自身的宽度取值
			（xs &lt;576、sm ≥576、md ≥768、lg ≥992、xl ≥1200、xxl ≥1600），放在弹窗或侧栏里也能取到正确的断点
		</p>
		<div class="descriptions-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>
		<code>{{ PRESETS[controls.preset].code }}</code>

		<div :style="{ width: controls.width ? `${controls.width}px` : '100%' }" class="frame">
			<Descriptions
				:theme="controls.theme"
				:data="data"
				:options="options"
				v-bind="PRESETS[controls.preset].props"
			/>
		</div>
	</div>
</template>
<script setup>
import { reactive, computed } from 'vue';
import { Select } from '../../select';
import { Descriptions } from '..';

const PRESETS = {
	span: {
		code: ':span="{ xs: 24, sm: 12, lg: 8, xl: 6 }"，说明 :span="24"',
		props: { span: { xs: 24, sm: 12, lg: 8, xl: 6 } }
	},
	columns: {
		code: ':columns="{ xs: 1, md: 2, lg: 3 }" :span="1"，说明 :span="{ xs: 1, md: 2, lg: 3 }"',
		props: { columns: { xs: 1, md: 2, lg: 3 }, span: 1 }
	}
};

const toData = values => values.map(value => ({ value, label: value }));
const CONTROLS = [
	{ key: 'preset', label: '写法', data: toData(Object.keys(PRESETS)) },
	{
		key: 'width',
		label: '容器宽度',
		data: [{ value: 0, label: '100%' }, ...[360, 640, 900, 1100, 1300].map(value => ({ value, label: `${value}px` }))]
	},
	{ key: 'theme', label: 'theme', data: toData(['fill', 'border', 'inverted', 'plain']) }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const data = {
	code: 'NO-000128',
	name: '条目 128',
	type: '类型 A',
	group: '分组 B',
	status: '进行中',
	date: '2026-10-28',
	desc: '说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字'
};

const options = computed(() => [
	{ label: '编号', prop: 'code' },
	{ label: '名称', prop: 'name' },
	{ label: '类型', prop: 'type' },
	{ label: '分组', prop: 'group' },
	{ label: '状态', prop: 'status' },
	{ label: '日期', prop: 'date' },
	{ label: '说明', prop: 'desc', span: controls.preset === 'span' ? 24 : { xs: 1, md: 2, lg: 3 } }
]);
</script>
<style scoped>
.descriptions-example {
	padding: 20px;
}

.descriptions-example__controls {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 12px;
}

.descriptions-example__controls .vc-select {
	width: 200px;
}

code {
	display: block;
	margin-bottom: 12px;
	color: var(--vc-color-dark-lightest);
}

.frame {
	max-width: 100%;
	padding: 8px;
	border: 1px dashed var(--vc-border-color);
	border-radius: 4px;
	box-sizing: border-box;
	transition: width .2s;
}
</style>
