<!-- size 的各种写法与 color：虚线为外层盒子（根元素），实线为图标（svg） -->
<template>
	<div class="icon-size">
		<div class="icon-size__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<p>不传 size 时跟随外层 font-size；传入后由 size 决定，不再受外层 font-size 影响</p>
		<div
			v-for="item in CASES"
			:key="item.label"
			class="icon-size__item"
		>
			<code>{{ item.label }}</code>
			<span>{{ item.desc }}</span>
			<div class="icon-size__preview" :style="{ fontSize: `${controls.fontSize}px` }">
				<Icon :type="controls.type" :size="item.size" :color="color" />
			</div>
		</div>

		<p>与文字混排：按 vertical-align: middle 对齐，是否传 size 都一致（中文旁比文字中心低约 0.1em）</p>
		<div class="icon-size__text">
			文字
			<Icon :type="controls.type" :color="color" />
			文字
			<Icon :type="controls.type" :size="12" :color="color" />
			文字
			<Icon :type="controls.type" :size="[20, 12]" :color="color" />
			文字
			<Icon :type="controls.type" :size="[[40, 20], 12]" :color="color" />
			文字
		</div>

		<p>需要精确居中时，放进 align-items: center 的 flex 容器</p>
		<div class="icon-size__center">
			<span>文字</span>
			<Icon :type="controls.type" :color="color" />
			<span>文字</span>
			<Icon :type="controls.type" :size="12" :color="color" />
			<span>文字</span>
			<Icon :type="controls.type" :size="[20, 12]" :color="color" />
			<span>文字</span>
			<Icon :type="controls.type" :size="[[40, 20], 12]" :color="color" />
			<span>文字</span>
		</div>

		<p>flex 容器空间不足时，外层盒子不被压缩</p>
		<div class="icon-size__flex">
			<Icon :type="controls.type" :size="[32, 16]" :color="color" />
			<span>内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容</span>
		</div>
	</div>
</template>
<script setup>
import { computed, reactive } from 'vue';
import { Icon } from '..';
import { Select } from '../../select';

// 对照项：每项一个 Select
const toData = (values, labels = {}) => values.map(value => ({ value, label: labels[value] || value }));
const CONTROLS = [
	{ key: 'type', label: 'type', data: toData(['search', 'success', 'close', 'o-info']) },
	{ key: 'color', label: 'color', data: toData(['none', '#456CF6', '#F5222D'], { none: '不传（继承文字颜色）' }) },
	{ key: 'fontSize', label: '外层 font-size', data: toData(['14', '24', '40'], { 14: '14px', 24: '24px', 40: '40px' }) }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));
const color = computed(() => (controls.color === 'none' ? undefined : controls.color));

const CASES = [
	{ label: '不传', desc: '外层与图标均为 1em', size: undefined },
	{ label: '12', desc: '外层 12×12，图标 12×12，font-size 12', size: 12 },
	{ label: '[20, 12]', desc: '外层 20×20，图标 12×12，font-size 12', size: [20, 12] },
	{ label: '[[20], [12]]', desc: '同上', size: [[20], [12]] },
	{ label: '[[100, 24], 12]', desc: '外层 100×24，图标 12×12，font-size 12', size: [[100, 24], 12] },
	{ label: '[[100, 24], [12, 12]]', desc: '同上', size: [[100, 24], [12, 12]] },
	{ label: '[[100, 24]]', desc: '外层 100×24，图标 100×24，font-size 24', size: [[100, 24]] },
	{ label: '[[24, 100]]', desc: '外层 24×100，图标 24×100，font-size 24', size: [[24, 100]] }
];
</script>

<style lang="scss">
.icon-size {
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
		grid-template-columns: 200px 300px 1fr;
		align-items: center;
		padding: 8px 0;
		font-size: 13px;
		line-height: 20px;
		border-bottom: 1px solid #eee;
	}

	&__text,
	&__center {
		font-size: 14px;
		line-height: 40px;
	}

	&__center {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	&__flex {
		display: flex;
		width: 120px;
		font-size: 14px;
		line-height: 20px;
		white-space: nowrap;
		align-items: center;
	}

	// 仅演示区域描边，不影响上方 Select 内的图标
	&__item,
	&__text,
	&__center,
	&__flex {
		.vc-icon {
			outline: 1px dashed #f56c6c;

			> svg {
				outline: 1px solid #409eff;
			}
		}
	}
}
</style>
