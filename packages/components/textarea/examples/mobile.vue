<template>
	<div class="m-textarea-demo">
		<div class="m-textarea-demo__title">
			基础用法（375 宽下内边距 16，文字 16 / 行高 22，默认 2 行）
		</div>
		<MTextarea v-model="text" placeholder="请输入内容" />

		<div class="m-textarea-demo__title">
			字数统计（右下角，与文字间距 4；超出上限时为错误色）
		</div>
		<MTextarea v-model="note" :maxlength="100" indicator placeholder="最多 100 字" />
		<MTextarea v-model="limited" :maxlength="10" :indicator="{ inverted: true }" placeholder="显示剩余字数" />
		<MTextarea v-model="exceeded" :maxlength="10" indicator />

		<div class="m-textarea-demo__title">
			自适应高度（3 至 6 行）
		</div>
		<MTextarea v-model="feedback" :autosize="{ minRows: 3, maxRows: 6 }" placeholder="请输入反馈，超过 6 行后滚动" />

		<div class="m-textarea-demo__title">
			右对齐、禁用
		</div>
		<MTextarea v-model="remark" right :rows="1" placeholder="右对齐" />
		<MTextarea model-value="不可编辑的内容" disabled />

		<div class="m-textarea-demo__title">
			表单中（去掉内边距，首行与标签对齐）
		</div>
		<MForm :model="form">
			<MFormItem label="名称" prop="name">
				<MInput v-model="form.name" placeholder="请输入名称" />
			</MFormItem>
			<MFormItem label="说明" prop="note">
				<MTextarea v-model="form.note" autosize :maxlength="50" indicator placeholder="请输入说明" />
			</MFormItem>
		</MForm>
	</div>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { MTextarea } from '../index.m';
import { MInput } from '../../input/index.m';
import { MForm, MFormItem } from '../../form/index.m';

const text = ref('');
const note = ref('');
const limited = ref('');
// 外部直接赋值超过 maxlength 时，计数显示为错误色
const exceeded = ref('这段内容由外部直接赋值，超过了上限');
const feedback = ref('');
const remark = ref('');
const form = reactive({
	name: '',
	note: ''
});
</script>
<style lang="scss">
.m-textarea-demo {
	min-height: 100vh;
	padding-bottom: 24px;
	background: var(--vc-background-color-light);

	&__title {
		padding: calc(var(--vc-rem) * 24) calc(var(--vc-rem) * 32);
		font-size: calc(var(--vc-rem) * 28);
		color: var(--vc-color-dark-extralight);
	}

	.vcm-textarea + .vcm-textarea {
		margin-top: calc(var(--vc-rem) * 16);
	}
}
</style>
