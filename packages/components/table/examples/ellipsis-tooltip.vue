<template>
	<div class="ellipsis-tooltip-demo">
		<p class="ellipsis-tooltip-demo__tip">
			列宽不够时文字按 line / header-line 省略，悬停被截断的单元格或表头时弹出完整内容。
			“自动复现”依次悬停每个被截断的单元格与表头，测量提示的宽高、是否在视口内、是否把页面撑出横向滚动。
		</p>
		<p class="ellipsis-tooltip-demo__legend">结论：<b>已修复</b> = 本次已修复；<b>无问题</b> = 对照组</p>
		<p>
			期望：默认朝上弹出（上方放不下时才翻转，避免鼠标向下移动时进入提示）；20 个字以内的短文字不换行，
			长文字按宽高比约 3:1 换行显示（宽度 = √(3 × 单行宽 × 行高)，不窄于 20 个字与单元格文字、不宽于一行），
			不可断行的长串同样换行；提示完整在视口内（四周留 8px，超出时内部滚动），页面不出现横向滚动
		</p>
		<p class="ellipsis-tooltip-demo__verdict is-fixed">
			结论：已修复——hover 弹层只按视口判断翻转（表体是滚动容器，原先前几行因容器上方空间不足被翻到下方）；
			按弹层实际字体测出文字的单行宽度，短文字不换行、长文字按宽高比计算最大宽度，并受 Popover 的屏幕上限约束；
			不可断行的长串在宽度内换行。短文本与未截断的表头为对照，无问题
		</p>

		<Table
			ref="tableRef"
			primary-key="id"
			border
			:data="data"
		>
			<TableColumn label="类型" prop="type" :width="120" />
			<TableColumn label="单行省略（line=1，列宽 140）" prop="text" :width="140" :line="1" :header-line="1" />
			<TableColumn label="两行省略（line=2，列宽 200）" prop="text" :width="200" :line="2" />
			<TableColumn label="其它" prop="other" />
		</Table>

		<div class="ellipsis-tooltip-demo__actions">
			<Button type="primary" size="small" @click="run">
				自动复现
			</Button>
			<div
				v-for="item in results"
				:key="item.label"
				:data-result="item.pass ? 'pass' : 'fail'"
				:class="['ellipsis-tooltip-demo__result', item.pass ? 'is-pass' : 'is-fail']"
			>
				{{ item.label }}｜实际：{{ item.actual }}
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Table, TableColumn } from '..';
import { Button } from '../../button';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const round = v => Math.round(v);
const GAP = 8; // 弹层与视口边缘的留白
const RATIO = [2, 4.5]; // 宽高比的合理范围（目标 3:1）

const TYPES = [
	{ type: '中文', text: '这是一段很长的中文单元格内容，列宽不够时会被省略，悬停时弹出完整内容。'.repeat(12) },
	{ type: '英文单词', text: 'This is a long english sentence in a narrow column. '.repeat(20) },
	{ type: '不可断行', text: 'A'.repeat(600) },
	{ type: '数字串', text: '1234567890'.repeat(60) },
	{ type: '短文本（对照）', text: '不截断' }
];
// 20 行：观察不同位置的行弹出的方向（placement=top，上方放不下时翻转）
const data = Array.from({ length: 20 }).map((_, i) => ({ id: i + 1, ...TYPES[i % TYPES.length], other: '-' }));

const tableRef = ref();
const results = ref([]);

const getPopup = () => Array.from(document.querySelectorAll('.vc-popover-wrapper')).pop();

/**
 * 悬停 text-line 后测量提示
 * @param label 场景名
 * @param line text-line 元素
 * @param hover 触发悬停的方式（表体为冒泡的 mouseover，表头 label 为 mouseenter）
 * @returns 结果；未截断时返回 null
 */
const check = async (label, line, hover) => {
	if (line.scrollHeight <= line.clientHeight) return null;
	document.body.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
	await sleep(400);
	line.scrollIntoView({ block: 'center' });
	// 滚动停止 150ms 内不会弹出提示（见 use-text-line-tooltip），合成事件也不会让节点处于 :hover
	await sleep(300);
	hover();
	await sleep(700);
	const popup = getPopup();
	if (!popup) return { label, actual: '未弹出提示', pass: false };
	const c = popup.querySelector('.vc-popover-wrapper__container').getBoundingClientRect();
	const vw = document.documentElement.clientWidth;
	const vh = document.documentElement.clientHeight;
	const cellWidth = line.clientWidth;
	const t = line.getBoundingClientRect();
	const direction = /is-top/.test(popup.className) ? 'top' : 'bottom';
	// 视口内上方放得下（间隙 4px + 箭头 8px + 留白 8px）时应朝上
	const fitsAbove = t.top - 20 >= c.height;
	const inView = c.left >= GAP - 0.5 && c.top >= GAP - 0.5 && c.right <= vw - GAP + 0.5 && c.bottom <= vh - GAP + 0.5;
	const stretched = document.documentElement.scrollWidth > vw;
	const ratio = c.width / c.height;
	const style = getComputedStyle(popup.querySelector('.vc-popover-wrapper__container'));
	const lines = Math.round((c.height - 10) / parseFloat(style.lineHeight));
	// 一行显示、宽度为下限（20 个字 / 单元格文字）或已到屏幕上限时，比例不作要求
	const minWidth = Math.max(parseFloat(style.fontSize) * 20, cellWidth) + 24;
	const bounded = lines === 1 || c.width <= minWidth + 1 || c.width >= vw - GAP * 2 - 1;
	const ratioOk = bounded || (ratio >= RATIO[0] && ratio <= RATIO[1]);
	const widthOk = c.width >= cellWidth - 1;
	return {
		label,
		actual: [
			`方向 ${direction}（上方空间 ${round(t.top - 20)}px${fitsAbove ? '，放得下' : '，放不下'}）`,
			`提示 ${round(c.width)}×${round(c.height)}（${lines} 行，宽高比 ${ratio.toFixed(1)}）`,
			`位置 (${round(c.left)}, ${round(c.top)})，单元格文字宽 ${cellWidth}px`,
			fitsAbove && direction !== 'top' ? '上方放得下却朝下' : '',
			ratioOk ? '' : '宽高比不在 2~4.5 之间',
			widthOk ? '' : '比单元格窄',
			inView ? '在视口内' : '超出视口（或未留 8px）',
			stretched ? '页面出现横向滚动' : ''
		].filter(Boolean).join('，'),
		pass: ratioOk && widthOk && inView && !stretched && !(fitsAbove && direction !== 'top')
	};
};

const run = async () => {
	results.value = [];
	const root = tableRef.value.$el;
	const list = [];
	// 表体：按“类型”列找到每一行，悬停该行被截断的单元格（冒泡的 mouseover）
	const typeCells = Array.from(root.querySelectorAll('.vc-table__tbody .vc-table__td'))
		.filter(cell => data.some(row => cell.textContent.trim() === row.type));
	for (const typeCell of typeCells) {
		const lines = root.querySelectorAll(`.vc-table__tbody .vc-table__td[data-row="${typeCell.dataset.row}"] .vc-table__text-line`);
		for (const [index, line] of Array.from(lines).entries()) {
			const hover = () => line.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
			const r = await check(`第 ${Number(typeCell.dataset.row) + 1} 行 ${typeCell.textContent.trim()}｜${index ? '两行' : '单行'}省略`, line, hover);
			r && list.push(r);
		}
	}
	const header = Array.from(root.querySelectorAll('.vc-table__th-label')).find(i => i.textContent.includes('单行省略'));
	const headerLine = header?.querySelector(':scope > .vc-table__text-line');
	const r = headerLine && await check('表头 label（header-line=1）', headerLine, () => header.dispatchEvent(new MouseEvent('mouseenter')));
	r && list.push(r);
	document.body.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
	results.value = list;
};
</script>

<style lang="scss">
.ellipsis-tooltip-demo {
	padding: 40px;
	padding-bottom: 400px;

	&__tip {
		color: #666;
	}

	&__legend {
		font-size: 12px;
		color: #666;
	}

	&__verdict {
		font-size: 12px;

		&.is-fixed {
			color: #52c41a;
			font-weight: bold;
		}
	}

	&__actions {
		margin-top: 16px;
	}

	&__result {
		margin-top: 4px;
		font-size: 12px;

		&.is-pass {
			color: #52c41a;
		}

		&.is-fail {
			color: #f5222d;
		}
	}
}
</style>
