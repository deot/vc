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
	<p>
		判断方法：Stop 后在 DevTools Memory 面板手动回收（Collect garbage），JS 堆、DOM 节点、事件监听数应回到 Start 前的水平
	</p>
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
import { defineComponent, h, ref, onUnmounted } from 'vue';
import { Portal } from '..';

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

// 每次弹出时按 useComponent 取对应的 Portal，切换才会生效
const portals = {
	component: new Portal(WrapperComponent),
	function: new Portal(WrapperFunction)
};

const handleStart = () => {
	runTip.value = 'Running';
	clearInterval(timer);
	timer = setInterval(() => {
		const MT = useComponent.value ? portals.component : portals.function;
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

onUnmounted(handleStop);
</script>
