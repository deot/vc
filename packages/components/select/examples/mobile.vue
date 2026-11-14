<template>
	<div class="vcm-select-basic">
		<MForm ref="form" :model="model" label-width="auto">
			<MFormItem prop="single" label="单选" required="请选择条目">
				<MSelect v-model="model.single" :data="data" title="选择条目" />
			</MFormItem>
			<MFormItem prop="cleared" label="可清空">
				<MSelect v-model="model.cleared" :data="data" title="选择条目" clearable />
			</MFormItem>
			<MFormItem prop="confirmed" label="确定后提交">
				<MSelect v-model="model.confirmed" :data="data" title="选择条目" confirm />
			</MFormItem>
			<MFormItem prop="limited" label="多选（最多 3 项）">
				<MSelect v-model="model.limited" :data="data" :max="3" title="选择条目" clearable />
			</MFormItem>
			<MFormItem prop="unlimited" label="多选（不限）">
				<MSelect
					v-model="model.unlimited"
					:data="data"
					:max="0"
					title="选择条目"
					confirm="bottom"
					clearable
					searchable
				/>
			</MFormItem>
			<MFormItem prop="grouped" label="分组 + 搜索">
				<MSelect
					v-model="model.grouped"
					:data="groupedData"
					title="选择条目"
					searchable
					search-placeholder="输入关键词，空格分隔"
				/>
			</MFormItem>
			<MFormItem prop="described" label="说明文字">
				<MSelect v-model="model.described" :data="describedData" title="选择方案" />
			</MFormItem>
			<MFormItem prop="custom" label="自定义选项">
				<MSelect v-model="model.custom" :data="describedData" :max="0" title="选择方案">
					<template #label="{ label, row, selected }">
						<span class="vcm-select-basic__tag" :class="{ 'is-selected': selected }">{{ row.tag }}</span>
						{{ label }}
					</template>
				</MSelect>
			</MFormItem>
			<MFormItem prop="text" label="字符串多选">
				<MSelect v-model="model.text" :data="data" :max="0" separator=";" />
			</MFormItem>
			<MFormItem prop="trigger" label="自定义触发区">
				<MSelect v-model="model.trigger" :data="data">
					<template #default="{ label }">
						<div class="vcm-select-basic__trigger">
							{{ label.length ? label.join(' / ') : '点击选择' }}
						</div>
					</template>
				</MSelect>
			</MFormItem>
		</MForm>
		<div class="vcm-select-basic__actions">
			<MButton type="primary" @click="handleValidate">
				提交
			</MButton>
		</div>
		<div class="vcm-select-basic__actions">
			<MButton @click="handleOpen(false)">
				open
			</MButton>
			<MButton @click="handleOpen('top')">
				open top
			</MButton>
			<MButton @click="handleOpen('bottom')">
				open bottom
			</MButton>
		</div>
		<div v-for="(v, key) in { ...model, opened }" :key="key" class="vcm-select-basic__output">
			<span>{{ key }}</span>
			<code>{{ stringify(v) }}</code>
		</div>
	</div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { MForm, MFormItem } from '../../form/index.m';
import { MButton } from '../../button/index.m';
import { MToast } from '../../toast/index.m';
import { MSelect } from '../index.m';

// 条目较多，用于看长列表的滚动与选中项居中
const data = Array.from({ length: 30 }, (_, i) => ({
	value: i + 1,
	label: `条目 ${i + 1}`,
	disabled: i === 2
}));

const groupedData = [
	{
		value: 'a',
		label: '分组 A',
		children: Array.from({ length: 8 }, (_, i) => ({ value: `a-${i + 1}`, label: `条目 A-${i + 1}` }))
	},
	{
		value: 'b',
		label: '分组 B',
		children: Array.from({ length: 8 }, (_, i) => ({ value: `b-${i + 1}`, label: `条目 B-${i + 1}` }))
	},
	{
		value: 'c',
		label: '分组 C',
		children: Array.from({ length: 8 }, (_, i) => ({ value: `c-${i + 1}`, label: `条目 C-${i + 1}` }))
	}
];

const describedData = [
	{ value: 1, label: '方案一', tag: '推荐', description: '说明文字第一行' },
	{ value: 2, label: '方案二', tag: '常用', description: '说明文字较长时自动换行，说明文字较长时自动换行' },
	{ value: 3, label: '方案三', tag: '备选' },
	{ value: 4, label: '方案四', tag: '停用', description: '不可选', disabled: true }
];

const form = ref(null);
const model = reactive({
	single: undefined,
	cleared: 12,
	confirmed: undefined,
	limited: [],
	unlimited: [1, 2],
	grouped: undefined,
	described: undefined,
	custom: [],
	text: '',
	trigger: []
});
const opened = ref([]);

const stringify = v => JSON.stringify(v);

const handleValidate = async () => {
	try {
		await form.value.validate();
		MToast.info('校验通过');
	} catch (e) {
		console.log(e);
	}
};

const handleOpen = (confirm) => {
	MSelect.open({
		value: opened.value,
		data,
		max: confirm ? 0 : 1,
		confirm,
		clearable: true,
		searchable: true,
		title: '直接调用',
		onOk: (v) => {
			opened.value = v;
		}
	});
};
</script>

<style lang="scss">
.vcm-select-basic {
	&__actions {
		display: flex;
		padding: 12px 16px;
		gap: 12px;

		> * {
			flex: 1;
		}
	}

	&__output {
		display: grid;
		padding: 6px 12px 10px;
		font-size: 13px;
		border-bottom: 1px solid #eee;
		grid-template-columns: 110px minmax(0, 1fr);
		gap: 8px;

		code {
			word-break: break-all;
			white-space: pre-wrap;
		}
	}

	&__trigger {
		font-size: 14px;
		text-align: right;
	}

	&__tag {
		display: inline-block;
		padding: 0 6px;
		margin-right: 6px;
		font-size: 11px;
		font-weight: 400;
		line-height: 18px;
		color: #fff;
		background: var(--vc-color-neutral);
		border-radius: 4px;

		&.is-selected {
			background: var(--vc-color-primary);
		}
	}
}
</style>
