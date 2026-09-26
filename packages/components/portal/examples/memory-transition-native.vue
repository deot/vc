<template>
	<div style="padding: 20px">
		<h1>{{ timer ? 'Running' : '----' }}</h1>
		<p>
			判断方法：Stop 后在 DevTools Memory 面板手动回收（Collect garbage），JS 堆、DOM 节点、事件监听数应回到 Start 前的水平
		</p>
		<p>
			受 Transition 动画的影响，Chrome DevTools/Performance Monitor 开着时动画元素可能不回收，关闭再开启后才会回收；如果内存依旧泄漏，请分析自身程序（可注释动画 Class 或给 CSS 加权禁用它）
		</p>
		<button @click="start">
			Start Test
		</button>
		<br>
		<br>
		<button @click="stop">
			Stop Test
		</button>
		<div ref="root" />
	</div>
</template>
<script setup>
import { createApp, h, ref, onUnmounted, Transition, onMounted, withDirectives, vShow } from 'vue';

const root = ref(null);
const timer = ref(null);
const stop = () => {
	timer.value && clearInterval(timer.value);
	timer.value = null;
};

/**
 * 与 memory-transition-portal 相同的生命周期（不经过 Portal）：
 * 挂载后进入动画 -> 进入完成后隐藏 -> 离开动画结束后卸载
 * 不能 mount 后同步 unmount，否则 isActive 的更新来不及执行，动画从未触发
 */
const start = () => {
	stop();
	timer.value = setInterval(
		() => {
			const container = document.createElement('div');
			const app = createApp({
				setup() {
					const isActive = ref(false);
					onMounted(() => isActive.value = true);
					return () => h(
						Transition,
						{
							name: 'fade',
							onAfterEnter: () => isActive.value = false,
							onAfterLeave: () => app.unmount()
						},
						{
							default: () => {
								return withDirectives(
									h(
										'h4',
										{},
										Array
											.from({ length: 10000 })
											.map(
												() => h(
													'p',
													{ onClick: console.log },
													`${Math.random()}`
												)
											)
									),
									[[vShow, isActive.value]]
								);
							}
						}
					);
				}
			});
			app.mount(container);
			Array
				.from(container.children)
				.forEach(i => root.value.appendChild(i));
		},
		50
	);
};

onUnmounted(stop);
</script>
<style>
.fade-enter-active,
.fade-leave-active {
	transition: opacity .03s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
