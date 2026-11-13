<template>
	<div class="vcm-cascader-basic">
		<MForm ref="form" :model="model" label-width="auto">
			<MFormItem prop="value" label="基础用法" required="请选择条目">
				<MCascader v-model="model.value" :data="data" title="选择条目" />
			</MFormItem>
			<MFormItem prop="anyLevel" label="任意一级">
				<MCascader v-model="model.anyLevel" :data="data" title="选择条目" change-on-select />
			</MFormItem>
			<MFormItem prop="confirmed" label="确定后提交">
				<MCascader v-model="model.confirmed" :data="data" title="选择条目" confirm clearable />
			</MFormItem>
			<MFormItem prop="child" label="只提交最后一级">
				<MCascader v-model="model.child" :data="data" check-strategy="child" clearable />
			</MFormItem>
			<MFormItem prop="searched" label="搜索">
				<MCascader
					v-model="model.searched"
					:data="data"
					searchable
					search-placeholder="输入关键词，空格分隔"
				/>
			</MFormItem>
			<MFormItem prop="custom" label="自定义触发区">
				<MCascader v-model="model.custom" :data="data">
					<template #default="{ label }">
						<div class="vcm-cascader-basic__trigger">
							{{ label.length ? label.join(' → ') : '点击选择' }}
						</div>
					</template>
				</MCascader>
			</MFormItem>
		</MForm>
		<div class="vcm-cascader-basic__actions">
			<MButton type="primary" @click="handleValidate">
				提交
			</MButton>
			<MButton @click="handleOpen">
				MCascader.open
			</MButton>
		</div>
		<div v-for="(v, key) in { ...model, opened }" :key="key" class="vcm-cascader-basic__output">
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
import { MCascader } from '../index.m';

// 三级数据，第二组的条目较多，用于看长列表的滚动与选中项居中
const data = [
	{
		value: 'a',
		label: '分组 A',
		children: [
			{
				value: 'a-1',
				label: '条目 A-1',
				children: [
					{ value: 'a-1-1', label: '细项 A-1-1' },
					{ value: 'a-1-2', label: '细项 A-1-2' },
					{ value: 'a-1-3', label: '细项 A-1-3', disabled: true }
				]
			},
			{ value: 'a-2', label: '条目 A-2', children: [{ value: 'a-2-1', label: '细项 A-2-1' }] },
			{ value: 'a-3', label: '条目 A-3' }
		]
	},
	{
		value: 'b',
		label: '分组 B',
		children: Array.from({ length: 30 }, (_, i) => ({
			value: `b-${i + 1}`,
			label: `条目 B-${i + 1}`,
			children: [
				{ value: `b-${i + 1}-1`, label: `细项 B-${i + 1}-1` },
				{ value: `b-${i + 1}-2`, label: `细项 B-${i + 1}-2` }
			]
		}))
	},
	{ value: 'c', label: '分组 C（不可选）', disabled: true }
];

const form = ref(null);
const model = reactive({
	value: [],
	anyLevel: [],
	confirmed: ['b', 'b-20', 'b-20-2'],
	child: 'a-2-1',
	searched: [],
	custom: []
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

const handleOpen = () => {
	MCascader.open({
		value: opened.value,
		data,
		title: '直接调用',
		onOk: (v) => {
			opened.value = v;
		}
	});
};
</script>

<style lang="scss">
.vcm-cascader-basic {
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
}
</style>
