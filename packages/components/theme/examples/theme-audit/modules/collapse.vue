<template>
	<div class="audit-stack">
		<p class="audit-hint">展开、收起与手风琴；继承主题。组件没有独立禁用属性。</p>
		<Collapse v-model="opened">
			<CollapseItem v-for="item in 3" :key="item" :value="item">
				<div class="audit-utility-heading">可展开标题 {{ item }}</div>
				<template #content><div class="audit-utility-surface">展开内容 {{ item }}</div></template>
			</CollapseItem>
		</Collapse>
		<Collapse v-model="accordion" accordion>
			<CollapseItem v-for="item in 2" :key="item" :value="item">
				<div class="audit-utility-heading">手风琴 {{ item }}</div>
				<template #content><div class="audit-utility-surface">只展开一项</div></template>
			</CollapseItem>
		</Collapse>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Collapse, CollapseItem } from '@deot/vc';

const opened = ref([1]);
const accordion = ref(1);
</script>
