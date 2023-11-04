<template>
	<h1>Memory Test in non-trace mode（close vue-devtools）</h1>
	<button 
		@click="useComponent = !useComponent"
	>
		useComponent: {{ useComponent }}
	</button>
	<h3>
		Current Status：{{ runTip }}
	</h3>
	 
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
import { defineComponent, h, ref } from "vue";
import { Portal } from '..';

/* eslint-disable-next-line vue/one-component-per-file */
const WrapperComponent = defineComponent({
	name: 'vc-wrapper',
	props: {
		rootTag: String
	},
	emits: ['click'],
	setup(props, { slots }) {
		return () => h(
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
		);
	} 
});

const WrapperFunction = (props, { slots }) => h(
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
);

let timer;
const runTip = ref('Not Started');
const useComponent = ref(true);

const MT = new Portal(useComponent.value ? WrapperComponent : WrapperFunction);

const handleStart = () => {
	runTip.value = 'Running';
	clearInterval(timer);
	timer = setInterval(() => {
		MT.popup({
			rootTag: 'h4',
			onClick: console.log,
			slots: {
				default: () => `useComponent: ${useComponent.value} - ${Math.random()}`
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
