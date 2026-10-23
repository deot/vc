import * as Load from '@deot/helper-load';
import { ImagePreview } from '../file-preview/image-preview';

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

/**
 * 预览容器内的全部图片，并定位到被点击的那张；按节点定位，相同地址的图片也能对上。
 * 每张图都作为缩略图传入：切到哪一张，关闭时就回到哪一张
 * @param container 图片所在的容器
 * @param target 被点击的图片
 */
export const previewImages = (container: Element, target: Element) => {
	const images = Array.from(container.querySelectorAll('img'));
	ImagePreview.open({
		current: images.indexOf(target as HTMLImageElement),
		data: images.map(img => ({ source: img.currentSrc || img.src, element: img }))
	});
};
