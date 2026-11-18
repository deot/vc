<template>
	<div style="padding: 16px">
		<MMarquee :content="text.repeat(5)" style="padding: 8px 0; background: #f7f7f7" />
		<br>
		<MMarquee direction="up" style="height: 20px; line-height: 20px; background: #f7f7f7">
			<div v-for="item in 3" :key="item">
				第 {{ item }} 条通知
			</div>
		</MMarquee>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MMarquee } from '../index.m';

const text = ref('ABCDEFG ');
</script>
