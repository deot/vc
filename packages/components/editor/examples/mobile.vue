<template>
	<div class="m-editor-demo">
		<div class="m-editor-demo__title">
			默认：聚焦时工具栏停在键盘上方（toolbarPlacement="keyboard"）；选择项用动作面板，颜色、链接用底部弹出层
		</div>
		<MEditor v-model="value" :disabled="disabled" class="m-editor-demo__input" />
		<div class="m-editor-demo__actions">
			<MButton size="small" @click="disabled = !disabled">
				{{ disabled ? '启用' : '禁用' }}
			</MButton>
			<MButton size="small" @click="value = ''">
				清空
			</MButton>
		</div>

		<div class="m-editor-demo__title">
			工具栏固定在顶部（toolbarPlacement="top"），精简工具
		</div>
		<MEditor
			v-model="value"
			toolbar-placement="top"
			:options="{ toolbar: [['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['color', 'link', 'upload/image']] }"
			class="m-editor-demo__input"
		/>

		<div class="m-editor-demo__title">
			提及（mentionOptions）：输入 @ 后出现跟随光标的下拉；点按插入提及
		</div>
		<MEditor v-model="mentionValue" :mention-options="mentionOptions" class="m-editor-demo__input" />

		<div class="m-editor-demo__title">
			MEditorView：点击图片用移动端查看器预览
		</div>
		<MEditorView :value="value" class="m-editor-demo__view" />
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MEditor, MEditorView } from '../index.m';
import { MButton } from '../../button/index.m';

const createImage = (color, text) => {
	const svg = [
		'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">',
		`<rect width="300" height="200" fill="${color}"/>`,
		`<text x="150" y="108" font-size="24" fill="#fff" text-anchor="middle">${text}</text>`,
		'</svg>'
	].join('');
	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const value = ref([
	'<h2>标题</h2>',
	'<p>选中文字后点击工具栏的<strong>加粗</strong>、颜色或链接。</p>',
	'<ol><li>第一项</li><li>第二项</li></ol>',
	`<p><img src="${createImage('#5b8ff9', '图片 A')}"></p>`
].join(''));
const disabled = ref(false);
const USERS = Array.from({ length: 20 }, (_, index) => ({ value: `u${index + 1}`, label: `成员${index + 1}` }));
const mentionValue = ref('');
const mentionOptions = { data: USERS };
</script>
<style>
.m-editor-demo {
	padding: calc(var(--vc-rem) * 32);
}

.m-editor-demo__title {
	margin: calc(var(--vc-rem) * 32) 0 calc(var(--vc-rem) * 16);
	font-size: calc(var(--vc-rem) * 26);
	color: var(--vc-color-dark-light);
}

.m-editor-demo__input {
	width: 100%;
	height: calc(var(--vc-rem) * 560);
}

.m-editor-demo__actions {
	display: flex;
	margin-top: calc(var(--vc-rem) * 16);
	gap: calc(var(--vc-rem) * 16);
}

.m-editor-demo__view {
	padding: calc(var(--vc-rem) * 24);
	border-radius: calc(var(--vc-rem) * 8);
}
</style>
