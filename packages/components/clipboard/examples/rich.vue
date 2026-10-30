<template>
	<div class="clipboard-rich">
		<p class="clipboard-rich__note">
			同时写入 text/html 和 text/plain：粘贴到表格软件或富文本编辑器时保留格子，粘贴到纯文本输入框时得到制表符分隔的文本。
		</p>
		<table class="clipboard-rich__table">
			<thead>
				<tr>
					<th v-for="column in columns" :key="column.prop">{{ column.label }}</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(row, index) in rows" :key="index">
					<td v-for="column in columns" :key="column.prop">{{ row[column.prop] }}</td>
				</tr>
			</tbody>
		</table>
		<div class="clipboard-rich__actions">
			<Clipboard :value="value" :tag="Button" type="primary">
				复制表格
			</Clipboard>
			<Clipboard :value="value['text/plain']" :tag="Button">
				只复制文本
			</Clipboard>
			<Button @click="handleApi">调用 Clipboard.set</Button>
		</div>
		<div class="clipboard-rich__paste">
			<label>
				<span>富文本粘贴区</span>
				<div
					class="clipboard-rich__editable"
					contenteditable="true"
					aria-label="富文本粘贴区"
				/>
			</label>
			<label>
				<span>纯文本粘贴区</span>
				<textarea class="clipboard-rich__textarea" aria-label="纯文本粘贴区" />
			</label>
		</div>
	</div>
</template>
<script setup>
import { computed } from 'vue';
import { Button } from '../../button';
import { Message } from '../../message';
import { Clipboard } from '..';

const columns = [
	{ label: '名称', prop: 'name' },
	{ label: '类型', prop: 'type' },
	{ label: '数值', prop: 'value' }
];
const rows = [
	{ name: '条目 1', type: '类型 A', value: 12 },
	{ name: '条目 2', type: '类型 B', value: '' },
	{ name: '条目 3', type: '类型 C', value: 7 }
];

const escapeHtml = v => String(v)
	.replace(/&/g, '&amp;')
	.replace(/</g, '&lt;')
	.replace(/>/g, '&gt;');
const cellText = v => (v == null || v === '' ? '—' : String(v));

const value = computed(() => {
	const cell = 'border:1px solid #000;padding:4px 8px;';
	const head = columns.map(column => `<th style="${cell}">${escapeHtml(column.label)}</th>`).join('');
	const body = rows.map((row) => {
		const cells = columns.map(column => `<td style="${cell}">${escapeHtml(cellText(row[column.prop]))}</td>`).join('');
		return `<tr>${cells}</tr>`;
	}).join('');
	return {
		'text/plain': [
			columns.map(column => column.label).join('\t'),
			...rows.map(row => columns.map(column => cellText(row[column.prop])).join('\t'))
		].join('\n'),
		'text/html': `<table style="border-collapse:collapse;"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
	};
});

const handleApi = () => {
	const success = Clipboard.set(value.value);
	Message[success ? 'success' : 'error']({ content: success ? '已调用 Clipboard.set' : '复制失败' });
};
</script>

<style scoped>
.clipboard-rich {
	display: grid;
	gap: 16px;
	max-width: 720px;
	padding: 16px;
}

.clipboard-rich__note {
	margin: 0;
}

.clipboard-rich__table {
	border-collapse: collapse;
}

.clipboard-rich__table th,
.clipboard-rich__table td {
	padding: 4px 8px;
	text-align: left;
	border: 1px solid #ccc;
}

.clipboard-rich__actions {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
}

.clipboard-rich__paste {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	gap: 12px;
}

.clipboard-rich__paste label {
	display: grid;
	gap: 6px;
}

.clipboard-rich__editable,
.clipboard-rich__textarea {
	min-height: 120px;
	padding: 8px;
	font: inherit;
	border: 1px dashed #999;
}
</style>
