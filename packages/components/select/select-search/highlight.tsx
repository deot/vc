/** @jsxImportSource vue */

import type { SearchRegex } from '../utils';

/**
 * 高亮 label 中命中关键词的部分
 * @param label ~
 * @param regex createSearchRegex 的结果；没有关键词时原样返回
 * @returns 没有命中时为原文字，否则为文字与高亮节点的数组
 */
export const renderHighlight = (label: any, regex?: SearchRegex) => {
	const text = String(label ?? '');
	if (!regex?.highlight || !text) return text;

	// highlight 带一个捕获组：拆分后奇数位是命中的部分
	const parts = text.split(regex.highlight);
	if (parts.length === 1) return text;
	return parts
		.map((part, index) => (index % 2 ? (<span class="vc-select-highlight">{part}</span>) : part))
		.filter(Boolean);
};
