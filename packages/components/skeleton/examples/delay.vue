<!-- delay：请求快于 delay 时不出骨架（不闪一下），刷新期间保留已有内容 -->
<template>
	<div class="skeleton-delay">
		<div class="skeleton-delay__controls">
			<Select v-model="duration" :data="DURATIONS" label="请求时长" />
			<Button @click="load">重新请求</Button>
		</div>
		<div class="skeleton-delay__columns">
			<section v-for="delay in [0, 300]" :key="delay">
				<h4>delay = {{ delay }}</h4>
				<Skeleton :loading="loading" :delay="delay" :rows="2">
					<div class="skeleton-delay__content">
						<h5>第 {{ count }} 次结果</h5>
						<p>加载完成后的内容。</p>
					</div>
				</Skeleton>
			</section>
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Skeleton } from '..';
import { Button } from '../../button';
import { Select } from '../../select';

const DURATIONS = [
	{ value: 150, label: '150ms（快）' },
	{ value: 1500, label: '1500ms（慢）' }
];
const duration = ref(DURATIONS[0].value);
const loading = ref(true);
const count = ref(0);

let timer;
const load = () => {
	clearTimeout(timer);
	loading.value = true;
	timer = setTimeout(() => {
		count.value++;
		loading.value = false;
	}, duration.value);
};
load();
</script>

<style lang="scss">
.skeleton-delay {
	padding: 20px;

	&__controls {
		display: flex;
		gap: 12px;
		margin-bottom: 16px;

		.vc-select {
			width: 200px;
		}
	}

	&__columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 32px;
		max-width: 720px;
	}

	h4 {
		margin: 0 0 12px;
		font-size: 14px;
		color: var(--vc-color-dark-lightest);
	}

	&__content {
		h5 {
			margin: 0 0 8px;
			font-size: 16px;
		}

		p {
			margin: 0;
			color: var(--vc-color-dark-lightest);
		}
	}
}
</style>
