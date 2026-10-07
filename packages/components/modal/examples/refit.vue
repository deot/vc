<template>
	<div class="refit-demo">
		<p class="refit-demo__tip">
			弹窗打开后增减行数：未设置固定高度时，高度应跟随内容并保持居中，超过视口后内容区滚动；
			每行 21px（含 1px 分隔线），行数的奇偶决定弹窗高度的奇偶，奇数高度下分隔线也应清晰。左下角显示容器的实际尺寸与位置。
		</p>
		<div class="refit-demo__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>
		<Button type="primary" @click="handleOpen">
			打开
		</Button>
		<Button @click="clicks++">
			页面按钮（已点击 {{ clicks }} 次）
		</Button>

		<pre class="refit-demo__readout">{{ readout }}</pre>

		<MModalView
			v-if="controls.platform === 'mobile'"
			:key="`mobile-${controls.mask}`"
			v-model="isVisible"
			:mask="controls.mask"
			:data="mobileActions"
			title="标题"
		>
			<div ref="body" class="refit-demo__rows">
				<div v-for="i in rows" :key="i">
					第 {{ i }} 行内容
				</div>
			</div>
		</MModalView>
		<ModalView
			v-else
			:key="`${controls.scrollable}-${controls.height}-${controls.draggable}-${controls.mask}`"
			v-model="isVisible"
			:scrollable="controls.scrollable"
			:height="height"
			:draggable="controls.draggable"
			:mask="controls.mask"
			:width="480"
			border
			title="标题"
		>
			<div ref="body" class="refit-demo__rows" :class="{ 'is-unscrollable': !controls.scrollable }">
				<div v-for="i in rows" :key="i">
					第 {{ i }} 行内容
				</div>
			</div>
			<template #footer-extra>
				<Button class="refit-demo__action" @click="handleRows(-5)">
					−5 行
				</Button>
				<Button class="refit-demo__action" @click="handleRows(5)">
					+5 行
				</Button>
			</template>
		</ModalView>
	</div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { ModalView } from '..';
import { MModalView } from '../index.m';
import { Button } from '../../button';
import { Select } from '../../select';

const booleanOptions = [{ value: true, label: '开' }, { value: false, label: '关' }];
// 对照项：每项一个 Select
const CONTROLS = [
	{ key: 'platform', label: '端', data: [{ value: 'pc', label: 'PC' }, { value: 'mobile', label: '移动' }] },
	{ key: 'scrollable', label: 'scrollable', data: [{ value: false, label: '关（内容自行滚动）' }, { value: true, label: '开（内置 Scroller）' }] },
	{
		key: 'height',
		label: 'height',
		data: [{ value: 'default', label: '不传（预设为最小）' }, { value: 'auto', label: 'auto（跟随内容）' }, { value: 'fixed', label: '400（固定）' }]
	},
	{ key: 'draggable', label: 'draggable', data: [...booleanOptions].reverse() },
	{ key: 'mask', label: 'mask', data: booleanOptions }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const height = computed(() => ({ default: undefined, auto: 'auto', fixed: 400 })[controls.height]);

const isVisible = ref(false);
const rows = ref(4);
const clicks = ref(0);
const body = ref();
const readout = ref('未打开');

// 容器的实际高度、脚本写入的行内高度、在视口中的位置
const measure = () => {
	const container = body.value?.closest('.vc-modal__container, .vcm-modal__container');
	if (!container || !isVisible.value) {
		readout.value = '未打开';
		return;
	}
	const rect = container.getBoundingClientRect();
	const centered = (window.innerHeight - rect.height) / 2;
	readout.value = [
		`行数: ${rows.value}`,
		`offsetHeight: ${container.offsetHeight}`,
		`行内 height: ${container.style.height || '(无)'}`,
		`top: ${rect.top}`,
		`居中应为: ${centered}`,
		`视口高: ${window.innerHeight}`
	].join('\n');
};

// 布局与过渡结束后各取一次
let timer;
const refresh = async () => {
	await nextTick();
	requestAnimationFrame(() => requestAnimationFrame(measure));
	clearTimeout(timer);
	timer = setTimeout(measure, 400);
};

const handleRows = (step) => {
	rows.value = Math.max(0, rows.value + step);
};

// 返回 true 时不关闭
const mobileActions = [
	{ content: '−5 行', onClick: () => (handleRows(-5), true) },
	{ content: '+5 行', onClick: () => (handleRows(5), true) },
	{ content: '关闭', onClick: () => {} }
];

const handleOpen = () => {
	rows.value = 4;
	isVisible.value = true;
};

watch([rows, isVisible], refresh);
watch(controls, () => (isVisible.value = false));
window.addEventListener('resize', measure);
onBeforeUnmount(() => {
	window.removeEventListener('resize', measure);
	clearTimeout(timer);
});
</script>

<style lang="scss">
.refit-demo {
	padding: 40px;

	&__tip {
		color: #666;
	}

	&__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-bottom: 24px;

		.vc-select {
			width: 240px;
		}
	}

	// 高于遮罩，弹窗打开时仍可见
	&__readout {
		position: fixed;
		bottom: 8px;
		left: 8px;
		z-index: 9999;
		padding: 8px 12px;
		margin: 0;
		font-size: 12px;
		line-height: 18px;
		color: #fff;
		pointer-events: none;
		background: rgb(0 0 0 / 70%);
		border-radius: 4px;
	}

	&__rows {
		line-height: 20px;

		// 每行 21px，1px 分隔线用于观察清晰度
		> div {
			height: 21px;
			border-bottom: 1px solid #999;
			box-sizing: border-box;
		}

		// scrollable=false：根节点设 min-height: 0，在内容区的高度内收缩并自行滚动
		&.is-unscrollable {
			min-height: 0;
			overflow: auto;
		}
	}

	&__action {
		margin-right: 8px;
	}
}
</style>
