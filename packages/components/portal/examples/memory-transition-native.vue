<template>
	<div style="padding: 20px">
		<h1>{{ timer ? 'Running' : '----' }}</h1>
		<!-- Tips: components/transition/README.md -->
		<button @click="start">
			Start Test
		</button>
		<br>
		<br>
		<button @click="stop">
			Stop Test
		</button>
		<div id="root" />
	</div>
</template>
<script setup>
import { createApp, h, ref, onUnmounted, Transition, onMounted, withDirectives, vShow } from 'vue';

const timer = ref(null);
const stop = () => {
	timer.value && clearInterval(timer.value);
	timer.value = null;
};
const start = () => {
	stop();
	timer.value = setInterval(
		() => {
			let vm = createApp({
				setup() {
					const isActive = ref(false);
					onMounted(() => isActive.value = true);
					return () => h(
						Transition,
						{
							name: 'fade'
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
			vm.mount('#root');
			vm.unmount();
			vm = null;
		},
		10
	);
};

onUnmounted(stop);
</script>
<style>
.fade-enter-active,
.fade-leave-active {
	transition: opacity .003s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
