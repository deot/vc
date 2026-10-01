<template>
	<div style="padding: 20px;">
		<p>同一个组件渲染两份：一份正常展示，一份放在测量范围里（实际使用时那一份是隐藏的，这里为了演示显示出来）。</p>
		<div class="measuring-demo">
			<section>
				<h4>正常展示</h4>
				<Probe />
			</section>
			<section>
				<h4>测量范围内</h4>
				<Measuring>
					<Probe />
				</Measuring>
			</section>
		</div>
		<p>挂载时执行的副作用次数：{{ effects }}</p>
	</div>
</template>
<script setup>
import { defineComponent, h, onMounted, ref } from 'vue';
import { Measuring, useMeasuring } from '..';

const effects = ref(0);

// 尺寸两份一致；副作用只在正常展示的那份里执行
const Probe = defineComponent({
	setup() {
		const isMeasuring = useMeasuring();
		onMounted(() => {
			if (isMeasuring) return;
			effects.value++;
		});
		return () => h('div', { class: 'measuring-demo__probe' }, `useMeasuring() → ${isMeasuring}`);
	}
});
</script>

<style lang="scss">
.measuring-demo {
	display: flex;
	gap: 16px;

	section {
		flex: 1;
	}

	&__probe {
		padding: 12px 16px;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
	}
}
</style>
