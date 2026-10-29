<template>
	<div class="descriptions-example">
		<p>theme：fill（灰底面板）、inverted（fill 的反色：白底面板，放在灰色区域上）、plain（无底色）、border（表格边框）。默认 24 格，每项 span 8，每行最后一项补满本行</p>
		<div class="descriptions-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<div :class="{ 'is-gray': controls.theme === 'inverted' }" class="descriptions-example__stage">
			<Descriptions
				:theme="controls.theme"
				:size="controls.size"
				:data="data"
				:options="options"
				title="基础信息"
			>
				<template #extra>
					<Button size="small">编辑</Button>
				</template>
			</Descriptions>
		</div>

		<h4>子组件写法</h4>
		<div :class="{ 'is-gray': controls.theme === 'inverted' }" class="descriptions-example__stage">
			<Descriptions :theme="controls.theme" :size="controls.size" :data="data">
				<DescriptionsItem label="编号" prop="code" />
				<DescriptionsItem label="名称" prop="name" />
				<DescriptionsItem label="状态" prop="status" />
				<DescriptionsItem label="数值" prop="value" suffix=" 项" tooltip="提示内容" />
				<DescriptionsItem label="空值" prop="empty" />
				<DescriptionsItem label="自定义" :span="24">
					<template #default="{ data: row }">
						<span class="tag">{{ row.type }}</span>
					</template>
				</DescriptionsItem>
			</Descriptions>
		</div>
	</div>
</template>
<script setup>
import { reactive } from 'vue';
import { Select } from '../../select';
import { Button } from '../../button';
import { Descriptions, DescriptionsItem } from '..';

const toData = values => values.map(value => ({ value, label: value }));
const CONTROLS = [
	{ key: 'theme', label: 'theme', data: toData(['fill', 'inverted', 'plain', 'border']) },
	{ key: 'size', label: 'size', data: toData(['medium', 'mini', 'small', 'large']) }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const data = {
	code: 'NO-000128',
	name: '条目 128',
	type: '类型 A',
	group: '分组 B',
	status: '进行中',
	value: 0,
	date: '2026-10-28',
	desc: '说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字'
};

const options = [
	{ label: '编号', prop: 'code' },
	{ label: '名称', prop: 'name' },
	{ label: '类型', prop: 'type' },
	{ label: '分组', prop: 'group' },
	{ label: '状态', prop: 'status' },
	{ label: '日期', prop: 'date' },
	{ label: '数值', prop: 'value', suffix: ' 项' },
	{ label: '空值', prop: 'empty' },
	{ label: '说明', prop: 'desc', span: 24 }
];
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

.descriptions-example__stage {
	padding: 24px;
	background: var(--vc-background-color-lightest);
	border-radius: 8px;
}

.descriptions-example__stage.is-gray {
	background: var(--vc-background-color-light);
}

.tag {
	padding: 0 6px;
	color: var(--vc-color-primary);
	border: 1px solid currentcolor;
	border-radius: 4px;
}
</style>
