<template>
	<div class="m-input-demo">
		<div class="m-input-demo__title">
			基础用法（375 宽下一整行高 54；聚焦且有值时显示清空图标）
		</div>
		<MInput v-model="text" clearable placeholder="请输入内容" />
		<MInput v-model="empty" clearable placeholder="请输入内容" />

		<div class="m-input-demo__title">
			前置 / 后置
		</div>
		<MInput v-model="account" prepend="search" clearable placeholder="前置图标" />
		<MInput v-model="code" clearable placeholder="请输入验证码" maxlength="6">
			<template #append>
				<MButton size="small" type="primary" round>
					获取验证码
				</MButton>
			</template>
		</MInput>

		<div class="m-input-demo__title">
			右对齐、禁用
		</div>
		<MInput v-model="amount" right placeholder="0.00" />
		<MInput model-value="不可编辑的内容" disabled />

		<div class="m-input-demo__title">
			表单中（去掉行高与左右内边距，与标签对齐）
		</div>
		<MForm :model="form">
			<MFormItem label="名称" prop="name">
				<MInput v-model="form.name" clearable placeholder="请输入名称" />
			</MFormItem>
			<MFormItem label="数量" prop="count">
				<MInputNumber v-model="form.count" :max="10" />
			</MFormItem>
			<MFormItem label="金额" prop="amount">
				<MInputNumber v-model="form.amount" :step="false" :precision="2" placeholder="无步进按钮时与 MInput 一致" />
			</MFormItem>
		</MForm>

		<div class="m-input-demo__title">
			数字输入框（按钮 28、输入区 40、字号 14；到达边界的按钮变浅）
		</div>
		<MList>
			<MListItem label="默认" :arrow="false">
				<template #extra>
					<MInputNumber v-model="count[0]" :max="10" @tip="handleTip" />
				</template>
			</MListItem>
			<MListItem label="小数（步长 0.1）" :arrow="false">
				<template #extra>
					<MInputNumber v-model="count[1]" :step="0.1" :precision="1" :max="2.5" />
				</template>
			</MListItem>
			<MListItem label="允许负数" :arrow="false">
				<template #extra>
					<MInputNumber v-model="count[2]" :min="-5" :max="5" />
				</template>
			</MListItem>
			<MListItem label="异步确认（1 秒后失败）" :arrow="false">
				<template #extra>
					<MInputNumber v-model="count[3]" :max="10" @after="handleAfter" />
				</template>
			</MListItem>
			<MListItem label="禁用" :arrow="false">
				<template #extra>
					<MInputNumber v-model="count[5]" disabled />
				</template>
			</MListItem>
		</MList>

		<div class="m-input-demo__title">
			数字输入框：theme（fill / border）× shape（square / circle）
		</div>
		<MList>
			<MListItem v-for="item in styles" :key="item.label" :label="item.label" :arrow="false">
				<template #extra>
					<MInputNumber v-model="item.value" :theme="item.theme" :shape="item.shape" :max="10" />
				</template>
			</MListItem>
		</MList>

		<div class="m-input-demo__title">
			数字输入框，无步进按钮（与 MInput 一致：整行、白底、左对齐）
		</div>
		<MInputNumber v-model="count[4]" :step="false" clearable placeholder="请输入数量" />

		<div class="m-input-demo__title">
			搜索框（有值时显示清空图标；聚焦时显示取消）
		</div>
		<MInputSearch v-model="keyword" clearable placeholder="搜索" @enter="handleEnter" @cancel="handleCancel" />

		<div class="m-input-demo__title">
			搜索框：theme=inverted（浅灰底、白色输入框）、shape=square（方角）
		</div>
		<MInputSearch v-model="keyword" theme="inverted" placeholder="inverted" />
		<MInputSearch v-model="keyword" shape="square" placeholder="square" />
		<MInputSearch v-model="keyword" theme="inverted" shape="square" placeholder="inverted + square" />
		<div class="m-input-demo__log">
			{{ log || '回车或取消后在这里显示' }}
		</div>
	</div>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { MInput, MInputNumber, MInputSearch } from '../index.m';
import { MButton } from '../../button/index.m';
import { MForm, MFormItem } from '../../form/index.m';
import { MList, MListItem } from '../../list/index.m';

const text = ref('一段输入内容');
const empty = ref('');
const account = ref('');
const code = ref('');
const amount = ref('');
const form = reactive({ name: '', count: 1, amount: undefined });
const count = ref([1, 0.5, 0, 2, 3, 4]);
const keyword = ref('');
const styles = ref([
	{ label: 'fill + square（默认）', theme: 'fill', shape: 'square', value: 1 },
	{ label: 'fill + circle', theme: 'fill', shape: 'circle', value: 2 },
	{ label: 'border + square', theme: 'border', shape: 'square', value: 3 },
	{ label: 'border + circle', theme: 'border', shape: 'circle', value: 10 }
]);
const log = ref('');

const handleTip = ({ value }) => {
	log.value = `超出范围：${value}`;
};

const handleAfter = () => {
	return new Promise((_, reject) => {
		setTimeout(() => reject(new Error('rejected')), 1000);
	});
};

const handleEnter = () => {
	log.value = `搜索：${keyword.value}`;
};

const handleCancel = () => {
	log.value = '已取消';
};
</script>
<style lang="scss">
.m-input-demo {
	min-height: 100vh;
	padding-bottom: 24px;
	background: var(--vc-background-color-light);

	&__title {
		padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-extralight);
	}

	&__log {
		padding: calc(var(--vc-rem) * 16) calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-lighter);
	}
}
</style>
