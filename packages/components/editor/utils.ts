import * as Load from '@deot/helper-load';

/**
 * 动态生成font-size的css，插入head
 * @param value ~
 * @param id ~
 * @returns ~
 */
export const insertFontSizeStyle = (value: string[], id: string) => {
	const code = value.reduce((pre, fontSize) => {
		pre += `.ql-snow .ql-font-size.ql-picker .ql-picker-item[data-value="${fontSize}"]:before,
				.ql-snow .ql-font-size.ql-picker .ql-picker-label[data-value="${fontSize}"]:before {
					content: "${fontSize}"
				}`;
		return pre;
	}, '');

	return Load.style(code, { id });
};

/**
 * 动态生成line-height的css，插入head
 * @param value ~
 * @param id ~
 * @returns ~
 */
export const insertLineHeightStyle = (value: string[], id: string) => {
	const code = value.reduce((pre, lineHeight) => {
		pre += `.ql-snow .ql-line-height.ql-picker .ql-picker-item[data-value="${lineHeight}"]:before,
				.ql-snow .ql-line-height.ql-picker .ql-picker-label[data-value="${lineHeight}"]:before {
					content: "${+lineHeight}" 
				}`;
		return pre;
	}, '');
	return Load.style(code, { id });
};

/**
 * 动态生成letter-Spacing的css，插入head
 * @param value ~
 * @param id ~
 * @returns ~
 */
export const insertLetterSpacingStyle = (value: string[], id: string) => {
	const code = value.reduce((pre, letterSpacing) => {
		pre += `.ql-snow .ql-letter-spacing.ql-picker .ql-picker-item[data-value="${letterSpacing}"]:before,
				.ql-snow .ql-letter-spacing.ql-picker .ql-picker-label[data-value="${letterSpacing}"]:before {
					content: "${letterSpacing}"
				}`;
		return pre;
	}, '');
	return Load.style(code, { id });
};
