<template>
	<h1>Memory Test in non-trace mode（close vue-devtools）</h1>
	<h3>
		Current Status：{{ runTip }}
	</h3>
	<p>
		判断方法：Stop 后在 DevTools Memory 面板手动回收（Collect garbage），JS 堆、DOM 节点、事件监听数应回到 Start 前的水平
	</p>
	<p>
		受 Transition 动画的影响，Chrome DevTools/Performance Monitor 开着时动画元素可能不回收，关闭再开启后才会回收；如果内存依旧泄漏，请分析自身程序（可注释动画 Class 或给 CSS 加权禁用它）
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
import { defineComponent, h, ref, withDirectives, vShow, onMounted, onUnmounted } from 'vue';
import { Portal } from '..';
import { TransitionFade } from '../../transition';

/**
 * 与 Message 相同的生命周期：挂载后进入动画 -> 进入完成后隐藏 -> 离开动画结束后 portal-fulfilled 自行销毁
 * 不能在弹出后立即 destroy，否则元素在首帧前就被移除，动画从未执行
 */
const WrapperComponent = defineComponent({
	name: 'vc-wrapper',
	props: {
		rootTag: String
	},
	emits: ['click', 'portal-fulfilled'],
	setup(props, { slots, emit }) {
		const isActive = ref(false);
		onMounted(() => isActive.value = true);
		return () => h(
			TransitionFade,
			{
				duration: 30,
				onAfterEnter: () => isActive.value = false,
				onAfterLeave: () => emit('portal-fulfilled')
			},
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

const MT = new Portal(WrapperComponent, {
	multiple: true,
	leaveDelay: 0
});

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
	}, 50);
};

const handleStop = () => {
	clearInterval(timer);
	runTip.value = 'Stop';
};

onUnmounted(handleStop);
</script>
