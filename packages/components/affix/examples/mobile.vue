<template>
	<div class="affix-mobile">
		<p>offset 为 750 稿长度，可用右上角的 rem 按钮切换 --vc-rem 观察缩放</p>
		<MAffix v-model="topActive">
			<MButton type="error">吸顶 offset 0{{ topActive ? '（吸附中）' : '' }}</MButton>
		</MAffix>
		<Customer :render="renderItems" :length="6" />
		<MAffix :offset="88">
			<MButton type="primary">吸顶 offset 88</MButton>
		</MAffix>
		<Customer :render="renderItems" />

		<h3>target：只在容器内吸附</h3>
		<div class="affix-mobile__target">
			<MAffix :offset="176" target=".affix-mobile__target">
				<MButton type="success">容器内吸顶 offset 176</MButton>
			</MAffix>
			<Customer :render="renderItems" :length="12" />
		</div>

		<h3>fixed=false：在滚动容器内吸附</h3>
		<MScroller height="200px" class="affix-mobile__scroller">
			<Customer :render="renderItems" :length="3" />
			<MAffix :fixed="false" :offset="20">
				<MButton type="warning">sticky 吸顶 offset 20</MButton>
			</MAffix>
			<Customer :render="renderItems" />
			<MAffix :fixed="false" :offset="20" placement="bottom">
				<MButton type="warning">sticky 吸底 offset 20</MButton>
			</MAffix>
			<Customer :render="renderItems" />
		</MScroller>

		<Customer :render="renderItems" />
		<MAffix :offset="40" placement="bottom">
			<MButton type="primary">吸底 offset 40</MButton>
		</MAffix>
		<Customer :render="renderItems" />
	</div>
</template>
<script setup>
import { h, ref } from 'vue';
import { MButton } from '../../button/index.m';
import { MScroller } from '../../scroller/index.m';
import { Customer } from '../../customer';
import { MAffix } from '../index.m';

const topActive = ref(false);
const renderItems = ({ length }) => Array.from({ length: length || 20 }).map((_, index) => h('p', `条目 ${index}`));
</script>
<style scoped>
.affix-mobile {
	padding: 0 12px;
}

.affix-mobile__target {
	padding: 8px;
	background: var(--vc-color-light-deeper);
}

.affix-mobile__scroller {
	padding: 0 8px;
	background: var(--vc-color-light-deeper);
}
</style>
