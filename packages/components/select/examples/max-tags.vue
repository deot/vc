<template>
	<div style="margin: 40px;">
		<div>
			<span>容器宽度：</span>
			<Button
				v-for="item in widths"
				:key="item"
				@click="width = item"
			>
				{{ item }}{{ width === item ? ' ✓' : '' }}
			</Button>
		</div>
		<p>悬停 +N... 查看（并可移除）被折叠的标签；悬停被截断的标签查看完整内容</p>

		<div>
			<p>maxTags = 4，默认单行：放不下时按宽度减少，至少显示 1 个</p>
			<div :style="{ width }">
				<Select
					v-model="value"
					:data="data"
					:max="99"
					:max-tags="4"
					clearable
				/>
			</div>

			<p>第 1 个标签超长：放不下时出现省略号</p>
			<div :style="{ width }">
				<Select
					v-model="valueLong"
					:data="data"
					:max="99"
					clearable
				/>
			</div>

			<p>maxTags = 0：不限数量，只按宽度折叠</p>
			<div :style="{ width }">
				<Select
					v-model="value"
					:data="data"
					:max="99"
					:max-tags="0"
				/>
			</div>

			<p>maxTagLines = 0：不限行（旧行为，只按 maxTags 截断）</p>
			<div :style="{ width }">
				<Select
					v-model="value"
					:data="data"
					:max="99"
					:max-tags="4"
					:max-tag-lines="0"
				/>
			</div>

			<p>maxTagLines = 2：最多两行</p>
			<div :style="{ width }">
				<Select
					v-model="value"
					:data="data"
					:max="99"
					:max-tag-lines="2"
				/>
			</div>

			<p>disabled：无关闭按钮，按实际宽度计算</p>
			<div :style="{ width }">
				<Select
					v-model="value"
					:data="data"
					:max="99"
					disabled
				/>
			</div>

			<p>label 前置</p>
			<div :style="{ width }">
				<Select
					v-model="value"
					:data="data"
					:max="99"
					label="城市"
				/>
			</div>
		</div>
		<div>value: {{ value }}</div>
		<div>valueLong: {{ valueLong }}</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Select } from '..';
import { Button } from '../../button';
import { cityList } from './basic/data';

const widths = ['120px', '200px', '320px', '100%'];
const width = ref('200px');

const data = [
	{ value: '0', label: 'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch' },
	...cityList
];

const value = ref(['1', '2', '3', '4', '5', '6']);
const valueLong = ref(['0', '1', '2']);
</script>
