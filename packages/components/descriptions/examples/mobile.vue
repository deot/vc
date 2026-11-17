<template>
	<div class="m-descriptions-demo">
		<div class="m-descriptions-demo__title">
			基础用法（默认每项占满一行；灰色页面上用 inverted 白底面板）
		</div>
		<MDescriptions theme="inverted" :size="size" :data="data" :options="options" title="基础信息">
			<template #extra>
				<span class="m-descriptions-demo__link">编辑</span>
			</template>
		</MDescriptions>
		<div class="m-descriptions-demo__actions">
			<MButton
				v-for="item in SIZES"
				:key="item"
				size="small"
				:type="size === item ? 'primary' : 'default'"
				@click="size = item"
			>
				{{ item }}
			</MButton>
		</div>

		<div class="m-descriptions-demo__title">
			每行 2 项、标签在上方
		</div>
		<MDescriptions theme="inverted" :span="12" label-position="top" :data="data" :options="options.slice(0, 6)" />

		<div class="m-descriptions-demo__title">
			border 主题、labelWidth 160（750 稿）
		</div>
		<MDescriptions theme="border" :label-width="160" :data="data" :options="options.slice(0, 4)" />

		<div class="m-descriptions-demo__title">
			值的类型：image（点击用移动端查看器预览）、copy（Toast 提示）、link
		</div>
		<MDescriptions theme="inverted" :data="data" :options="typed" />

		<div class="m-descriptions-demo__title">
			分组
		</div>
		<MDescriptions theme="inverted" :data="data" :options="groups" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MDescriptions } from '../index.m';
import { MButton } from '../../button/index.m';

const SIZES = ['mini', 'small', 'medium', 'large'];
const size = ref('medium');

const image = (text, color) => `data:image/svg+xml,${encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="${color}"/>`
	+ `<text x="120" y="132" font-size="40" text-anchor="middle" fill="#fff">${text}</text></svg>`
)}`;

const data = {
	code: 'NO-000128',
	name: '条目 128',
	type: '类型 A',
	group: '分组 B',
	status: '进行中',
	value: 0,
	date: '2026-10-28',
	desc: '说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字说明文字',
	images: [image('1', '#456CF6'), image('2', '#2BB57B'), image('3', '#F2A33A')],
	link: 'https://example.com/path/to/page'
};

const options = [
	{ label: '编号', prop: 'code' },
	{ label: '名称', prop: 'name' },
	{ label: '类型', prop: 'type' },
	{ label: '分组', prop: 'group' },
	{ label: '状态', prop: 'status' },
	{ label: '日期', prop: 'date' },
	{ label: '数值', prop: 'value', suffix: ' 项', tooltip: '提示内容' },
	{ label: '空值', prop: 'empty' },
	{ label: '说明', prop: 'desc' }
];

const typed = [
	{ label: '图片', prop: 'images', type: 'image', options: { size: 96 } },
	{ label: '编号', prop: 'code', type: 'copy' },
	{ label: '链接', prop: 'link', type: 'link' }
];

const groups = [
	{ label: '基本', children: options.slice(0, 3) },
	{ label: '状态', children: options.slice(4, 7) }
];
</script>

<style lang="scss">
.m-descriptions-demo {
	min-height: 100vh;
	padding: 0 calc(var(--vc-rem) * 32) 24px;
	background: var(--vc-background-color-light);

	&__title {
		padding: calc(var(--vc-rem) * 24) 0;
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-extralight);
	}

	&__link {
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-primary);
	}

	&__actions {
		display: flex;
		margin-top: calc(var(--vc-rem) * 16);
		gap: calc(var(--vc-rem) * 16);
	}
}
</style>
