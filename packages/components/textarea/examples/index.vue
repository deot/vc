<template>
	<div>
		<h2>状态对比</h2>
		<div class="textarea-state-examples">
			<Textarea placeholder="普通文本域" />
			<Textarea disabled placeholder="禁用文本域：空值" />
			<Textarea disabled model-value="禁用文本域：已有内容" />
		</div>
		<h2>移动端状态对比</h2>
		<div class="textarea-state-examples">
			<MTextarea placeholder="普通移动端文本域" />
			<MTextarea disabled placeholder="禁用移动端文本域：空值" />
			<MTextarea disabled model-value="禁用移动端文本域：已有内容" />
		</div>
		<Textarea
			v-model="value"
			placeholder="显示placeholder"
			@change="handleChange"
			@focus="handleFocus"
			@blur="handleBlur"
			@enter="handleEnter"
		/>
		<br>
		<br>
		<br>
		<br>
		<Form
			ref="formValidate"
			:label-width="96"
			style="padding-left: 56px; margin-top: 21px"
			@submit.prevent
		>
			<FormItem label="test">
				<Textarea
					v-model="value"
					:autosize="{ maxRows: 2 }"
				/>
			</FormItem>
			<FormItem label="test">
				<Textarea
					v-model="value"
				/>
			</FormItem>
			<FormItem label="test">
				<Textarea
					v-model="value"
					:autosize="{ maxRows: 2 }"
				/>
			</FormItem>
			<FormItem label="test">
				<Textarea
					v-model="value"
				/>
			</FormItem>
			<FormItem label="test1">
				<Textarea
					v-model="value"
					:maxlength="200"
					indicator
				/>
			</FormItem>
		</Form>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Textarea } from '..';
import { MTextarea } from '../index.m';
import { Form, FormItem } from '../../form/index';

const value = ref('');

setTimeout(() => {
	value.value = 9999;
}, 3000);

const handleChange = () => {
	console.log(value.value);
};

const handleFocus = () => {
	console.log('聚焦的回调');
};

const handleBlur = () => {
	console.log('失焦的回调');
};

const handleEnter = () => {
	console.log('回车键的回调');
};
</script>
<style scoped>
.textarea-state-examples {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-bottom: 16px;
}

.textarea-state-examples > * {
	width: 280px;
	max-width: 100%;
}
</style>
