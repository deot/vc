<template>
	<div class="v-radio-custom-content">
		<h3>Radio：label</h3>
		<p class="v-radio-custom-content__tip">label 支持字符串、渲染函数与 { type, value }；字符串按文本渲染。label 为渲染函数或对象时需要同时提供 value。</p>
		<div class="v-radio-custom-content__controls">
			<Select v-model="kind" :data="KINDS" label="内容" />
		</div>
		<div :key="kind" class="v-radio-custom-content__stage">
			<RadioGroup v-model="current">
				<Radio value="a" :label="value">
					<template v-if="kind === 'slot'" #default>
						<em>插槽的内容</em>
					</template>
				</Radio>
				<Radio value="b" label="选项 B" />
			</RadioGroup>
			<RadioGroup v-model="current" class="v-radio-custom-content__group">
				<RadioButton value="a" :label="value">
					<template v-if="kind === 'slot'" #default>
						<em>插槽的内容</em>
					</template>
				</RadioButton>
				<RadioButton value="b" label="选项 B" />
			</RadioGroup>
		</div>
	</div>
</template>

<script setup>
import { computed, h, ref } from 'vue';
import { Radio, RadioButton, RadioGroup } from '..';
import { Select } from '../../select';

// 字符串按文本渲染：标签会原样显示
const MARKUP = '<b>加粗</b>的内容';
const KINDS = [
	{ value: 'string', label: '字符串（按文本）' },
	{ value: 'html', label: '{ type: \'html\' }' },
	{ value: 'render', label: '渲染函数' },
	{ value: 'slot', label: '插槽' }
];
const VALUES = {
	string: MARKUP,
	html: { type: 'html', value: MARKUP },
	render: () => h('em', '渲染函数的内容'),
	slot: MARKUP
};
const kind = ref('string');
const value = computed(() => VALUES[kind.value]);

const current = ref('a');
</script>

<style lang="scss">
.v-radio-custom-content {
	padding: 20px 240px 20px 20px;
	line-height: 22px;

	&__tip {
		margin: 8px 0 16px;
		color: #666;
	}

	&__controls {
		margin-bottom: 16px;

		.vc-select {
			width: 240px;
		}
	}

	&__stage {
		padding: 16px;
		border: 1px dashed #c5c8ce;
	}

	&__group {
		margin-top: 16px;
	}
}
</style>
