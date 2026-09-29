<template>
	<div style="padding: 20px; background: var(--vc-background-color-light);">
		<div class="controls">
			<label>
				<span>vertical</span>
				<Switch v-model="options.vertical" />
			</label>
			<label>
				<span>alternate</span>
				<Switch v-model="options.alternate" />
			</label>
			<label>
				<span>opposite</span>
				<Switch v-model="options.opposite" />
			</label>
			<RadioGroup v-model="options.align" :disabled="options.alternate">
				<Radio value="start">
					start
				</Radio>
				<Radio value="center">
					center
				</Radio>
				<Radio value="end">
					end
				</Radio>
			</RadioGroup>
		</div>
		<p>align 表示轴线位置：纵向 start 为左、end 为右；横向 start 为上、end 为下。alternate 时轴线强制居中，align 不生效</p>

		<Timeline v-bind="options">
			<TimelineItem label="2017-03-10">
				The first milestone
			</TimelineItem>
			<TimelineItem label="2018-05-12">
				The second milestone
			</TimelineItem>
			<TimelineItem label="2020-09-30">
				The third milestone
			</TimelineItem>
			<TimelineItem label="2021-11-11">
				The fourth milestone
			</TimelineItem>
		</Timeline>

		<p>TimelineItem 单独设置 opposite：第二项为 :opposite="!opposite"，其余继承 Timeline</p>
		<Timeline v-bind="options">
			<TimelineItem label="2017-03-10" dot-color="#52C419">
				The first milestone
			</TimelineItem>
			<TimelineItem label="2018-05-12" dot-color="#F5222D" :opposite="!options.opposite">
				The second milestone
			</TimelineItem>
			<TimelineItem label="2020-09-30">
				The third milestone
			</TimelineItem>
		</Timeline>
	</div>
</template>
<script setup>
import { reactive } from 'vue';
import { Switch } from '../../switch';
import { Radio, RadioGroup } from '../../radio';
import { Timeline, TimelineItem } from '..';

const options = reactive({
	vertical: true,
	alternate: false,
	opposite: false,
	align: 'start'
});
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
