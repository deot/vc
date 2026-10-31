<template>
	<div class="v-collapse">
		<div class="v-collapse__controls">
			<Checkbox v-model="styleless">styleless</Checkbox>
			<Checkbox v-model="border">border</Checkbox>
			<Checkbox v-model="disabled">disabled</Checkbox>
			<Checkbox v-model="accordion">accordion</Checkbox>
			<Checkbox v-model="collapsible">collapsible</Checkbox>
			<Checkbox v-model="alive">alive</Checkbox>
			<Checkbox v-model="plain">contentStyle 去灰底</Checkbox>
		</div>
		<div class="v-collapse__controls">
			<span>arrow</span>
			<RadioGroup v-model="arrow">
				<Radio value="right">right</Radio>
				<Radio value="left">left</Radio>
				<Radio :value="false">false</Radio>
			</RadioGroup>
		</div>
		<div class="v-collapse__controls">
			<span>triggerRegion</span>
			<RadioGroup v-model="triggerRegion">
				<Radio value="header">header</Radio>
				<Radio value="arrow">arrow</Radio>
			</RadioGroup>
		</div>

		<Collapse
			v-model="value"
			:class="{ 'is-custom': styleless }"
			:styleless="styleless"
			:border="border"
			:disabled="disabled"
			:accordion="accordion"
			:collapsible="collapsible"
			:alive="alive"
			:arrow="arrow"
			:trigger-region="triggerRegion"
			:content-style="plain ? { background: 'transparent' } : undefined"
		>
			<!-- title 属性 -->
			<CollapseItem :value="1" title="title 属性">
				<template #content>
					<div class="v-collapse__content">
						<Input v-model="text" placeholder="alive 为 false 时收起会重置" />
					</div>
				</template>
			</CollapseItem>
			<!-- 默认插槽接收 visible；extra 属性 -->
			<CollapseItem :value="2" extra="extra 属性">
				<template #default="{ visible }">
					<div class="v-collapse__head">
						默认插槽（{{ visible ? '展开' : '收起' }}）
					</div>
				</template>
				<template #content>
					<div class="v-collapse__content">
						content2
					</div>
				</template>
			</CollapseItem>
			<!-- extra 插槽，点击不切换 -->
			<CollapseItem :value="3" title="extra 插槽">
				<template #extra="{ visible }">
					<Button size="small" @click="count++">
						{{ visible ? '展开中' : '收起中' }} · {{ count }}
					</Button>
				</template>
				<template #content>
					<div class="v-collapse__content">
						点击按钮不会切换
					</div>
				</template>
			</CollapseItem>
			<!-- arrow 插槽，styleless 下同样生效 -->
			<CollapseItem :value="4" title="arrow 插槽">
				<template #arrow="{ visible }">
					<span class="v-collapse__arrow">{{ visible ? '−' : '+' }}</span>
				</template>
				<template #content>
					<div class="v-collapse__content">
						content4
					</div>
				</template>
			</CollapseItem>
			<!-- 单项覆盖 -->
			<CollapseItem :value="5" title="单项 arrow=left / alive=true" arrow="left" :alive="true">
				<template #content>
					<div class="v-collapse__content">
						<Input v-model="kept" placeholder="此项始终保留内容" />
					</div>
				</template>
			</CollapseItem>
			<CollapseItem :value="7" title="单项 collapsible=false" :collapsible="false">
				<template #content>
					<div class="v-collapse__content">
						展开后不能收起
					</div>
				</template>
			</CollapseItem>
			<CollapseItem :value="6" title="单项 disabled" extra="不可展开" disabled>
				<template #content>
					<div class="v-collapse__content">
						content6
					</div>
				</template>
			</CollapseItem>
		</Collapse>
		<p>value: {{ value }}</p>
	</div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { Collapse, CollapseItem } from '..';
import { Button } from '../../button';
import { Checkbox } from '../../checkbox';
import { Input } from '../../input';
import { Radio, RadioGroup } from '../../radio';

const styleless = ref(false);
const border = ref(true);
const disabled = ref(false);
const accordion = ref(false);
const collapsible = ref(true);
const alive = ref(true);
const arrow = ref('left');
const triggerRegion = ref('header');
const plain = ref(false);

const value = ref([1]);
const text = ref('');
const kept = ref('');
const count = ref(0);

// 切换手风琴时转换绑定值的形态：普通模式为数组，手风琴为单个标识
watch(accordion, (v) => {
	value.value = v
		? (Array.isArray(value.value) ? value.value.at(-1) : value.value)
		: (typeof value.value === 'undefined' ? [] : [value.value]);
});
</script>

<style lang="scss">
.v-collapse {
	max-width: 640px;
	padding: 20px;
	margin: 0 auto;

	&__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		margin-bottom: 12px;
		font-size: 12px;
		align-items: center;
	}

	&__arrow {
		width: 16px;
		font-size: 16px;
		text-align: center;
	}

	// styleless 下由使用方提供外观：标题区域没有类名，以 CollapseItem 的直接子元素定位
	.is-custom > div {
		border-bottom: 1px dashed #c0c4cc;

		> div:first-child {
			display: flex;
			padding: 10px 0;
			cursor: pointer;
			align-items: center;
			justify-content: space-between;
		}
	}

	.is-custom .v-collapse__content {
		padding: 0 0 10px;
	}
}
</style>
