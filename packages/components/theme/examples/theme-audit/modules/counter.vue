<template>
	<div class="audit-stack">
		<p class="audit-hint">继承主题：普通数值、精度、占位及可控制动画。</p>
		<Counter :value="12345.67" :precision="2" />
		<Counter :value="undefined" placeholder="暂无数值" />
		<Counter ref="counter" :value="9999.9" :precision="2" :duration="2000" controllable />
		<div class="audit-row">
			<Button @click="counter.restart()">开始 / 重播</Button><Button @click="counter.pause()">暂停</Button>
			<Button @click="counter.resume()">继续</Button><Button @click="counter.end()">结束</Button>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Counter, Button } from '@deot/vc';

const counter = ref();
</script>
