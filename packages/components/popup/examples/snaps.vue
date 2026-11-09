<template>
	<div class="vcm-popup-snaps-example">
		<MList header="多档高度">
			<MListItem label="50% → 100%（上拉全屏）" @click="isList = true" />
			<MListItem label="50% → calc(100% - 40px)（顶部留白）" @click="isGap = true" />
			<MListItem label="自定义指示器（#handle）与 contentClass" @click="isCustom = true" />
			<MListItem label="三档 [400, 60%, 100%] + footer" :extra="`snap: ${snap}`" @click="isThree = true" />
			<MListItem label="内容很少：只有一档" @click="isShort = true" />
			<MListItem label="不可下拉关闭（:swipe-closable=&quot;false&quot;）：最低档回弹" @click="isSwipe = true" />
			<MListItem label="top 弹出" @click="isTop = true" />
		</MList>

		<p class="vcm-popup-snaps-example__message">{{ message }}</p>

		<MPopup v-model="isList" :snaps="['50%', '100%']" title="上拉全屏" closable>
			<div v-for="item in 60" :key="item" class="vcm-popup-snaps-example__row">第 {{ item }} 行</div>
		</MPopup>

		<MPopup v-model="isGap" :snaps="['50%', 'calc(100% - 40px)']" title="顶部留白" closable>
			<div v-for="item in 60" :key="item" class="vcm-popup-snaps-example__row">第 {{ item }} 行</div>
		</MPopup>

		<MPopup
			v-model="isCustom"
			:snaps="['50%', 'calc(100% - 40px)']"
			title="自定义指示器"
			content-class="vcm-popup-snaps-example__content"
		>
			<template #handle>
				<span class="vcm-popup-snaps-example__handle">上拉查看更多</span>
			</template>
			<div v-for="item in 60" :key="item" class="vcm-popup-snaps-example__row">第 {{ item }} 行</div>
		</MPopup>

		<MPopup
			v-model="isThree"
			v-model:snap="snap"
			:snaps="[400, '60%', '100%']"
			title="三档"
			@update:snap="handleSnap"
		>
			<div v-for="item in 40" :key="item" class="vcm-popup-snaps-example__row">第 {{ item }} 行</div>
			<template #footer>
				<div class="vcm-popup-snaps-example__footer">
					<MButton @click="snap = 0">最低档</MButton>
					<MButton type="primary" @click="snap = 2">最高档</MButton>
				</div>
			</template>
		</MPopup>

		<MPopup v-model="isShort" :snaps="['50%', '100%']" title="内容很少" content="内容比最低一档还矮时只有一档，面板就是内容的高度，不能上拉。" />

		<MPopup v-model="isSwipe" :snaps="['40%', '100%']" :swipe-closable="false" title="不可下拉关闭">
			<div v-for="item in 40" :key="item" class="vcm-popup-snaps-example__row">第 {{ item }} 行</div>
		</MPopup>

		<MPopup v-model="isTop" placement="top" :snaps="['40%', '100%']" title="top 弹出">
			<div v-for="item in 40" :key="item" class="vcm-popup-snaps-example__row">第 {{ item }} 行</div>
		</MPopup>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MPopup } from '../index.m';
import { MButton } from '../../button/index.m';
import { MList, MListItem } from '../../list/index.m';

const isList = ref(false);
const isGap = ref(false);
const isCustom = ref(false);
const isThree = ref(false);
const isShort = ref(false);
const isSwipe = ref(false);
const isTop = ref(false);
const snap = ref(0);
const message = ref('');

const handleSnap = (v) => {
	message.value = `update:snap ${v}`;
};
</script>
<style lang="scss">
.vcm-popup-snaps-example {
	min-height: 100vh;
	padding: 12px 0;
	background: var(--vc-background-color-light);

	&__message {
		padding: 0 16px;
		color: var(--vc-color-dark-lighter);
	}

	&__row {
		line-height: 2;
	}

	&__content {
		background: var(--vc-background-color-light);
	}

	&__handle {
		font-size: 12px;
		color: var(--vc-color-dark-lighter);
	}

	&__footer {
		display: flex;
		gap: 12px;

		> * {
			flex: 1;
		}
	}
}
</style>
