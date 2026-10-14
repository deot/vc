<!-- 点击处理函数返回 Promise 时进入 loading；选「保持 loading」可停在 loading 状态查看。行尾为实测：偏差为图标中心减文字视觉中心（基线上方 0.35em，没有文字时取按钮内容区中心），正数表示偏低 -->
<template>
	<div class="button-loading">
		<div class="button-loading__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<div :key="`${controls.mode}-${controls.size}`" ref="list">
			<div
				v-for="item in CASES"
				:key="item.key"
				class="button-loading__item"
			>
				<code>{{ item.label }}</code>
				<div class="button-loading__sample" :data-key="item.key">
					<ButtonGroup v-if="item.group" :size="controls.size">
						<Button :icon="item.icon" @click="handleClick">
							<span class="button-loading__probe" />按钮一
						</Button>
						<Button @click="handleClick">
							<span class="button-loading__probe" />按钮二
						</Button>
					</ButtonGroup>
					<template v-else>
						<!-- 同一行放一个纯文字按钮作对照，看基线是否一致 -->
						<Button :size="controls.size">
							<span class="button-loading__probe" />对照
						</Button>
						<Button
							:size="controls.size"
							:icon="item.icon"
							:type="item.type"
							:round="item.round"
							@click="handleClick"
						>
							<template v-if="item.text" #default>
								<span class="button-loading__probe" />{{ item.text }}
							</template>
						</Button>
					</template>
				</div>
				<output>{{ readouts[item.key] || '-' }}</output>
			</div>
		</div>
	</div>
</template>
<script setup>
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { Button, ButtonGroup } from '..';
import { Select } from '../../select';

// 对照项：每项一个 Select
const toData = (values, labels = {}) => values.map(value => ({ value, label: labels[value] || value }));
const CONTROLS = [
	{ key: 'mode', label: '状态', data: toData(['hold', 'click'], { hold: '保持 loading', click: '点击后 loading 2 秒' }) },
	{ key: 'size', label: 'size', data: toData(['small', 'medium', 'large']) }
];
const controls = reactive({ mode: 'hold', size: 'medium' });

const CASES = [
	{ key: 'text', label: '纯文字', text: '提交' },
	{ key: 'primary', label: '纯文字 primary', text: '提交', type: 'primary' },
	{ key: 'icon', label: '带 icon', text: '搜索', icon: 'search' },
	{ key: 'icon-only', label: '只有 icon', icon: 'search' },
	{ key: 'icon-round', label: '只有 icon，round', icon: 'search', round: true },
	{ key: 'group', label: 'ButtonGroup，第一个带 icon', group: true, icon: 'search' }
];

const list = ref();
const readouts = reactive({});

// 保持 loading：返回的 Promise 在切换选项或离开页面时才结束
let pending = [];
const release = () => {
	pending.forEach(resolve => resolve());
	pending = [];
};
const handleClick = () => {
	if (controls.mode === 'hold') return new Promise(resolve => pending.push(resolve));
	return new Promise(resolve => setTimeout(resolve, 2000)).then(() => nextTick(measure));
};

const centerOf = (el) => {
	const rect = el.getBoundingClientRect();
	return (rect.top + rect.bottom) / 2;
};

const contentCenterOf = (el) => {
	const rect = el.getBoundingClientRect();
	const style = getComputedStyle(el);
	const top = rect.top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop);
	const bottom = rect.bottom - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingBottom);
	return (top + bottom) / 2;
};

const format = v => `${v > 0.05 ? '+' : ''}${(Math.abs(v) < 0.05 ? 0 : v).toFixed(2)}`;

// 每个按钮：loading / icon 相对文字中心的偏差，各部分之间的间距；对照按钮与被测按钮的顶部差
const measure = () => {
	list.value?.querySelectorAll('.button-loading__sample').forEach((sample) => {
		const buttons = [...sample.querySelectorAll('.vc-button')];
		const target = buttons.find(el => el.querySelector('.vc-button__icon, .vc-spin')) || buttons[buttons.length - 1];
		const probe = target.querySelector('.button-loading__probe');
		const line = probe
			? probe.getBoundingClientRect().bottom - 0.35 * parseFloat(getComputedStyle(probe).fontSize)
			: contentCenterOf(target);
		const icon = target.querySelector('.vc-button__icon svg');
		const spin = target.querySelector('.vc-spin svg');

		const parts = [];
		spin && parts.push(`loading ${format(centerOf(spin) - line)}`);
		icon && parts.push(`icon ${format(centerOf(icon) - line)}`);
		// 相邻部分的间距，按 DOM 顺序：loading → icon → 文字
		const order = [...target.children];
		for (let i = 1; i < order.length; i++) {
			const gap = order[i].getBoundingClientRect().left - order[i - 1].getBoundingClientRect().right;
			parts.push(`间距 ${gap.toFixed(1)}`);
		}
		if (buttons.length > 1 && !sample.querySelector('.vc-button-group')) {
			parts.push(`与对照按钮顶部差 ${format(target.getBoundingClientRect().top - buttons[0].getBoundingClientRect().top)}`);
		}
		readouts[sample.dataset.key] = parts.join(' · ');
	});
};

// 保持 loading：重新挂载后点击每个被测按钮
const enter = async () => {
	await nextTick();
	if (controls.mode === 'hold') {
		list.value?.querySelectorAll('.button-loading__sample').forEach((sample) => {
			const buttons = sample.querySelectorAll('.vc-button');
			// 普通行的第一个是对照按钮，不点击；ButtonGroup 两个都点击
			[...buttons].slice(sample.querySelector('.vc-button-group') ? 0 : 1).forEach(el => el.click());
		});
		await nextTick();
	}
	measure();
};

watch(controls, () => {
	release();
	enter();
});
onMounted(() => {
	enter();
	window.addEventListener('resize', measure);
});
onBeforeUnmount(() => {
	release();
	window.removeEventListener('resize', measure);
});
</script>

<style lang="scss">
.button-loading {
	padding: 20px;

	&__controls {
		display: flex;

		// 右上角留给主题与性能读数的按钮
		padding-right: 220px;
		margin-bottom: 12px;
		flex-wrap: wrap;
		gap: 12px;

		.vc-select {
			width: 240px;
		}
	}

	&__item {
		display: grid;
		grid-template-columns: 200px 300px 1fr;
		align-items: center;
		padding: 8px 0;
		font-size: 13px;
		line-height: 20px;
		border-bottom: 1px solid #eee;

		> output {
			font-variant-numeric: tabular-nums;
			color: #606266;
		}
	}

	&__sample {
		> .vc-button + .vc-button {
			margin-left: 8px;
		}
	}

	&__probe {
		display: inline-block;
		width: 0;
		height: 0;
	}
}
</style>
