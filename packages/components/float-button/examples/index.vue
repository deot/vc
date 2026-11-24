<template>
	<div class="v-float-button-basic">
		<div class="_bar">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
			<Button @click="buttonRef.reset()">
				reset()
			</Button>
		</div>
		<p>
			按钮默认停在页面右下角，拖动它试试：点按（含回车、空格）触发 click，拖动后松开不触发；
			聚焦后方向键移动（Shift 每次 40px），吸边方向上直接移到那一边。缩放窗口时，贴住的边保持不变。
		</p>
		<p>位置：x {{ Math.round(offset?.x) }}，y {{ Math.round(offset?.y) }} · 点击次数：{{ count }} · after-change 次数：{{ changes }}</p>
		<div v-for="item in 30" :key="item" class="_row">
			第 {{ item }} 行
		</div>
		<FloatButton
			ref="buttonRef"
			v-model:offset="offset"
			:draggable="controls.draggable"
			:magnetic="controls.magnetic"
			:shape="controls.shape"
			:icon="controls.content === 'icon' ? 'service' : undefined"
			aria-label="客服"
			@click="count++"
			@after-change="changes++"
		>
			<template v-if="controls.content === 'text'" #default="{ dragging }">
				{{ dragging ? '拖动中' : '客服' }}
			</template>
		</FloatButton>
	</div>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { Button } from '../../button';
import { Select } from '../../select';
import { FloatButton } from '..';

const CONTROLS = [
	{
		key: 'draggable',
		label: 'draggable',
		data: [
			{ value: 'y', label: '\'y\'（默认）' },
			{ value: 'x', label: '\'x\'' },
			{ value: true, label: 'true' },
			{ value: false, label: 'false' }
		]
	},
	{
		key: 'magnetic',
		label: 'magnetic',
		data: [
			{ value: false, label: 'false（默认）' },
			{ value: 'x', label: '\'x\'' },
			{ value: 'y', label: '\'y\'' },
			{ value: true, label: 'true' }
		]
	},
	{
		key: 'shape',
		label: 'shape',
		data: [
			{ value: 'circle', label: 'circle（默认）' },
			{ value: 'square', label: 'square' }
		]
	},
	{
		key: 'content',
		label: '内容',
		data: [
			{ value: 'icon', label: '图标' },
			{ value: 'text', label: '插槽文字' }
		]
	}
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const buttonRef = ref();
// 不设初值：按钮停在默认的右下角，再同步回来
const offset = ref();
const count = ref(0);
const changes = ref(0);
</script>
<style>
.v-float-button-basic ._bar {
	position: sticky;
	top: 0;
	z-index: 1;
	display: flex;
	padding: 8px 0;
	background: var(--vc-color-light);
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
}

.v-float-button-basic ._row {
	padding: 12px 16px;
	border-bottom: 1px solid var(--vc-color-neutral-light);
}
</style>
