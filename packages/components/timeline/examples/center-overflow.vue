<template>
	<div style="padding: 20px; background: var(--vc-background-color-light);">
		<div class="controls">
			<span>容器宽度：</span>
			<Button
				v-for="item in widths"
				:key="item"
				@click="width = item"
			>
				{{ item }}px{{ width === item ? ' ✓' : '' }}
			</Button>
			<label>
				<span>alternate</span>
				<Switch v-model="alternate" />
			</label>
			<label>
				<span>opposite</span>
				<Switch v-model="opposite" />
			</label>
		</div>
		<p>
			align="center"（或 alternate）时，节点中心位于中线，内容区与标签各占一侧，不超出容器（虚线框），与节点的间距均为 16px。
			#2 为不含空格的长串，自动断行
		</p>

		<div ref="wrapper" :style="{ width: width + 'px' }" class="frame">
			<Timeline align="center" :alternate="alternate" :opposite="opposite">
				<TimelineItem label="2017-03-10 标签也很长的时候会怎样">
					The first milestone with a long description that wraps across multiple lines
				</TimelineItem>
				<TimelineItem label="2018-05-12">
					kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk
				</TimelineItem>
				<TimelineItem label="2020-09-30">
					这是一段比较长的中文描述，用来观察内容区在居中模式下的宽度和换行位置
				</TimelineItem>
				<TimelineItem label="2021-11-11">
					Short
				</TimelineItem>
			</Timeline>
		</div>

		<table class="metrics">
			<thead>
				<tr>
					<th>项</th>
					<th>内容所在侧</th>
					<th>内容与节点间距</th>
					<th>标签与节点间距（opposite）</th>
					<th>内容区超出容器</th>
					<th>文字溢出内容区</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(row, index) in metrics" :key="index">
					<td>#{{ index + 1 }}</td>
					<td>{{ row.side }}</td>
					<td :class="{ 'is-bad': row.gap !== 16 }">
						{{ row.gap }}px
					</td>
					<td :class="{ 'is-bad': row.labelGap !== null && row.labelGap !== 16 }">
						{{ row.labelGap === null ? '-' : row.labelGap + 'px' }}
					</td>
					<td :class="{ 'is-bad': row.overflow > 0 }">
						{{ row.overflow > 0 ? row.overflow + 'px' : '-' }}
					</td>
					<td :class="{ 'is-bad': row.textOverflow > 0 }">
						{{ row.textOverflow > 0 ? row.textOverflow + 'px' : '-' }}
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { Button } from '../../button';
import { Switch } from '../../switch';
import { Timeline, TimelineItem } from '..';

const widths = [300, 400, 600];
const width = ref(400);
const alternate = ref(true);
const opposite = ref(false);
const wrapper = ref();
const metrics = ref([]);

const measure = async () => {
	await nextTick();
	const timeline = wrapper.value.querySelector('.vc-timeline');
	const box = timeline.getBoundingClientRect();
	metrics.value = [...timeline.children].map((item) => {
		const dot = item.querySelector('.vc-timeline-item__dot').getBoundingClientRect();
		const contentEl = item.querySelector('.vc-timeline-item__content');
		const content = contentEl.getBoundingClientRect();
		const cw = item.querySelector('.vc-timeline-item__content-wrapper').getBoundingClientRect();
		const labelEl = item.querySelector(':scope > .vc-timeline-item__label');
		const isEnd = item.classList.contains('is-end');
		let labelGap = null;
		if (labelEl) {
			const label = labelEl.getBoundingClientRect();
			const style = getComputedStyle(labelEl);
			// 标签在内容的另一侧，按文字区域（去掉内边距）计算
			labelGap = Math.round(isEnd
				? label.left + parseFloat(style.paddingLeft) - dot.right
				: dot.left - (label.right - parseFloat(style.paddingRight)));
		}
		return {
			side: isEnd ? '左（is-end）' : '右（is-start）',
			gap: Math.round(isEnd ? dot.left - content.right : content.left - dot.right),
			labelGap,
			overflow: Math.round(Math.max(cw.right - box.right, box.left - cw.left)),
			textOverflow: contentEl.scrollWidth - contentEl.clientWidth
		};
	});
};

watch([width, alternate, opposite], measure);
onMounted(measure);
</script>
<style scoped>
.controls {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
}

.controls label {
	display: inline-flex;
	align-items: center;
	gap: 8px;
}

.frame {
	outline: 1px dashed #f04134;
}

.metrics {
	margin-top: 16px;
	font-size: 13px;
	border-collapse: collapse;
}

.metrics th,
.metrics td {
	padding: 4px 12px;
	text-align: left;
	border: 1px solid #ebedef;
}

.metrics .is-bad {
	color: #f04134;
}
</style>
