<template>
	<h1>Memory Test in non-trace mode（close vue-devtools）</h1>
	<h3>
		Current Status：{{ runTip }}
	</h3>
	<!-- Tips: components/transition/README.md -->
	<button @click="handleStart">
		Start
	</button>
	<br>
	<br>
	<button @click="handleStop">
		Stop
	</button>
</template>
<script setup>
import { defineComponent, h, ref, withDirectives, vShow, onMounted } from 'vue';
import { Portal } from '..';
import { TransitionFade } from '../../transition';

const WrapperComponent = defineComponent({
	name: 'vc-wrapper',
	props: {
		rootTag: String
	},
	emits: ['click'],
	setup(props, { slots }) {
		const isActive = ref(false);
		onMounted(() => isActive.value = true);
		return () => h(
			TransitionFade,
			{},
			{
				default: () => {
					return withDirectives(
						h(
							props.rootTag,
							Array
								.from({ length: 10000 })
								.map(
									() => h(
										'p',
										{ onClick: console.log },
										slots
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
let timer;
const runTip = ref('Not Started');

const MT = new Portal(WrapperComponent);

const handleStart = () => {
	runTip.value = 'Running';
	clearInterval(timer);
	timer = setInterval(() => {
		MT.popup({
			rootTag: 'h4',
			onClick: console.log,
			slots: {
				default: () => `A - ${Math.random()}`
			}
		});
		setTimeout(MT.destroy, 0);
	}, 50);
};

const handleStop = () => {
	clearInterval(timer);
	runTip.value = 'Stop';
};
</script>
