<template>
	<div class="scroller-mobile">
		<p>数字 height 为 750 稿长度，可用右上角的 rem 按钮切换 --vc-rem 观察缩放</p>

		<h3>默认：原生滚动条</h3>
		<MScroller :height="400" class="scroller-mobile__box">
			<div v-for="item in 20" :key="item" class="scroller-mobile__row" @click="handleClick(item)">
				条目 {{ item }}
			</div>
		</MScroller>

		<h3>always：常显的指示条</h3>
		<p>指示条不响应点按，下方的内容可以点到（最近点击：{{ current || '-' }}）</p>
		<MScroller :height="400" always class="scroller-mobile__box">
			<div v-for="item in 20" :key="item" class="scroller-mobile__row" @click="handleClick(item)">
				条目 {{ item }}
			</div>
		</MScroller>

		<h3>always + 横向</h3>
		<MScroller always axis="x" class="scroller-mobile__box">
			<div class="scroller-mobile__columns">
				<div v-for="item in 12" :key="item" class="scroller-mobile__column" @click="handleClick(item)">
					{{ item }}
				</div>
			</div>
		</MScroller>

		<h3>always + maxHeight（内容不足时不显示）</h3>
		<MScroller :max-height="400" always class="scroller-mobile__box">
			<div v-for="item in count" :key="item" class="scroller-mobile__row" @click="handleClick(item)">
				条目 {{ item }}
			</div>
		</MScroller>
		<MButton style="margin-top: 12px;" @click="count = count === 3 ? 20 : 3">
			切换条目数（{{ count }}）
		</MButton>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MButton } from '../../button/index.m';
import { MScroller } from '../index.m';

const current = ref('');
const count = ref(3);
const handleClick = (item) => {
	current.value = `条目 ${item}`;
};
</script>
<style scoped>
.scroller-mobile {
	padding: 0 12px 24px;
}

.scroller-mobile__box {
	background: var(--vc-background-color-light);
	border-radius: 8px;
}

.scroller-mobile__row {
	padding: 12px 16px;
}

.scroller-mobile__row + .scroller-mobile__row {
	border-top: 1px solid var(--vc-border-color);
}

.scroller-mobile__columns {
	display: flex;
	gap: 8px;
	width: max-content;
	padding: 12px 12px 16px;
}

.scroller-mobile__column {
	width: 96px;
	height: 64px;
	line-height: 64px;
	text-align: center;
	background: var(--vc-background-color-primary-light);
	border-radius: 6px;
}
</style>
