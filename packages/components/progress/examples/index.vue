<template>
	<div class="progress-demo">
		<h3>线形</h3>
		<Progress :percent="percent" animated />
		<Progress :percent="30" status="error" />
		<Progress :percent="100" />
		<Progress :percent="33.333" />
		<Progress :percent="0" />
		<Progress :percent="60" :show-text="false" :stroke-width="10" />

		<h3>文字在条内 / 插槽 / 置灰</h3>
		<Progress :percent="percent" text-inside />
		<Progress :percent="percent">
			<template #default="{ percent: value, status }">
				<span>{{ status === 'success' ? '完成' : `${Math.round(value)} / 100` }}</span>
			</template>
		</Progress>
		<Progress :percent="percent" disabled animated />
		<Progress :percent="percent" color="#ed4014" track-color="#fde2e2" />

		<h3>圆形</h3>
		<div class="progress-demo__row">
			<Progress :percent="percent" type="circle" />
			<Progress :percent="0" type="circle" />
			<Progress :percent="100" type="circle" :size="80" />
			<Progress :percent="percent" type="circle" disabled :size="80" />
			<Progress :percent="50" :stroke-width="10" color="#ed4014" type="circle">
				<div>自定义的数据</div>
			</Progress>
		</div>

		<div class="progress-demo__row">
			<Button @click="percent = Math.max(0, percent - 10)">减少</Button>
			<Button @click="percent = Math.min(100, percent + 10)">增加</Button>
			<Button @click="key++">重新挂载</Button>
		</div>
		<div :key="key" class="progress-demo__row">
			<Progress :percent="percent" style="flex: 1" />
			<Progress :percent="percent" type="circle" :size="60" />
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Progress } from '..';
import { Button } from '../../button';

const percent = ref(50);
const key = ref(0);
</script>
<style>
.progress-demo {
	display: grid;
	padding: 20px;
	gap: 16px;
}

.progress-demo__row {
	display: flex;
	align-items: center;
	gap: 16px;
}
</style>
