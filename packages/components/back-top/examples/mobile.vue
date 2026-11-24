<template>
	<div class="v-back-top-mobile">
		<p>数字长度为 750 稿：滚动超过 400（375 宽下 200px）后出现，可用右上角的 rem 按钮切换 --vc-rem 观察缩放</p>
		<MList>
			<MListItem v-for="item in 40" :key="item" :label="`第 ${item} 行`" :arrow="false" />
		</MList>
		<MBackTop show-progress />
	</div>
</template>
<script setup>
import { MList, MListItem } from '../../list/index.m';
import { MBackTop } from '../index.m';
</script>
