<template>
	<div style="padding: 24px">
		<div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px">
			<label>方向 <select v-model="placement"><option v-for="value in placements" :key="value">{{ value }}</option></select></label>
			<label><input v-model="isInteractionDisabled" type="checkbox"> 禁止目标交互</label>
			<label><input v-model="isDotProgress" type="checkbox"> 圆点进度</label>
			<Button @click="handleOpen">打开静态引导</Button>
			<Button @click="handleLongContent">长内容引导</Button>
		</div>
		<div ref="scrollContainer" style="height: 260px; overflow: auto; border: 1px solid var(--vc-border-color); padding: 16px">
			<div style="height: 120px">嵌套滚动容器：引导跟随目标定位</div>
			<Button ref="targetButton" @click.stop="handleTargetClick">可点击目标（{{ clickCount }}）</Button>
			<div v-if="isTargetVisible" ref="delayedTarget" style="padding: 20px">延迟出现的目标</div>
			<div style="height: 400px" />
		</div>
		<p>结果：{{ resultType }}</p>
	</div>
</template>
<script setup>
import { ref, h, onBeforeUnmount } from 'vue';
import { Button } from '../../button';
import { Tour } from '..';

const placement = ref('bottom');
const placements = [
	'top', 'top-left', 'top-right', 'bottom', 'bottom-left', 'bottom-right',
	'left', 'left-top', 'left-bottom', 'right', 'right-top', 'right-bottom'
];
const isInteractionDisabled = ref(false);
const isDotProgress = ref(false);
const targetButton = ref();
const delayedTarget = ref();
const scrollContainer = ref();
const isTargetVisible = ref(false);
const clickCount = ref(0);
const resultType = ref('');
let tourLeaf;
let delayTimer;
const handleTargetClick = () => { clickCount.value++; };
const handleLongContent = async () => {
	clearTimeout(delayTimer);
	const content = () => h('div', [
		...Array.from({ length: 20 }, (_, index) => h('p', `说明 ${index + 1}：长内容仅在正文区域滚动，标题和底部操作保持固定。`)),
		h('p', '正文结束')
	]);
	tourLeaf = Tour.open({
		placement: placement.value,
		steps: [
			{ element: () => targetButton.value?.$el, title: '目标步骤的长内容', content },
			{ title: '居中步骤的长内容', content }
		]
	});
	resultType.value = (await tourLeaf).type;
};
const handleOpen = async () => {
	clearTimeout(delayTimer);
	isTargetVisible.value = false;
	tourLeaf = Tour.open({
		placement: placement.value,
		disableActiveInteraction: isInteractionDisabled.value,
		progressType: isDotProgress.value ? 'dot' : 'number',
		advanceOnClick: true,
		maskClickBehavior: 'next',
		steps: [
			{
				element: () => targetButton.value?.$el,
				title: '目标交互',
				content: () => h('div', [
					h('p', '点击目标或蒙层推进。下一步异步检查完成后，等待新目标出现。'),
					h(Button, { onClick: () => { scrollContainer.value.scrollTop += 60; } }, () => '滚动容器')
				])
			},
			{ element: () => delayedTarget.value, title: '等待目标', content: '延迟目标会自动出现。', waitForElement: 2000 },
			{ element: '#tour-example-missing', skipMissingElement: true },
			{ title: '居中内容', content: '长内容支持滚动。'.repeat(150) }
		],
		nextButtonOptions: {
			onClick: (event, { current }) => current === 0
				? new Promise((resolve) => {
						delayTimer = setTimeout(() => { isTargetVisible.value = true; resolve(); }, 600);
					})
				: true
		}
	});
	resultType.value = (await tourLeaf).type;
};
onBeforeUnmount(() => { clearTimeout(delayTimer); tourLeaf?.destroy(); });
</script>
