<template>
	<div class="tabs-mobile-sticky">
		<div class="tabs-mobile-sticky__header">顶部栏（高 88，750 稿）</div>
		<p>页面滚动：标签栏吸附在顶部栏下方（offset-top 88），Tabs 滚出后随之离开</p>
		<MTabs v-model="pageValue" sticky :offset-top="88">
			<MTabsPane v-for="pane in panes" :key="pane" :label="pane" :value="pane">
				<p v-for="index in 30" :key="index">{{ pane }} 的内容 {{ index }}</p>
			</MTabsPane>
		</MTabs>
		<p v-for="index in 10" :key="index">Tabs 之后的内容 {{ index }}</p>

		<h3>内层滚动容器</h3>
		<MScroller height="320px" class="tabs-mobile-sticky__scroller">
			<p v-for="index in 3" :key="index">前置内容 {{ index }}</p>
			<MTabs v-model="innerValue" sticky>
				<MTabsPane v-for="pane in panes" :key="pane" :label="pane" :value="pane">
					<p v-for="index in 20" :key="index">{{ pane }} 的内容 {{ index }}</p>
				</MTabsPane>
			</MTabs>
			<p v-for="index in 10" :key="index">后置内容 {{ index }}</p>
		</MScroller>
		<p v-for="index in 20" :key="index">页面底部内容 {{ index }}</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MTabs, MTabsPane } from '../index.m';
import { MScroller } from '../../scroller/index.m';

const panes = ['标签一', '标签二', '标签三', '标签四', '标签五', '标签六'];
const pageValue = ref('标签一');
const innerValue = ref('标签一');
</script>
<style scoped>
.tabs-mobile-sticky {
	padding: 0 12px;
}

.tabs-mobile-sticky__header {
	position: fixed;
	top: 0;
	right: 0;
	left: 0;
	z-index: 1000;
	height: calc(var(--vc-rem) * 88);
	line-height: calc(var(--vc-rem) * 88);
	color: #fff;
	text-align: center;
	background: var(--vc-color-primary);
}

.tabs-mobile-sticky__scroller {
	background: var(--vc-color-light-deeper);
}
</style>
