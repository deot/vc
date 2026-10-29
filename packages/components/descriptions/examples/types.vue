<template>
	<div class="descriptions-example">
		<p>内置类型：text / image / file / link / copy / select。table 与 price 通过 VcInstance.options.Descriptions.renderValue 注册，返回空值时回到内置类型</p>
		<div class="descriptions-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<div class="descriptions-example__stage">
			<Descriptions
				:theme="controls.theme"
				:size="controls.size"
				:style="imageStyle"
				:data="data"
				:options="options"
			/>
		</div>
	</div>
</template>
<script setup>
import { reactive, computed, h, onBeforeUnmount } from 'vue';
import { Select } from '../../select';
import { Table, TableColumn } from '../../table';
import { VcInstance } from '../../vc';
import { Descriptions } from '..';

const toData = values => values.map(value => ({ value, label: value }));
const CONTROLS = [
	{ key: 'theme', label: 'theme', data: toData(['fill', 'border', 'inverted', 'plain']) },
	{ key: 'size', label: 'size', data: toData(['medium', 'mini', 'small', 'large']) },
	{ key: 'image', label: '--vc-descriptions-image-size', data: toData(['默认（行高）', '32px', '64px']) }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

// 统一控制图片尺寸：外层设置CSS变量
const imageStyle = computed(() => (/px$/.test(controls.image) ? { '--vc-descriptions-image-size': controls.image } : null));

const image = text => `https://dummyimage.com/600x400/2d8cf0/fff.png?text=${text}`;

const data = {
	code: 'NO-000128',
	images: [image('A'), image('B'), image('C')],
	files: [
		{ source: image('D'), name: '图片 D.png' },
		{ source: 'https://example.com/file-a.pdf', name: '文件 A.pdf' }
	],
	link: 'https://example.com/path/to/a/long/address/for/the/item/000128',
	status: 2,
	amount: 1280.5,
	list: [
		{ name: '条目 1', count: 2, amount: 100 },
		{ name: '条目 2', count: 1, amount: 80 }
	]
};

const options = [
	{ label: '编号', prop: 'code', type: 'copy' },
	{ label: '状态', prop: 'status', type: 'select', options: { data: [{ label: '类型 A', value: 1 }, { label: '类型 B', value: 2 }] } },
	{ label: '金额', prop: 'amount', type: 'price' },
	{ label: '图片', prop: 'images', type: 'image' },
	{ label: '大图', prop: 'images', type: 'image', options: { size: 48 } },
	{ label: '空图片', prop: 'empty', type: 'image' },
	{ label: '链接', prop: 'link', type: 'link', span: 24 },
	{ label: '附件', prop: 'files', type: 'file', span: 24 },
	{
		label: '明细',
		prop: 'list',
		type: 'table',
		span: 24,
		options: {
			columns: [
				{ label: '名称', prop: 'name' },
				{ label: '数量', prop: 'count' },
				{ label: '金额', prop: 'amount' }
			]
		}
	}
];

// 注册自定义类型；组件渲染前设置，离开时还原
const original = VcInstance.options.Descriptions;
VcInstance.options.Descriptions = {
	renderValue: ({ value, row }) => {
		if (row.type === 'price') return h('span', { class: 'price' }, `¥ ${Number(value).toFixed(2)}`);
		if (row.type === 'table') {
			const { columns, ...rest } = row.options || {};
			return h(Table, { border: true, ...rest, data: value }, () => columns.map(column => h(TableColumn, column)));
		}
	}
};
onBeforeUnmount(() => {
	VcInstance.options.Descriptions = original;
});
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
	width: 240px;
}

.descriptions-example__stage {
	padding: 24px;
	background: var(--vc-background-color-lightest);
	border-radius: 8px;
}

/* renderValue中创建的节点不带本组件的scoped标记 */
.descriptions-example__stage :deep(.price) {
	color: var(--vc-color-error);
}
</style>
