<template>
	<div class="search-example">
		<div class="search-example__controls">
			<Select
				v-for="item in CONTROLS"
				:key="item.key"
				v-model="controls[item.key]"
				:data="item.data"
				:label="item.label"
			/>
		</div>

		<p>
			inline：点击后直接在输入框里输入，结果为命中路径的扁平列表（默认只列出末级，changeOnSelect 时任意一级可选）。
			自定义触发区内没有输入框，inline 会改用弹层搜索栏。
			键盘：↑ ↓ 在当前列内移动，← → 回到父级 / 进入子级，回车选中，Esc 关闭。
		</p>

		<div :style="{ width: `${controls.width}px` }">
			<Cascader
				:key="`${controls.trigger}-${controls.changeOnSelect}`"
				v-model="value"
				:data="data"
				:searchable="controls.searchable !== 'off' && controls.searchable"
				:change-on-select="controls.changeOnSelect === 'on'"
				search-placeholder="输入分组或条目名称"
				clearable
			>
				<template v-if="controls.trigger === 'custom'" #default="{ label }">
					<div class="search-example__trigger">
						{{ label.length ? label.join(' / ') : '点击选择' }}
					</div>
				</template>
			</Cascader>
		</div>
		<div>value: {{ value }}</div>
	</div>
</template>
<script setup>
import { reactive, ref } from 'vue';
import { Select } from '../../select';
import { Cascader } from '..';

// 对照项：每项一个 Select
const CONTROLS = [
	{
		key: 'searchable',
		label: '搜索方式',
		data: [{ value: 'inline', label: 'inline（触发器内输入）' }, { value: 'popover', label: 'popover（弹层搜索栏）' }, { value: 'off', label: '关闭' }]
	},
	{ key: 'changeOnSelect', label: 'changeOnSelect', data: [{ value: 'off', label: '关闭（只能选末级）' }, { value: 'on', label: '开启（任意一级）' }] },
	{ key: 'trigger', label: '触发区', data: [{ value: 'default', label: '内置输入框' }, { value: 'custom', label: '自定义插槽' }] },
	{ key: 'width', label: '宽度', data: [320, 200, 120].map(value => ({ value, label: `${value}px` })) }
];
const controls = reactive(Object.fromEntries(CONTROLS.map(({ key, data }) => [key, data[0].value])));

const data = ['A', 'B', 'C'].map(group => ({
	value: group,
	label: `分组 ${group}`,
	children: [1, 2, 3].map(sub => ({
		value: `${group}-${sub}`,
		label: `子分组 ${group}${sub}`,
		children: Array.from({ length: 12 }, (_, index) => ({
			value: `${group}-${sub}-${index + 1}`,
			label: `条目 ${group}${sub}-${index + 1}`
		}))
	}))
}));

const value = ref(['A', 'A-2', 'A-2-3']);
</script>
<style lang="scss">
.search-example {
	padding: 40px;

	// 右上角留给主题 / 变量 / 性能按钮
	&__controls {
		display: grid;
		max-width: 720px;
		margin-right: 220px;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
	}

	&__trigger {
		padding: 6px 12px;
		cursor: pointer;
		border: 1px dashed #999;
		border-radius: 8px;
	}
}
</style>
