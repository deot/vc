<!-- 提及：mentionOptions 开启；选中后插入原子的提及节点（整体删除、保存 value），Editor.getMentions 从 HTML 取出提及 -->
<template>
	<div class="editor-mention">
		<p>输入 @ 提及成员、# 插入话题；↑ ↓ 移动、Enter 选中、Esc 关闭。提及节点整体选中、整体删除，撤销 / 重做照常。</p>
		<Editor
			v-model="value"
			:mention-options="mentionOptions"
			style="width: 100%; height: 260px"
			@mention-select="handleSelect"
		/>
		<div class="editor-mention__output">
			<div>mention-select：{{ selected }}</div>
			<div>Editor.getMentions：{{ mentions }}</div>
			<code>{{ value }}</code>
		</div>
		<h4>EditorView：显示与编辑区一致</h4>
		<EditorView :value="value" />
	</div>
</template>
<script setup>
import { computed, ref } from 'vue';
import { Editor, EditorView } from '../index';

const USERS = Array.from({ length: 30 }, (_, index) => ({ value: `u${index + 1}`, label: `成员${index + 1}` }));
const TOPICS = [{ value: 't1', label: '话题一' }, { value: 't2', label: '话题二' }, { value: 't3', label: '话题三' }];

const value = ref('<p>已有的提及会还原：<span class="vc-editor-mention" data-value="u2" data-prefix="@">@成员2</span> 你好</p>');
const selected = ref('');
const mentions = computed(() => JSON.stringify(Editor.getMentions(value.value)));

// 按前缀返回不同的数据；loadData 的 Promise 解析为数组时直接作为结果
const mentionOptions = {
	prefix: ['@', '#'],
	virtualized: true,
	loadData: (keyword, instance, { prefix }) => {
		const source = prefix === '#' ? TOPICS : USERS;
		return Promise.resolve(source.filter(item => item.label.includes(keyword)));
	}
};

const handleSelect = ({ value: id, prefix, item }) => {
	selected.value = `${prefix}${item.label}（${id}）`;
};
</script>
<style lang="scss">
.editor-mention {
	display: flex;
	max-width: 720px;
	padding: 20px;
	flex-direction: column;
	gap: 12px;

	&__output {
		display: flex;
		font-size: 12px;
		color: var(--vc-color-dark-light);
		flex-direction: column;
		gap: 4px;
		word-break: break-all;
	}

	h4 {
		margin: 8px 0 0;
		font-size: 14px;
	}
}
</style>
