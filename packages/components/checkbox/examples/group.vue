<template>
	<div class="demo">
		<p>shape：方形（默认）与圆形</p>
		<CheckboxGroup v-model="shape">
			<Checkbox value="a" label="方形" />
			<Checkbox value="b" label="圆形" shape="circle" />
			<Checkbox value="c" label="圆形半选" shape="circle" indeterminate />
		</CheckboxGroup>

		<p>vertical：纵向排列</p>
		<CheckboxGroup v-model="vertical" vertical>
			<Checkbox value="a" label="选项 1" />
			<Checkbox value="b" label="选项 2" />
			<Checkbox value="c" label="选项 3" />
		</CheckboxGroup>

		<p>max：最多可选两项，达到上限后未选中的项禁用（已选 {{ limited.length }} 项）</p>
		<CheckboxGroup v-model="limited" :max="2">
			<Checkbox value="a" label="选项 1" />
			<Checkbox value="b" label="选项 2" />
			<Checkbox value="c" label="选项 3" />
			<Checkbox value="d" label="选项 4" />
		</CheckboxGroup>

		<p>disabled：整组禁用</p>
		<CheckboxGroup :model-value="['a']" disabled>
			<Checkbox value="a" label="选项 1" />
			<Checkbox value="b" label="选项 2" />
		</CheckboxGroup>

		<p>#icon：分组统一替换图标，选项自身的插槽优先</p>
		<CheckboxGroup v-model="custom">
			<template #icon="{ checked, disabled }">
				<span class="demo__icon" :class="{ 'is-on': checked, 'is-disabled': disabled }">{{ checked ? '★' : '☆' }}</span>
			</template>
			<Checkbox value="a" label="选项 1" />
			<Checkbox value="b" label="选项 2" />
			<Checkbox value="c" label="选项 3（自身插槽）">
				<template #icon="{ checked }">
					<span class="demo__icon" :class="{ 'is-on': checked }">{{ checked ? '●' : '○' }}</span>
				</template>
			</Checkbox>
		</CheckboxGroup>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Checkbox, CheckboxGroup } from '..';

const shape = ref(['a', 'b']);
const vertical = ref(['b']);
const limited = ref(['a', 'b']);
const custom = ref(['a', 'c']);
</script>
<style scoped>
.demo p {
	margin: 16px 0 4px;
	font-size: 12px;
	color: #86909c;
}

.demo__icon {
	font-size: 14px;
	line-height: 1;
	color: #c9cdd4;
}

.demo__icon.is-on {
	color: #456cf6;
}

.demo__icon.is-disabled {
	opacity: .5;
}
</style>
