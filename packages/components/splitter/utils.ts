import type { SplitterPanelCollapsible } from './types';

export interface ParsedSize {
	unit: 'px' | '%' | 'auto';
	// px：像素；%：百分比；auto：分剩余空间的权重
	value: number;
}

// 分隔条的厚度：style.scss 在根节点上由 --vc-splitter-bar-size（含默认值）解析出来，嵌套时各自解析
const BAR_SIZE = 'var(--vc-splitter-bar)';

/**
 * 数字为 px；字符串带 % 为百分比，其余按 px 解析；无法解析时为 auto
 * @param value ~
 * @returns ~
 */
export const parseSize = (value?: number | string | null): ParsedSize => {
	const v = Number.parseFloat(value as string);
	if (!Number.isFinite(v)) return { unit: 'auto', value: 1 };
	return { unit: typeof value === 'string' && value.trim().endsWith('%') ? '%' : 'px', value: Math.max(v, 0) };
};

/**
 * 换算成 px；auto 返回 undefined
 * @param value ~
 * @param available 容器扣除分隔条后的尺寸
 * @returns ~
 */
export const resolveSize = (value: number | string | undefined, available: number) => {
	const size = parseSize(value);
	if (size.unit === 'auto') return;
	return size.unit === '%' ? size.value / 100 * available : size.value;
};

/**
 * CSS 长度：% 相对容器扣除全部分隔条后的尺寸
 * @param size ~
 * @param bars 分隔条数量
 * @returns ~
 */
export const toLength = (size: ParsedSize, bars: number) => {
	if (size.unit === 'px') return `${size.value}px`;
	if (!bars || !size.value) return `${size.value}%`;
	return `calc(${size.value}% - ${BAR_SIZE} * ${bars * size.value / 100})`;
};

// 回写给 v-model 的数值保留两位小数，避免浮点噪声
export const round = (value: number) => Math.round(value * 100) / 100;

/**
 * 夹紧到 [lower, upper]，两者冲突时 lower（min）优先，且不超过 total
 * @param value ~
 * @param range ~
 * @param range.lower 下限
 * @param range.upper 上限
 * @param range.total 总尺寸
 * @returns ~
 */
export const clamp = (value: number, range: { lower: number; upper: number; total: number }) => {
	return Math.min(Math.max(range.lower, Math.min(range.upper, value)), range.total);
};

/**
 * true（含 <SplitterPanel collapsible>）为两侧都可折叠
 * @param value ~
 * @returns ~
 */
export const getCollapsible = (value?: boolean | string | SplitterPanelCollapsible | null): SplitterPanelCollapsible => {
	if (value === true || value === '') return { start: true, end: true };
	if (!value || typeof value !== 'object') return {};
	return { start: !!value.start, end: !!value.end };
};
