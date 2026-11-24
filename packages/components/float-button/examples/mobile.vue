<template>
	<div class="v-float-button-mobile">
		<p>
			数字 gap 为 750 稿长度（默认 48，375 宽下 24px）；按钮可自由拖动，松开后吸到左右两边。
			可用右上角的 rem 按钮切换 --vc-rem 观察缩放，贴住的边保持不变
		</p>
		<MList>
			<MListItem v-for="item in 40" :key="item" :label="`第 ${item} 行`" :arrow="false" />
		</MList>
		<MFloatButton draggable magnetic="x" icon="service" aria-label="客服" />
	</div>
</template>
<script setup>
import { MList, MListItem } from '../../list/index.m';
import { MFloatButton } from '../index.m';
</script>
