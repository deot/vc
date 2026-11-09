<template>
	<div class="vcm-popup-swipe-closable-example">
		<MList header="沿弹出方向滑动关闭">
			<MListItem
				v-for="item in placements"
				:key="item"
				:label="item"
				@click="handleOpen(item)"
			/>
		</MList>

		<MList header="滚动与内嵌手势">
			<MListItem label="多个方向（下滑或右滑关闭）" @click="isMulti = true" />
			<MListItem label="长内容：滚到顶后继续下拉关闭" @click="isLong = true" />
			<MListItem label="内嵌 MCarousel（横滑不关闭）" @click="isCarousel = true" />
			<MListItem label="内嵌 MPickerView（拖动列不关闭）" @click="isPicker = true" />
		</MList>

		<MList header="不可滑动关闭">
			<MListItem label=":swipe-closable=&quot;false&quot;" @click="isOff = true" />
			<MListItem label=":mask-closable=&quot;false&quot;（随之不可滑动关闭）" @click="isMaskOff = true" />
		</MList>

		<p class="vcm-popup-swipe-closable-example__message">{{ message }}</p>

		<MPopup
			v-model="isVisible"
			:placement="placement"
			@close="handleClose"
		>
			<div :class="['vcm-popup-swipe-closable-example__panel', `is-${placement}`]">
				{{ placement }}：滑动关闭
			</div>
		</MPopup>

		<MPopup
			v-model="isMulti"
			:swipe-closable="{ directions: ['bottom', 'right'] }"
			title="多个方向"
			content="向下或向右滑动关闭；拖动不到 30% 时回弹。"
			@close="handleClose"
		/>

		<MPopup
			v-model="isLong"
			title="长内容"
			closable
			@close="handleClose"
		>
			<div v-for="item in 40" :key="item" class="vcm-popup-swipe-closable-example__row">第 {{ item }} 行</div>
		</MPopup>

		<MPopup v-model="isCarousel" title="内嵌 MCarousel" @close="handleClose">
			<MCarousel :height="240" :autoplay="false" dots="bottom">
				<MCarouselItem v-for="item in 4" :key="item">
					<div class="vcm-popup-swipe-closable-example__slide">{{ item }}</div>
				</MCarouselItem>
			</MCarousel>
		</MPopup>

		<MPopup v-model="isPicker" title="内嵌 MPickerView" @close="handleClose">
			<MPickerView v-model="pickerValue" :data="pickerData" />
		</MPopup>

		<MPopup
			v-model="isOff"
			:swipe-closable="false"
			title="不可滑动关闭"
			content="拖动面板不会移动，点击遮罩仍可关闭。"
			@close="handleClose"
		/>

		<MPopup
			v-model="isMaskOff"
			:mask-closable="false"
			title="遮罩不可关闭"
			content="不设置 swipeClosable 时跟随 maskClosable：点击遮罩与滑动都不会关闭，只能用关闭按钮。"
			closable
			@close="handleClose"
		/>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MPopup } from '../index.m';
import { MList, MListItem } from '../../list/index.m';
import { MCarousel, MCarouselItem } from '../../carousel/index.m';
import { MPickerView } from '../../picker/index.m';

const placements = ['bottom', 'top', 'left', 'right'];
const placement = ref('bottom');
const isVisible = ref(false);
const isMulti = ref(false);
const isLong = ref(false);
const isCarousel = ref(false);
const isPicker = ref(false);
const isOff = ref(false);
const isMaskOff = ref(false);
const message = ref('');
const pickerValue = ref([]);
const pickerData = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `选项 ${i + 1}` }));

const handleOpen = (v) => {
	placement.value = v;
	isVisible.value = true;
};

const handleClose = () => {
	message.value = `已关闭（${new Date().toLocaleTimeString()}）`;
};
</script>
<style lang="scss">
.vcm-popup-swipe-closable-example {
	min-height: 100vh;
	padding: 12px 0;
	background: var(--vc-background-color-light);

	&__message {
		padding: 0 16px;
		color: var(--vc-color-dark-lighter);
	}

	&__panel {
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;

		&.is-bottom, &.is-top {
			height: 240px;
		}

		&.is-left, &.is-right {
			width: 240px;
			height: 100%;
		}
	}

	&__row {
		line-height: 2;
	}

	&__slide {
		display: flex;
		height: 100%;
		font-size: 32px;
		color: var(--vc-color-contrast-light);
		background: var(--vc-color-primary);
		align-items: center;
		justify-content: center;
	}
}
</style>
