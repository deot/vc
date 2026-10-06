<template>
	<div class="height-demo">
		<p class="height-demo__tip">
			size 决定预设的宽高；不传 height 时预设高度是最小高度，内容更多时增长；height 传数字为固定高度；
			height="auto" 时高度跟随内容。三种情况下高度都不超过视口，超出后内容区滚动。
		</p>
		<div class="height-demo__options">
			<span>height</span>
			<Select v-model="mode" :data="modeOptions" style="width: 160px;" />
			<span>size</span>
			<Select v-model="size" :data="sizeOptions" style="width: 120px;" />
			<span>行数</span>
			<Select v-model="rows" :data="rowOptions" style="width: 120px;" />
			<span>draggable</span>
			<Select v-model="draggable" :data="booleanOptions" style="width: 100px;" />
		</div>
		<Button type="primary" @click="isVisible = true">
			打开
		</Button>

		<Modal
			:key="`${mode}-${size}-${draggable}`"
			v-model="isVisible"
			title="标题"
			:size="size"
			:height="height"
			:draggable="draggable"
		>
			<div v-for="i in rows" :key="i">
				第 {{ i }} 行内容
			</div>
		</Modal>
	</div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Modal } from '..';
import { Button } from '../../button';
import { Select } from '../../select';

const isVisible = ref(false);
const mode = ref('auto');
const modeOptions = [
	{ value: 'default', label: '不传（预设为最小）' },
	{ value: 'auto', label: 'auto（跟随内容）' },
	{ value: 'fixed', label: '400（固定）' }
];
const height = computed(() => ({ default: undefined, auto: 'auto', fixed: 400 })[mode.value]);
const size = ref('small');
const sizeOptions = ['small', 'medium', 'large'].map(value => ({ value, label: value }));
const rows = ref(2);
const rowOptions = [2, 10, 80].map(value => ({ value, label: `${value} 行` }));
const draggable = ref(false);
const booleanOptions = [{ value: false, label: '关' }, { value: true, label: '开' }];
</script>

<style lang="scss">
.height-demo {
	padding: 40px;

	&__tip {
		color: #666;
	}

	&__options {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
		margin-bottom: 24px;
	}
}
</style>
