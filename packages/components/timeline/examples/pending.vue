<template>
	<div style="padding: 20px; background: var(--vc-background-color-lightest);">
		<div class="controls">
			<label>
				<span>vertical</span>
				<Switch v-model="vertical" />
			</label>
			<label>
				<span>inverted</span>
				<Switch v-model="isInverted" />
			</label>
			<label>
				<span>showPending</span>
				<Switch v-model="isPendingVisible" />
			</label>
			<label>
				<span>pending 插槽</span>
				<Switch v-model="isCustomContent" />
			</label>
			<label>
				<span>pending-dot 插槽</span>
				<Switch v-model="isCustomDot" />
			</label>
		</div>
		<p>幽灵节点的轴线及与之相连的轴线为虚线；pending-dot 默认使用 Spin</p>

		<Timeline
			:vertical="vertical"
			:inverted="isInverted"
			:show-pending="isPendingVisible"
		>
			<TimelineItem label="2017-03-10" dot-color="#52C419">
				The first milestone
			</TimelineItem>
			<TimelineItem label="2018-05-12" dot-color="#F5222D">
				The second milestone
			</TimelineItem>
			<TimelineItem label="2020-09-30">
				The third milestone
			</TimelineItem>
			<template v-if="isCustomContent" #pending>
				This is a pending dot
			</template>
			<template v-if="isCustomDot" #pending-dot>
				<Icon type="warning" style="font-size: 14px; color: #e70a0a;" />
			</template>
		</Timeline>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Switch } from '../../switch';
import { Icon } from '../../icon';
import { Timeline, TimelineItem } from '..';

const vertical = ref(true);
const isInverted = ref(false);
const isPendingVisible = ref(true);
const isCustomContent = ref(false);
const isCustomDot = ref(false);
</script>
<style scoped>
.controls {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 24px;
}

.controls label {
	display: inline-flex;
	align-items: center;
	gap: 8px;
}
</style>
