<template>
	<h1>Memory Test in non-trace mode（close vue-devtools）</h1>
	<h3>
		Current Status：{{ runTip }}
	</h3>
	<p>
		alive：关闭只把 isVisible 置为 false，实例保留；再次 popup 复用实例并执行 update 重新打开。点击页面其他区域会清理实例
	</p>
	<p>
		判断方法：反复打开/关闭，body 下残留的空 div 应始终为 0；销毁或点击外部清理后，Portal 节点也应为 0
	</p>
	<div class="vc-portal-alive">
		<button @click="handleStart">
			Start
		</button>
		<br>
		<br>
		<button @click="handleStop">
			Stop
		</button>
		<br>
		<br>
		<button @click="handleOpen">
			打开
		</button>
		<button @click="handleClose">
			关闭
		</button>
		<button @click="handleDestroy">
			销毁
		</button>
	</div>
	<h3>
		打开次数：{{ stats.opens }}；update 次数：{{ stats.updates }}；Portal.leafs：{{ stats.leafs }}；
		Portal 节点：{{ stats.nodes }}；body 下残留的空 div：{{ stats.empty }}
	</h3>
</template>
<script setup>
import { defineComponent, h, ref, reactive, onUnmounted } from 'vue';
import { Portal } from '..';

const stats = reactive({ opens: 0, updates: 0, leafs: 0, nodes: 0, empty: 0 });

const AliveWrapper = defineComponent({
	name: 'vc-memory-alive',
	setup(_, { expose }) {
		const isVisible = ref(true);
		const updates = ref(0);

		expose({
			isVisible,
			// 再次打开：Portal 复用实例后调用
			update: () => {
				isVisible.value = true;
				updates.value++;
				stats.updates++;
			}
		});

		return () => isVisible.value && h(
			'div',
			{ 'class': 'vc-portal-alive', 'data-memory-alive': '' },
			[
				`update 次数：${updates.value} `,
				h('button', { onClick: () => isVisible.value = false }, '关闭')
			]
		);
	}
});

const MT = new Portal(AliveWrapper, { alive: true });

const handleOpen = () => {
	stats.opens++;
	MT.popup();
};

const handleClose = () => {
	const leaf = Portal.leafs.get(MT.globalOptions.name);
	leaf?.wrapper && (leaf.wrapper.isVisible = false);
};

const handleDestroy = () => MT.destroy();

let timer;
const runTip = ref('Not Started');

const handleStart = () => {
	runTip.value = 'Running';
	clearInterval(timer);
	timer = setInterval(() => {
		const leaf = Portal.leafs.get(MT.globalOptions.name);
		leaf?.wrapper?.isVisible ? handleClose() : handleOpen();
	}, 50);
};

const handleStop = () => {
	clearInterval(timer);
	runTip.value = 'Stop';
};

// Portal 的容器没有属性，空 div 即为未被移除的容器
const poll = setInterval(() => {
	const children = Array.from(document.body.children);
	stats.leafs = Portal.leafs.size;
	stats.nodes = document.querySelectorAll('[data-memory-alive]').length;
	stats.empty = children.filter(el => el.tagName === 'DIV' && !el.attributes.length && !el.childNodes.length).length;
}, 100);

onUnmounted(() => {
	handleStop();
	clearInterval(poll);
	handleDestroy();
});
</script>
