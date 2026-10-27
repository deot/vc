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
			<Select v-model="checkStrategy" :data="CHECK_STRATEGIES" label="checkStrategy" style="width: 280px;" />
		</div>
		<p>悬停 +N... 查看（并可移除）被折叠的标签；悬停被截断的标签查看完整内容</p>

		<div>
			<p>maxTags = 4，默认单行：路径标签较长，放不下时按宽度减少，至少显示 1 个（必要时省略）</p>
			<div :style="{ width }">
				<TreeSelect
					v-model="value"
					:data="data"
					:check-strategy="checkStrategy"
					:max="99"
					:max-tags="4"
					clearable
				/>
			</div>

			<p>级联模式</p>
			<div :style="{ width }">
				<TreeSelect
					v-model="value"
					:data="data"
					:check-strategy="checkStrategy"
					:max="99"
					cascader
					clearable
				/>
			</div>

			<p>maxTags = 0：不限数量，只按宽度折叠</p>
			<div :style="{ width }">
				<TreeSelect
					v-model="value"
					:data="data"
					:check-strategy="checkStrategy"
					:max="99"
					:max-tags="0"
				/>
			</div>

			<p>maxTagLines = 0：不限行（旧行为，只按 maxTags 截断）</p>
			<div :style="{ width }">
				<TreeSelect
					v-model="value"
					:data="data"
					:check-strategy="checkStrategy"
					:max="99"
					:max-tags="4"
					:max-tag-lines="0"
				/>
			</div>

			<p>maxTagLines = 2：最多两行</p>
			<div :style="{ width }">
				<TreeSelect
					v-model="value"
					:data="data"
					:check-strategy="checkStrategy"
					:max="99"
					:max-tag-lines="2"
				/>
			</div>

			<p>disabled：无关闭按钮，按实际宽度计算</p>
			<div :style="{ width }">
				<TreeSelect
					v-model="value"
					:data="data"
					:check-strategy="checkStrategy"
					:max="99"
					disabled
				/>
			</div>
		</div>
		<div>value: {{ value }}</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { TreeSelect } from '..';
import { Button } from '../../button';
import { Select } from '../../select';

const widths = ['120px', '240px', '360px', '100%'];
const width = ref('240px');
const CHECK_STRATEGIES = [
	{ value: 'all', label: 'all（联动，回填全部）' },
	{ value: 'parent', label: 'parent（联动，只回填父节点）' },
	{ value: 'child', label: 'child（联动，只回填子节点）' },
	{ value: 'strict', label: 'strict（父子独立）' }
];
const checkStrategy = ref('all');

const data = ['分组 A', '分组 B', '分组 C'].map((region, i) => ({
	value: `${i}`,
	label: `${region}`,
	children: ['一', '二'].map((n, j) => ({
		value: `${i}-${j}`,
		label: `第${n}示例分组`,
		children: ['条目一', '条目二', '条目三'].map((dept, k) => ({
			value: `${i}-${j}-${k}`,
			label: `${dept}`
		}))
	}))
}));

const value = ref(['0-0-0', '0-0-1', '0-1-2', '1-0-0', '1-1-1', '2-0-2']);
</script>
