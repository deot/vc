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
		pre += `.ql-editor .ql-font-size-${fontSize} {
					font-size: ${fontSize};
				}`;
		return pre;
	}, '');
	;

	return Load.style(code, { id });
};

/**
 * 动态生成line-height的css，插入head
 * 设置的样式1.2为class不起由于有.不生效, 默认扩大十倍
 * @param value ~
 * @param id ~
 * @returns ~
 */
export const insertLineHeightStyle = (value: string[], id: string) => {
	const code = value.reduce((pre, lineHeight) => {
		const classLineHeightValue = (+lineHeight) * 10;
		pre += `.ql-snow .ql-line-height.ql-picker .ql-picker-item[data-value="${classLineHeightValue}"]:before,
				.ql-snow .ql-line-height.ql-picker .ql-picker-label[data-value="${classLineHeightValue}"]:before {
					content: "${+lineHeight}" 
				}`;

		pre += `.ql-editor .ql-line-height-${classLineHeightValue} {
					line-height: ${+lineHeight};
				}`;
		return pre;
	}, '');
	return Load.style(code, { id });
};

/**
 * 动态生成line-height的css，插入head
 * 设置的样式1.2为class不起由于有.不生效, 默认扩大十倍
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
		pre += `.ql-editor .ql-letter-spacing-${letterSpacing} {
					letter-spacing: ${letterSpacing};
				}`;
		return pre;
	}, '');
	return Load.style(code, { id });
};
