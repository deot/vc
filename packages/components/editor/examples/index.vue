<template>
	<Form
		ref="form"
		:model="formData"
		style="padding: 20px; "
		@submit.prevent
	>
		<FormItem prop="useDefaultOptions" label="默认导航栏">
			<Switch v-model="formData.useDefaultOptions">{{ formData.useDefaultOptions ? '默认' : '自定义' }}</Switch>
		</FormItem>
		<FormItem prop="value" required="请输入内容">
			<Editor
				ref="editor"
				:key="formData.useDefaultOptions"
				v-model="formData.value"
				:disabled="disabled"
				:options="formData.useDefaultOptions ? {} : customEditorOption"
				:preview="false"
				style="width: 100%;height: 500px"
				@change="handleInput"
			/>
		</FormItem>
		<EditorView :value="formData.value" />
		<Button @click="handleSubmit">
			提交
		</Button>
	</Form>
</template>
<script setup>
import { ref, reactive } from 'vue';
import { Form, FormItem } from '../../form';
import { Button } from '../../button';
import { Switch } from '../../switch';
import { Editor, EditorView } from '../index';

import { VcInstance } from '../../vc';

VcInstance.configure({
	Upload: {
		onRequest: (options) => {
			return new Promise((resolve) => {
				resolve({
					...options,
					url: 'https://httpbin.org/post',
					body: {
						timestamp: new Date().getTime(),
						...options.body
					},
					headers: {}
				});
			});
		},
		onResponse: (request, options) => {
			const file = options.file;
			return new Promise((resolve, reject) => {
				let response;
				try {
					response = JSON.parse(request.response || request.responseText);
				} catch (e) {
					reject(e);
				};
				// 模拟强制返回
				resolve({
					value: response.files.file,
					type: `.${file.name.split('.').pop()}`,
					title: file.name,
					size: file.size
				});
			});
		}
	}
});

const form = ref();
const customEditorOption = ref({
	toolbar: ['bold', 'italic', 'underline', 'strike', 'color', 'line-height', 'font-size', 'link']
});
const disabled = ref(false);
const formData = reactive({
	useDefaultOptions: true,
	value: '<p><img src="https://dummyimage.com/300x200/555/fff/?text=5" contenteditable="true" ></p>'
});

const handleSubmit = async () => {
	await form.value.validate();
	console.log('Success!');
};

const handleInput = () => {

};
</script>
