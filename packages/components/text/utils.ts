import { getStyle } from '@deot/helper-dom';
import { Utils } from '@deot/vc-shared';

// 不设 overflow：Firefox 使用经典滚动条时，overflow: auto 会为滚动条留出宽度，测出的可用宽度偏窄
const HIDDEN_TEXT_STYLE = `
	position: absolute!important;
	word-break: break-all!important;
	opacity: 0!important;
	z-index: -1000!important;
	top: 0!important;
	right: 0!important;
`;

const SIZING_STYLE = [
	'letter-spacing',
	'line-height',
	'padding-top',
	'padding-bottom',
	'font-family',
	'font-weight',
	'font-size',
	'text-rendering',
	'text-transform',
	'width',
	// 'text-indent', // 需要额外计算
	'padding-left',
	'padding-right',
	'border-width',
	'box-sizing'
];

let hiddenEl;
let range: Range;

/**
 * 排版后的行数：同一行的各段在纵向上重叠。
 * 不按高度折算：line-height 为 normal 时，中西文落到不同字体，各行高度不一；内联的 1.5 / em / % 也读不出像素值
 * @param el 隐藏节点
 * @param max 超过即停
 * @returns 行数（最多 max + 1）
 */
const countLines = (el: HTMLElement, max: number) => {
	range ||= document.createRange();
	range.selectNodeContents(el);
	const rects = range.getClientRects();
	let count = 0;
	let bottom = -Infinity;
	for (let i = 0; i < rects.length && count <= max; i++) {
		const rect = rects[i];
		if (rect.top >= bottom - 1) {
			count++;
			bottom = rect.bottom;
		} else {
			bottom = Math.max(bottom, rect.bottom);
		}
	}
	return count;
};

export const getFitIndex = (options = {}) => {
	const { el, line, value, ellipsis, slice, indent = 0 } = options as any;

	if (!hiddenEl) {
		hiddenEl = document.createElement('div');
		document.body.appendChild(hiddenEl);
	}

	// Fix wrap="off" issue
	// https://github.com/ant-design/ant-design/issues/6577
	el.getAttribute('wrap')
		? hiddenEl.setAttribute('wrap', el.getAttribute('wrap'))
		: hiddenEl.removeAttribute('wrap');

	const { sizingStyle } = Utils.getComputedStyle(el, SIZING_STYLE);
	const textIndent = `text-indent: ${parseInt(getStyle(el, 'text-indent'), 10) + indent}px;`;
	hiddenEl.setAttribute('style', `${sizingStyle};${textIndent};${HIDDEN_TEXT_STYLE}`);

	const source = typeof value === 'number' ? `${value}` : (value || '');
	const hasSlice = slice !== undefined && slice !== null;
	// 与 String.prototype.slice 语义一致: slice=-5 取末尾 5 字符, slice=0 取整串
	const sliceText = hasSlice ? source.slice(slice) : '';

	// 每次写入文本再读行数都会强制一次排版。行数随字符数单调不减（word-break: break-all），
	// 所以整串放得下就直接返回；溢出时用二分代替逐字扫描，排版次数从 O(n) 降到 O(log n)，结果不变
	const exceeds = (text: string) => {
		hiddenEl.innerText = text;
		return countLines(hiddenEl, line) > line;
	};

	if (!source || !exceeds(source)) return -1;

	// 首个溢出位置：source.slice(0, i + 1) 溢出的最小 i（整串已知溢出，搜不到时即末位）
	const endIndex = Utils.bisectFirst(source.length - 1, i => exceeds(source.slice(0, i + 1)));

	// 回退：加上 ellipsis 与 sliceText 后仍放得下的最长前缀 source.slice(0, i)，i < endIndex
	const fitIndex = Utils.bisectLast(endIndex, i => !exceeds(source.slice(0, i) + ellipsis + sliceText));
	if (fitIndex >= 0) return fitIndex;

	// 边界: slice 让 ellipsis+sliceText 始终撑爆 line 行 (典型 slice=0)
	// 此时强制让 prefix 为空, 渲染端仍按 '' + ellipsis + sliceText 输出
	return hasSlice ? 0 : endIndex;
};
