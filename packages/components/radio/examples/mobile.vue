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

		<div class="demo__title">分组样式（type）</div>
		<div class="demo__card demo__stack">
			<MRadioGroup v-for="type in types" :key="type" v-model="typed" :type="type">
				<MRadio value="a" label="选项 1" />
				<MRadio value="b" label="选项 2" />
				<MRadio value="c" label="选项 3" />
				<MRadio value="d" label="禁用" disabled />
			</MRadioGroup>
		</div>

		<div class="demo__title">尺寸（size）</div>
		<div class="demo__card demo__stack">
			<MRadioGroup v-model="size" type="capsule" :size="size">
				<MRadio v-for="item in sizes" :key="item" :value="item" :label="item" />
			</MRadioGroup>
			<MRadioGroup v-model="typed" type="button" :size="size">
				<MRadio value="a" label="选项 1" />
				<MRadio value="b" label="选项 2" />
				<MRadio value="c" label="选项 3" />
			</MRadioGroup>
			<MRadioGroup v-model="typed" type="card" :size="size">
				<MRadio value="a" label="选项 1" />
				<MRadio value="b" label="选项 2" />
				<MRadio value="c" label="选项 3" />
			</MRadioGroup>
		</div>

		<div class="demo__title">选项较多时换行（button / round）</div>
		<div class="demo__card demo__stack">
			<MRadioGroup v-model="many" type="button">
				<MRadio v-for="item in options" :key="item" :value="item" :label="item" />
			</MRadioGroup>
			<MRadioGroup v-model="many" type="round">
				<MRadio v-for="item in options" :key="item" :value="item" :label="item" />
			</MRadioGroup>
		</div>

		<div class="demo__title">竖排按钮（type="button" vertical）</div>
		<div class="demo__card">
			<MRadioGroup v-model="typed" type="button" vertical style="width: 100%;">
				<MRadio value="a" label="选项 1" />
				<MRadio value="b" label="选项 2" />
				<MRadio value="c" label="选项 3" />
			</MRadioGroup>
		</div>

		<div class="demo__title">与圆点项混用（MRadioButton）</div>
		<div class="demo__card">
			<MRadioGroup v-model="mixed">
				<MRadioButton value="a" label="按钮 1" />
				<MRadioButton value="b" label="按钮 2" />
				<MRadio value="c" label="选项 3" />
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
import { MRadio, MRadioButton, MRadioGroup } from '../index.m';
import { MForm, MFormItem } from '../../form/index.m';

const single = ref(false);
const vertical = ref('b');
const horizontal = ref('b');
const form = reactive({ value: 'a' });

const types = ['button', 'card', 'capsule', 'text', 'round'];
const typed = ref('a');
const sizes = ['mini', 'small', 'medium', 'large'];
const size = ref('medium');
const options = ['选项一', '选项二', '选项三', '选项四', '选项五', '选项六', '选项七', '选项八'];
const many = ref('选项一');
const mixed = ref('a');
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

.demo__stack {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 12px;
}
</style>
