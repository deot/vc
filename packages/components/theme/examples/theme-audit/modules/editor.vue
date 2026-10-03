<template>
	<div class="audit-stack">
		<Button @click="disabled = !disabled">{{ disabled ? '允许编辑' : '禁用编辑' }}</Button>
		<Editor
			v-model="value" :disabled="disabled" :previewable="false" :options="options"
			class="audit-editor"
		/>
		<div class="audit-sample">
			<div class="audit-sample__label">只读引用 / 表格</div>
			<EditorView :value="value + table" />
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Editor, EditorView, Button } from '@deot/vc';

const disabled = ref(false);
const value = ref('<p>主题编辑器 <strong>正文</strong> <a href="#">链接</a></p><blockquote>引用内容</blockquote><p>工具栏：颜色、字号与链接浮层</p>');
const options = { toolbar: ['bold', 'italic', 'underline', 'color', 'line-height', 'font-size', 'link', 'table'] };
const table = '<table><tbody><tr><td>名称</td><td>值</td></tr>'
	+ '<tr><td>主题</td><td>当前配置</td></tr></tbody></table>';
</script>
