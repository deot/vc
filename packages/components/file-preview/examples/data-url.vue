<template>
	<div style="padding: 20px; background: var(--vc-background-color-lightest);">
		<p>data: 地址：浏览器不允许直接在新窗口打开，纯文本与 PDF 转成 blob: 地址后打开（PDF 同时内嵌预览，没有扩展名时按媒体类型识别），关闭查看器时释放</p>
		<p>其他类型（如 text/html）只提供下载，避免以当前页面的源运行其中的脚本；下载都指向 data: 地址本身</p>
		<FilePreview :data="dataSource" />
	</div>
</template>
<script setup>
import { FilePreview } from '..';

// 一页写着 VC Demo 的最小 PDF
const createPdf = () => {
	const stream = 'BT /F1 24 Tf 72 720 Td (VC Demo) Tj ET';
	const objects = [
		'<< /Type /Catalog /Pages 2 0 R >>',
		'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
		'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
		`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
		'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
	];
	let pdf = '%PDF-1.4\n';
	const offsets = objects.map((body, index) => {
		const offset = pdf.length;
		pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
		return offset;
	});
	const xref = pdf.length;
	pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
	pdf += offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
	pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
	return `data:application/pdf;base64,${btoa(pdf)}`;
};

const dataSource = [
	{ source: `data:text/plain;charset=utf-8,${encodeURIComponent('VC Demo\n第二行文本')}`, type: 'file', name: '说明.txt' },
	{ source: createPdf(), type: 'file', name: '示例文件' },
	{ source: `data:text/html;charset=utf-8,${encodeURIComponent('<h1>VC Demo</h1>')}`, type: 'file', name: '示例页面.html' }
];
</script>
