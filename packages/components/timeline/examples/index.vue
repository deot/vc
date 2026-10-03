<template>
	<div style="padding: 20px; background: var(--vc-background-color-lightest);">
		<div style="margin-bottom: 40px;">
			<span style="margin-right: 8px;">inverted</span>
			<Switch v-model="isInverted" />
		</div>
		<Timeline :inverted="isInverted">
			<TimelineItem label="2017-03-10">
				The first milestone
			</TimelineItem>
			<TimelineItem label="2018-05-12">
				The second milestone
			</TimelineItem>
			<TimelineItem label="2020-09-30">
				The third milestone
			</TimelineItem>
		</Timeline>

		<p>v-for 生成的节点（与静态节点混排）同样参与倒序</p>
		<Timeline :inverted="isInverted">
			<TimelineItem label="静态节点">
				Static
			</TimelineItem>
			<TimelineItem
				v-for="item in list"
				:key="item.label"
				:label="item.label"
			>
				{{ item.content }}
			</TimelineItem>
		</Timeline>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Switch } from '../../switch';
import { Timeline, TimelineItem } from '..';

const isInverted = ref(false);
const list = [
	{ label: 'v-for 1', content: 'Loop 1' },
	{ label: 'v-for 2', content: 'Loop 2' }
];
</script>
