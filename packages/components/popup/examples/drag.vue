<template>
	<div class="vcm-popup-drag-example">
		<MList header="拖动事件与插槽参数">
			<MListItem label="多档：上拉时横幅渐隐，标题随档位变化" @click="isSnaps = true" />
			<MListItem label="没有 snaps：下滑关闭的进度" @click="isSwipe = true" />
		</MList>

		<p class="vcm-popup-drag-example__message">{{ message }}</p>

		<MPopup
			v-model="isSnaps"
			:snaps="['50%', '100%']"
			@dragstart="handleStart"
			@drag="handleDrag"
			@dragend="handleEnd"
			@update:snap="handleSnap"
		>
			<template #header="{ snap, full }">
				{{ full ? '已全屏' : `第 ${snap + 1} 档，上拉查看全部` }}
			</template>
			<div ref="banner" class="vcm-popup-drag-example__banner">横幅随上拉渐隐</div>
			<p ref="readout" class="vcm-popup-drag-example__readout">拖动面板查看 drag 的参数</p>
			<div v-for="item in 60" :key="item" class="vcm-popup-drag-example__row">第 {{ item }} 行</div>
			<template #footer="{ snap, dragging, next, close }">
				<div class="vcm-popup-drag-example__footer">
					<MButton :disabled="dragging" @click="close">关闭</MButton>
					<MButton type="primary" :disabled="dragging" @click="next">
						{{ dragging ? '拖动中' : snap ? '回到最低档' : '展开' }}
					</MButton>
				</div>
			</template>
		</MPopup>

		<MPopup
			v-model="isSwipe"
			title="下滑关闭"
			@drag="handleSwipe"
			@dragend="handleSwipeEnd"
		>
			<p ref="swipeReadout" class="vcm-popup-drag-example__readout">向下拖动面板</p>
			<div class="vcm-popup-drag-example__bar">
				<div ref="bar" class="vcm-popup-drag-example__bar-inner" />
			</div>
		</MPopup>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MPopup } from '../index.m';
import { MButton } from '../../button/index.m';
import { MList, MListItem } from '../../list/index.m';

const isSnaps = ref(false);
const isSwipe = ref(false);
const message = ref('');
const banner = ref();
const readout = ref();
const swipeReadout = ref();
const bar = ref();

const EASE = '300ms cubic-bezier(0.34, 0.69, 0.1, 1)';

// drag 每帧触发：直接写元素的样式与文本，不写入响应式数据
const setBanner = (progress, animated) => {
	const el = banner.value;
	if (!el) return;
	el.style.transition = animated ? `opacity ${EASE}` : 'none';
	el.style.opacity = `${1 - Math.min(1, Math.max(0, progress))}`;
};

const format = (e) => {
	const values = [`height ${Math.round(e.height)}`, `offset ${Math.round(e.offset)}`, `progress ${e.progress.toFixed(2)}`];
	return [...values, e.direction, `${Math.round(e.velocity)}px/s`].join(' · ');
};

const handleStart = (e) => {
	message.value = `dragstart：snap ${e.snap}，height ${Math.round(e.height)}`;
};

const handleDrag = (e) => {
	setBanner(e.progress, false);
	readout.value && (readout.value.textContent = format(e));
};

const handleEnd = (e) => {
	setBanner(e.progress, true);
	message.value = `dragend：snap ${e.snap}，close ${e.close}，progress ${e.progress.toFixed(2)}`;
};

// 点击按钮切换档位不触发拖动事件：档位变化后再同步
const handleSnap = v => setBanner(v, true);

const handleSwipe = (e) => {
	swipeReadout.value && (swipeReadout.value.textContent = format(e));
	if (!bar.value) return;
	bar.value.style.transition = 'none';
	bar.value.style.transform = `scaleX(${-e.progress})`;
};

const handleSwipeEnd = (e) => {
	message.value = `dragend：close ${e.close}，progress ${e.progress}`;
	if (!bar.value) return;
	bar.value.style.transition = `transform ${EASE}`;
	bar.value.style.transform = `scaleX(${-e.progress})`;
};
</script>
<style lang="scss">
.vcm-popup-drag-example {
	min-height: 100vh;
	padding: 12px 0;
	background: var(--vc-background-color-light);

	&__message {
		padding: 0 16px;
		color: var(--vc-color-dark-lighter);
	}

	&__banner {
		padding: 24px 0;
		margin-bottom: 12px;
		text-align: center;
		background: var(--vc-background-color-light);
		border-radius: 8px;
	}

	&__readout {
		margin: 0 0 12px;
		font-size: 12px;
		color: var(--vc-color-dark-lighter);
	}

	&__row {
		line-height: 2;
	}

	&__footer {
		display: flex;
		gap: 12px;

		> * {
			flex: 1;
		}
	}

	&__bar {
		height: 4px;
		margin: 0 16px 24px;
		overflow: hidden;
		background: var(--vc-background-color-light);
		border-radius: 2px;
	}

	&__bar-inner {
		height: 100%;
		background: var(--vc-color-primary);
		transform: scaleX(0);
		transform-origin: left;
	}
}
</style>
