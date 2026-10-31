<!-- 图标 / Spin / 行内组件与文字混排的垂直对齐：红线为文字字符框（字体上下高度）的中心，行尾为实测偏差，正数表示比参考线低 -->
<template>
	<div class="icon-align">
		<div class="icon-align__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<p>与文字混排：图标像文字一样排版，中心应落在红线上（父级字体字符框的中心，与行内、flex 居中的文字一致）</p>
		<div
			v-for="item in INLINE_CASES"
			:key="item.key"
			class="icon-align__item"
		>
			<code>{{ item.label }}</code>
			<div class="icon-align__sample" :style="{ fontSize: `${controls.fontSize}px` }">
				<span class="icon-align__guide" :style="guides[item.key]" />
				<span>文字 Abc</span>
				<span :ref="el => setProbe(item.key, el)" class="icon-align__probe" />
				<Spin
					v-if="item.spin"
					:ref="el => setTarget(item.key, el)"
					:size="item.spin"
				/>
				<Icon
					v-else
					:ref="el => setTarget(item.key, el)"
					:type="controls.type"
					:size="item.size"
				/>
				<span>文字 Abc</span>
			</div>
			<output :class="toneOf(deltas[item.key])">{{ format(deltas[item.key]) }}</output>
		</div>

		<p>组件与文字混排：组件像文字一样按基线对齐，读数为组件基线与同行文字基线的偏差；组件字号与外层相同时，盒子中心落在红线上，自带较小字号的组件（如 Button、Checkbox）像小字一样略低于红线</p>
		<div
			v-for="item in COMPONENT_CASES"
			:key="item.key"
			class="icon-align__item"
		>
			<code>{{ item.label }}</code>
			<div class="icon-align__sample" :style="{ fontSize: `${controls.fontSize}px` }">
				<span class="icon-align__guide" :style="guides[item.key]" />
				<span>文字 Abc</span>
				<span :ref="el => setProbe(item.key, el)" class="icon-align__probe" />
				<span :ref="el => setTarget(item.key, el)">
					<component :is="item.render" />
				</span>
				<span>文字 Abc</span>
			</div>
			<output :class="toneOf(deltas[item.key])">{{ format(deltas[item.key]) }}</output>
		</div>

		<p>组件内：图标中心应落在输入框中心（红线）</p>
		<div
			v-for="item in BOX_CASES"
			:key="item.key"
			class="icon-align__item"
		>
			<code>{{ item.label }}</code>
			<div :ref="el => setBox(item.key, el)" class="icon-align__sample is-box">
				<span class="icon-align__guide" :style="guides[item.key]" />
				<Select
					v-if="item.key === 'select'"
					v-model="selectValue"
					:data="SELECT_DATA"
					style="width: 200px;"
				/>
				<Input
					v-else
					:append="controls.type"
					style="width: 200px;"
				/>
			</div>
			<output :class="toneOf(deltas[item.key])">{{ format(deltas[item.key]) }}</output>
		</div>
	</div>
</template>
<script setup>
import { h, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { Icon } from '..';
import { Spin } from '../../spin';
import { Select } from '../../select';
import { Input } from '../../input';
import { Button } from '../../button';
import { Checkbox } from '../../checkbox';
import { Radio, RadioGroup } from '../../radio';
import { Switch } from '../../switch';
import { Tag } from '../../tag';
import { ColorPicker } from '../../color-picker';
import { Divider } from '../../divider';
import { Textarea } from '../../textarea';

// 对照项：每项一个 Select
const toData = (values, labels = {}) => values.map(value => ({ value, label: labels[value] || value }));
const CONTROLS = [
	{ key: 'fontSize', label: '文字 font-size', data: toData(['12', '14', '16', '20'], { 12: '12px', 14: '14px', 16: '16px', 20: '20px' }) },
	{ key: 'type', label: 'type', data: toData(['search', 'success', 'o-info', 'down']) }
];
const controls = reactive({ fontSize: '14', type: 'search' });

const INLINE_CASES = [
	{ key: 'default', label: 'Icon 不传 size' },
	{ key: 'size-12', label: 'Icon size 12', size: 12 },
	{ key: 'size-20-12', label: 'Icon size [20, 12]', size: [20, 12] },
	{ key: 'size-40-20-12', label: 'Icon size [[40, 20], 12]', size: [[40, 20], 12] },
	{ key: 'size-24', label: 'Icon size 24', size: 24 },
	{ key: 'spin-12', label: 'Spin size 12', spin: 12 },
	{ key: 'spin-20', label: 'Spin size 20', spin: 20 },
	{ key: 'spin-28', label: 'Spin size 28', spin: 28 }
];
// 行内组件：带文字的按文字基线、不带文字的按盒子中心，都应落在字符框中心
const COMPONENT_CASES = [
	{ key: 'button', label: 'Button', render: () => h(Button, null, () => '按钮') },
	{ key: 'button-icon', label: 'Button 只有图标', render: () => h(Button, { icon: 'search' }) },
	{ key: 'checkbox', label: 'Checkbox', render: () => h(Checkbox, { modelValue: true }, () => '选项') },
	{ key: 'checkbox-alone', label: 'Checkbox 无文字', render: () => h(Checkbox, { modelValue: true }) },
	{ key: 'radio', label: 'Radio', render: () => h(Radio, { modelValue: true }, () => '选项') },
	{
		key: 'radio-card',
		label: 'RadioGroup 卡片',
		render: () => h(RadioGroup, { modelValue: 'a', type: 'card' }, () => [
			h(Radio, { value: 'a' }, () => '选项一'),
			h(Radio, { value: 'b' }, () => '选项二')
		])
	},
	{ key: 'switch', label: 'Switch', render: () => h(Switch, { modelValue: true }) },
	{ key: 'tag', label: 'Tag', render: () => h(Tag, null, () => '标签') },
	{ key: 'tag-dot', label: 'Tag dot', render: () => h(Tag, { type: 'dot' }, () => '标签') },
	{ key: 'color-picker', label: 'ColorPicker', render: () => h(ColorPicker, { modelValue: '#456CF6' }) },
	{ key: 'divider', label: 'Divider 竖线', render: () => h(Divider, { vertical: true }) },
	{ key: 'input', label: 'Input', render: () => h(Input, { modelValue: '内容', style: 'width: 120px;' }) },
	{ key: 'textarea', label: 'Textarea 单行', render: () => h(Textarea, { modelValue: '内容', rows: 1, style: 'width: 120px;' }) }
];
const BOX_CASES = [
	{ key: 'select', label: 'Select 箭头' },
	{ key: 'input', label: 'Input append' }
];
const SELECT_DATA = toData(['选项一', '选项二', '选项三']);
const selectValue = ref('');

const probes = {};
const targets = {};
const boxes = {};
const setProbe = (key, el) => { probes[key] = el; };
const setTarget = (key, el) => { targets[key] = el?.$el || el; };
const setBox = (key, el) => { boxes[key] = el; };

const guides = reactive({});
const deltas = reactive({});

const centerOf = (el) => {
	const rect = el.getBoundingClientRect();
	return (rect.top + rect.bottom) / 2;
};

// 字符框中心在基线上方的距离：（字体上高 - 下高）/ 2，按元素的实际字体计算
const canvas = document.createElement('canvas').getContext('2d');
const charCenterOf = (el) => {
	const style = getComputedStyle(el);
	canvas.font = `${style.fontSize} ${style.fontFamily}`;
	const metrics = canvas.measureText('中');
	return (metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2;
};

// 图标中心与参考线（文字字符框中心或输入框中心）的偏差
const measure = () => {
	const fit = (key, el) => {
		const probe = probes[key];
		if (!probe || !el) return;
		const sample = probe.parentElement.getBoundingClientRect();
		const line = probe.getBoundingClientRect().bottom - charCenterOf(probe.parentElement);
		guides[key] = { top: `${line - sample.top}px` };
		deltas[key] = centerOf(el) - line;
	};
	INLINE_CASES.forEach(({ key }) => fit(key, targets[key]?.querySelector('svg')));
	// 组件的基线 = 盒子中心 + 自身字体字符框中心到基线的距离（基线占位在盒子里居中）；字号取组件里第一段文字，没有文字时取根节点
	COMPONENT_CASES.forEach(({ key }) => {
		const probe = probes[key];
		const root = targets[key]?.firstElementChild;
		if (!probe || !root) return;
		fit(key, root);
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		let node = walker.nextNode();
		while (node && !node.textContent.trim()) node = walker.nextNode();
		const fontEl = node ? node.parentElement : root;
		deltas[key] = centerOf(root) + charCenterOf(fontEl) - probe.getBoundingClientRect().bottom;
	});
	BOX_CASES.forEach(({ key }) => {
		const box = boxes[key];
		const input = box?.querySelector('.vc-input');
		const svg = box?.querySelector('.vc-input__append svg');
		if (!input || !svg) return;
		const line = centerOf(input);
		guides[key] = { top: `${line - box.getBoundingClientRect().top}px` };
		deltas[key] = centerOf(svg) - line;
	});
};

const format = v => (v === undefined ? '-' : `${v > 0.05 ? '+' : ''}${(Math.abs(v) < 0.05 ? 0 : v).toFixed(2)}px`);
// 字体度量会被取整，±0.5px 以内视为对齐
const toneOf = v => (v === undefined || Math.abs(v) <= 0.5 ? '' : 'is-off');

watch(controls, () => nextTick(measure));
onMounted(() => {
	nextTick(measure);
	// 字体加载完成后行高可能变化
	document.fonts?.ready.then(measure);
	window.addEventListener('resize', measure);
});
onBeforeUnmount(() => {
	window.removeEventListener('resize', measure);
});
</script>

<style lang="scss">
.icon-align {
	padding: 20px;

	&__controls {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;

		// 右上角留给主题与性能读数的按钮
		padding-right: 220px;

		.vc-select {
			width: 240px;
		}
	}

	&__item {
		display: grid;
		grid-template-columns: 220px 1fr 100px;
		align-items: center;
		padding: 8px 0;
		font-size: 13px;
		line-height: 20px;
		border-bottom: 1px solid #eee;

		> output {
			font-variant-numeric: tabular-nums;
			text-align: right;

			&.is-off {
				color: #f56c6c;
			}
		}
	}

	&__sample {
		position: relative;
		line-height: 40px;

		&.is-box {
			line-height: normal;
		}

		> .vc-icon,
		> .vc-spin {
			margin: 0 6px;
		}
	}

	&__guide {
		position: absolute;
		right: 0;
		left: 0;
		height: 1px;
		pointer-events: none;
		background: rgb(245 108 108 / 60%);
	}

	&__probe {
		display: inline-block;
		width: 0;
		height: 0;
	}
}
</style>
