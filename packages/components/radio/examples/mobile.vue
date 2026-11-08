<template>
	<div class="demo">
		<div class="demo__title">默认</div>
		<div class="demo__card">
			<MRadio v-model="single" label="选项内容" />
			<MRadio :model-value="true" label="选项内容" style="margin-left: 24px;" />
		</div>

		<div class="demo__title">禁用</div>
		<div class="demo__card">
			<MRadio disabled label="未选中禁用" />
			<MRadio :model-value="true" disabled label="选中禁用" style="margin-left: 24px;" />
		</div>

		<div class="demo__title">竖排分组（vertical）</div>
		<div class="demo__card">
			<MRadioGroup v-model="vertical" vertical>
				<MRadio value="a" label="选项内容 1" />
				<MRadio value="b" label="选项内容 2" />
				<MRadio value="c" label="选项内容 3" />
			</MRadioGroup>
		</div>

		<div class="demo__title">横排分组</div>
		<div class="demo__card">
			<MRadioGroup v-model="horizontal">
				<MRadio value="a" label="选项 1" />
				<MRadio value="b" label="选项 2" />
				<MRadio value="c" label="选项 3" disabled />
			</MRadioGroup>
		</div>

		<div class="demo__title">整组禁用</div>
		<div class="demo__card">
			<MRadioGroup model-value="a" disabled>
				<MRadio value="a" label="选项 1" />
				<MRadio value="b" label="选项 2" />
			</MRadioGroup>
		</div>

		<div class="demo__title">表单中</div>
		<MForm :model="form" @submit.prevent>
			<MFormItem prop="value" label="选项">
				<MRadioGroup v-model="form.value">
					<MRadio value="a" label="选项 1" />
					<MRadio value="b" label="选项 2" />
				</MRadioGroup>
			</MFormItem>
		</MForm>
	</div>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { MRadio, MRadioGroup } from '../index.m';
import { MForm, MFormItem } from '../../form/index.m';

const single = ref(false);
const vertical = ref('b');
const horizontal = ref('b');
const form = reactive({ value: 'a' });
</script>
<style scoped>
.demo {
	min-height: 100vh;
	background: #f7f8fa;
}

.demo__title {
	padding: 16px 16px 8px;
	font-size: 14px;
	color: #86909c;
}

.demo__card {
	padding: 12px 16px;
	background: #fff;
}
</style>
