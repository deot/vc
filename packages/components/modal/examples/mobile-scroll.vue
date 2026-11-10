<template>
	<div class="vcm-modal-scroll-example">
		<MList header="触摸滚动不外溢">
			<MListItem label="长内容：内容区滚到边界后页面不随之滚动" @click="isLong = true" />
			<MListItem label="短内容：在遮罩或弹窗上拖动，页面不滚动" @click="isShort = true" />
		</MList>
		<p v-for="item in 40" :key="item" class="vcm-modal-scroll-example__row">页面第 {{ item }} 行</p>

		<MModalView v-model="isLong" title="长内容">
			<p v-for="item in 40" :key="item" class="vcm-modal-scroll-example__row">内容第 {{ item }} 行</p>
		</MModalView>
		<MModalView v-model="isShort" title="短内容" content="在这里或遮罩上上下拖动，后面的页面保持不动。" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MModalView } from '../index.m';
import { MList, MListItem } from '../../list/index.m';

const isLong = ref(false);
const isShort = ref(false);
</script>
<style lang="scss">
.vcm-modal-scroll-example {
	padding: 12px 0;
	background: var(--vc-background-color-light);

	&__row {
		padding: 0 16px;
		margin: 0;
		line-height: 2;
	}
}
</style>
