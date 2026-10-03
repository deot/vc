<template>
	<div class="audit-stack">
		<Button @click="formError = formError ? '' : '请输入内容'">{{ formError ? '清除校验错误' : '展示校验错误' }}</Button>
		<component :is="mobile ? MForm : Form" :model="formData" border :label-width="80" @submit.prevent>
			<component :is="mobile ? MFormItem : FormItem" label="普通" prop="normal">
				<component :is="mobile ? MInput : Input" v-model="formData.normal" />
			</component>
			<component :is="mobile ? MFormItem : FormItem" label="必填" prop="required" required :error="formError">
				<component :is="mobile ? MInput : Input" :model-value="formData.required" placeholder="校验错误" />
			</component>
			<component :is="mobile ? MFormItem : FormItem" label="禁用" prop="disabled">
				<component :is="mobile ? MInput : Input" :model-value="formData.disabled" disabled />
			</component>
		</component>
	</div>
</template>
<script setup>
import { reactive, ref } from 'vue';
import { Form, FormItem, Input, Button, MForm, MFormItem, MInput } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const formData = reactive({ normal: '普通字段', required: '', disabled: '禁用字段' });
const formError = ref('');
</script>
