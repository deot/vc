import { getStyle } from '@deot/helper-dom';
import { Utils } from '@deot/vc-shared';

const HIDDEN_TEXT_STYLE = `
	position: absolute!important;
	word-break: break-all!important;
	overflow: auto!important;
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

export const getFitIndex = (options = {}) => {
	const { el, line, value, ellipsis, slice, indent = 0 } = options as any;

	let lineHeight = parseInt(getStyle(el, 'line-height'), 10);

	if (!hiddenEl) {
		hiddenEl = document.createElement('div');
		document.body.appendChild(hiddenEl);
	}

	// Fix wrap="off" issue
	// https://github.com/ant-design/ant-design/issues/6577
	el.getAttribute('wrap')
		? hiddenEl.setAttribute('wrap', el.getAttribute('wrap'))
		: hiddenEl.removeAttribute('wrap');

	const {
		paddingSize, borderSize,
		boxSizing, sizingStyle,
	} = Utils.getComputedStyle(el, SIZING_STYLE);
	const textIndent = `text-indent: ${parseInt(getStyle(el, 'text-indent'), 10) + indent}px;`;
	hiddenEl.setAttribute('style', `${sizingStyle};${textIndent};${HIDDEN_TEXT_STYLE}`);
	let sideHeight = paddingSize || 0;
	// content + padding + border
	boxSizing === 'border-box' && (sideHeight += borderSize);

	if (Number.isNaN(lineHeight)) {
		hiddenEl.innerText = '.';
		lineHeight = hiddenEl.clientHeight - sideHeight;
	}

	const source = typeof value === 'number' ? `${value}` : (value || '');
	const hasSlice = slice !== undefined && slice !== null;
	// 与 String.prototype.slice 语义一致: slice=-5 取末尾 5 字符, slice=0 取整串
	const sliceText = hasSlice ? source.slice(slice) : '';

	// 每次写入文本再读 clientHeight 都会强制一次排版。高度随字符数单调不减（word-break: break-all），
	// 所以整串放得下就直接返回；溢出时用二分代替逐字扫描，排版次数从 O(n) 降到 O(log n)，结果不变
	const exceeds = (text: string) => {
		hiddenEl.innerText = text;
		return hiddenEl.clientHeight - sideHeight > lineHeight * line;
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
