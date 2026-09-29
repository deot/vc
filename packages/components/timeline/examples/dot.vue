<template>
	<div class="timeline-dot">
		<div>
			<p>dotColor / dot 插槽</p>
			<Timeline>
				<TimelineItem label="2020-04-12" dot-color="#00B42A">
					The first milestone
				</TimelineItem>
				<TimelineItem label="2020-05-17">
					The second milestone
				</TimelineItem>
				<TimelineItem label="2020-06-22">
					The third milestone
					<template #dot>
						<Icon type="warning" style="font-size: 12px; color: #F53F3F;" />
					</template>
				</TimelineItem>
				<TimelineItem label="2020-06-22" dot-color="var(--vc-color-light-deepest)">
					The fourth milestone
				</TimelineItem>
			</Timeline>
		</div>

		<div>
			<p>dot 字符串 / 函数</p>
			<Timeline>
				<TimelineItem label="2020-04-12" dot="<b style='font-size: 12px;'>✓</b>">
					dot 字符串（按 HTML 渲染）
				</TimelineItem>
				<TimelineItem label="2020-05-17" :dot="renderDot">
					dot 函数
				</TimelineItem>
				<TimelineItem label="2020-06-22">
					The third milestone
				</TimelineItem>
			</Timeline>
		</div>

		<div>
			<p>dotType</p>
			<Timeline>
				<TimelineItem label="2020-04-12" dot-type="hollow">
					hollow
				</TimelineItem>
				<TimelineItem label="2020-05-17" dot-type="hollow" dot-color="#F53F3F">
					hollow + dotColor
				</TimelineItem>
				<TimelineItem label="2020-06-22" dot-color="#F53F3F">
					solid + dotColor
				</TimelineItem>
			</Timeline>
		</div>

		<div>
			<p>lineType / lineColor</p>
			<Timeline>
				<TimelineItem label="2017-03-10" line-type="dashed">
					dashed
				</TimelineItem>
				<TimelineItem label="2018-05-12" line-type="dotted">
					dotted
				</TimelineItem>
				<TimelineItem label="2020-09-30" line-color="#00B42A">
					lineColor
				</TimelineItem>
				<TimelineItem label="2021-11-11">
					The fourth milestone
				</TimelineItem>
			</Timeline>
		</div>

		<div>
			<p>label 函数 / label 插槽</p>
			<Timeline>
				<TimelineItem :label="renderLabel">
					label 函数
				</TimelineItem>
				<TimelineItem label="被插槽覆盖">
					label 插槽优先
					<template #label>
						<span style="color: #F53F3F;">2020-05-17</span>
					</template>
				</TimelineItem>
				<TimelineItem label="2020-06-22">
					The third milestone
				</TimelineItem>
			</Timeline>
		</div>
	</div>
</template>
<script setup>
import { h } from 'vue';
import { Icon } from '../../icon';
import { Timeline, TimelineItem } from '..';

const renderDot = () => h(Icon, { type: 'success', style: 'color: #00B42A; font-size: 12px;' });
const renderLabel = () => h('span', { style: 'font-weight: bold;' }, '2020-04-12');
</script>
<style scoped>
.timeline-dot {
	display: flex;
	flex-wrap: wrap;
	gap: 40px;
	padding: 20px;
	background: var(--vc-background-color-light);
}
</style>
