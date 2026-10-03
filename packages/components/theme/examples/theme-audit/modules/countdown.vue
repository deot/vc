<template>
	<div class="audit-stack">
		<p class="audit-hint">继承主题：运行、结束与自定义格式。</p>
		<Button @click="restart">开始 / 重新倒计时</Button>
		<Countdown v-if="generation" :key="generation" :target-time="target" :server-time="server" format="mm:ss" @complete="status = '已结束'" />
		<span v-else>尚未开始</span>
		<Countdown :target-time="0" :server-time="server">
			<template #default="{ hour, minute, second }">{{ hour || '00' }}:{{ minute || '00' }}:{{ second || '00' }} · 已结束</template>
		</Countdown>
		<span>{{ status }}</span>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Countdown, Button } from '@deot/vc';

const server = ref(Date.now());
const target = ref(server.value);
const generation = ref(0);
const status = ref('未开始');
const restart = () => { server.value = Date.now(); target.value = server.value + 60000; generation.value++; status.value = '运行中'; };
</script>
