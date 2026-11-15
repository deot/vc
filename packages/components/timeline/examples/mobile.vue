<template>
	<div class="m-timeline-demo">
		<div class="m-timeline-demo__title">
			基础用法（375 宽下内容 14、标签 12、节点 8，与 MSteps 纵向圆点一致）
		</div>
		<div class="m-timeline-demo__card">
			<MTimeline>
				<MTimelineItem label="09-01 10:00">
					已下单
				</MTimelineItem>
				<MTimelineItem label="09-01 18:30">
					{{ text }}
				</MTimelineItem>
				<MTimelineItem label="09-02 08:00">
					派送中
				</MTimelineItem>
			</MTimeline>
		</div>

		<div class="m-timeline-demo__title">
			节点颜色、空心、自定义节点
		</div>
		<div class="m-timeline-demo__card">
			<MTimeline>
				<MTimelineItem label="09-01" dot-color="var(--vc-color-success)">
					已完成
				</MTimelineItem>
				<MTimelineItem label="09-02" dot-type="hollow">
					空心节点
				</MTimelineItem>
				<MTimelineItem label="09-03">
					自定义节点
					<template #dot>
						<MIcon type="warning" style="font-size: calc(var(--vc-rem) * 24); color: var(--vc-color-error);" />
					</template>
				</MTimelineItem>
				<MTimelineItem label="09-04" dot-color="var(--vc-color-light-deepest)">
					未开始
				</MTimelineItem>
			</MTimeline>
		</div>

		<div class="m-timeline-demo__title">
			幽灵节点（show-pending，默认 Spin）
		</div>
		<div class="m-timeline-demo__card">
			<MTimeline show-pending>
				<MTimelineItem label="09-01">
					已提交
				</MTimelineItem>
				<MTimelineItem label="09-02">
					审核中
				</MTimelineItem>
				<template #pending>
					等待处理
				</template>
			</MTimeline>
		</div>

		<div class="m-timeline-demo__title">
			标签在另一侧（opposite）
		</div>
		<div class="m-timeline-demo__card">
			<MTimeline opposite>
				<MTimelineItem label="09-01">
					已下单
				</MTimelineItem>
				<MTimelineItem label="09-02">
					已发货
				</MTimelineItem>
				<MTimelineItem label="09-03">
					已签收
				</MTimelineItem>
			</MTimeline>
		</div>

		<div class="m-timeline-demo__title">
			交替（alternate）
		</div>
		<div class="m-timeline-demo__card">
			<MTimeline alternate>
				<MTimelineItem label="09-01">
					已下单
				</MTimelineItem>
				<MTimelineItem label="09-02">
					已发货
				</MTimelineItem>
				<MTimelineItem label="09-03">
					已签收
				</MTimelineItem>
			</MTimeline>
		</div>

		<div class="m-timeline-demo__title">
			横向
		</div>
		<div class="m-timeline-demo__card">
			<MTimeline :vertical="false">
				<MTimelineItem label="09-01">
					已下单
				</MTimelineItem>
				<MTimelineItem label="09-02">
					已发货
				</MTimelineItem>
				<MTimelineItem label="09-03">
					已签收
				</MTimelineItem>
			</MTimeline>
		</div>
	</div>
</template>

<script setup>
import { MTimeline, MTimelineItem } from '../index.m';
import { MIcon } from '../../icon/index.m';

const text = '包裹已到达转运中心，正在发往下一站，内容较长时自动换行，与下一项之间保持间距。';
</script>

<style lang="scss">
.m-timeline-demo {
	min-height: 100vh;
	padding-bottom: 24px;
	background: var(--vc-background-color-light);

	&__title {
		padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-extralight);
	}

	&__card {
		padding: calc(var(--vc-rem) * 32);
		background: var(--vc-background-color-lightest);
	}
}
</style>
