<template>
	<div class="v-intersection-basic">
		<div class="_bar">
			<span>状态：{{ visible ? '在可视区内' : '不在可视区' }}</span>
			<span>change 次数：{{ count }}</span>
			<Button @click="once = !once">
				once: {{ once }}
			</Button>
			<Button @click="disabled = !disabled">
				disabled: {{ disabled }}
			</Button>
			<Button @click="target?.refresh()">
				refresh
			</Button>
		</div>
		<p>向下滚动页面，监听区域进出浏览器视口时切换状态</p>
		<div class="_space" />
		<Intersection
			ref="target"
			v-model="visible"
			:once="once"
			:disabled="disabled"
			class="_target"
			@change="count++"
		>
			<template #default="{ visible: inView }">
				{{ inView ? '可见' : '不可见' }}
			</template>
		</Intersection>
		<div class="_space" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Intersection } from '..';
import { Button } from '../../button';

const target = ref();
const visible = ref(false);
const count = ref(0);
const once = ref(false);
const disabled = ref(false);
</script>
<style>
.v-intersection-basic { padding: 20px; }

.v-intersection-basic ._bar {
	position: sticky;
	top: 0;
	z-index: 1;
	display: flex;
	gap: 12px;
	align-items: center;
	padding: 8px 0;
	background: var(--vc-color-light);
}

.v-intersection-basic ._space { height: 120vh; }

.v-intersection-basic ._target {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 80px;
	color: #fff;
	background: var(--vc-color-primary);
}
</style>
