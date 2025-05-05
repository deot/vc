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
	const { el, line, value, suffix, indent } = options as any;

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

	let endIndex = 0;
	hiddenEl.innerText = suffix;

	value.split('').forEach((item, i) => {
		// 后缀必须放入后面计算，前面会造成问题
		let old = hiddenEl.innerText;
		old = old.substring(0, old.length - suffix.length);
		hiddenEl.innerText = old + item + suffix;

		if (hiddenEl.clientHeight - sideHeight > lineHeight * line && endIndex === 0) {
			endIndex = i;
		}
	});

	return endIndex;
};
