<template>
	<div style="padding: 20px; background: var(--vc-background-color-light);">
		<div class="controls">
			<label>
				<span>vertical</span>
				<Switch v-model="vertical" />
			</label>
			<label>
				<span>inverted</span>
				<Switch v-model="inverted" />
			</label>
			<label>
				<span>showPending</span>
				<Switch v-model="showPending" />
			</label>
			<label>
				<span>pending 插槽</span>
				<Switch v-model="customContent" />
			</label>
			<label>
				<span>pending-dot 插槽</span>
				<Switch v-model="customDot" />
			</label>
		</div>
		<p>幽灵节点的轴线及与之相连的轴线为虚线；pending-dot 默认使用 Spin</p>

		<Timeline
			:vertical="vertical"
			:inverted="inverted"
			:show-pending="showPending"
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
			<template v-if="customContent" #pending>
				This is a pending dot
			</template>
			<template v-if="customDot" #pending-dot>
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
const inverted = ref(false);
const showPending = ref(true);
const customContent = ref(false);
const customDot = ref(false);
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
