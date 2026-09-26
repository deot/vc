<template>
	<div style="padding: 20px">
		<div id="root" />
		<h1>{{ timer ? 'Running' : '----' }}</h1>
		<p>
			判断方法：Stop 后在 DevTools Memory 面板手动回收（Collect garbage），JS 堆、DOM 节点、事件监听数应回到 Start 前的水平
		</p>
		<button @click="start">
			Start Test
		</button>
		<br>
		<br>
		<button @click="stop">
			Stop Test
		</button>
	</div>
</template>
<script setup>
import { createApp, h, ref, onUnmounted } from 'vue';

const timer = ref(null);
const stop = () => {
	timer.value && clearInterval(timer.value);
	timer.value = null;
};
const start = () => {
	stop();
	timer.value = setInterval(
		() => {
			const vm = createApp(
				() => Array
					.from({ length: 1000 })
					.map(() => h('div', { onClick: () => {} }))
			);
			vm.mount('#root');
			vm.unmount();
		},
		10
	);
};

onUnmounted(stop);
</script>
