import { VcError } from '../vc';
import type { GridBreakpoint, GridResponsive, GridColumns, GridGap, GridSpan, GridSpanResult } from './types';

export interface GridLayoutItem {
	span: GridSpan;
	offset?: number;
	suffix?: boolean;
	rowspan?: number;
	// 由getSpan返回0得到，不占位
	hidden?: boolean;
}

export interface GridLayoutCell {
	// 起始行，从0开始
	row: number;
	rowspan: number;
	// 起始轨道，从0开始（不含offset）
	start: number;
	span: number;
	hidden: boolean;
}

export interface GridLayoutResult {
	cells: GridLayoutCell[];
	rows: number;
	// 折叠时是否有项被隐藏
	overflow: boolean;
}

// 从大到小，宽度 >= 最小值即命中
const BREAKPOINTS: Array<[GridBreakpoint, number]> = [
	['xxl', 1600],
	['xl', 1200],
	['lg', 992],
	['md', 768],
	['sm', 576],
	['xs', 0]
];

export const getBreakpoint = (width: number): GridBreakpoint => {
	return BREAKPOINTS.find(([, min]) => width >= min)![0];
};

export const isResponsive = <T>(value: GridResponsive<T> | undefined): value is Partial<Record<GridBreakpoint, T>> => {
	return !!value && typeof value === 'object' && !Array.isArray(value);
};

/**
 * 取当前断点及更小断点中第一个已设置的值，都没有时用fallback
 * @param value ~
 * @param breakpoint ~
 * @param fallback ~
 * @returns ~
 */
export const resolveResponsive = <T>(value: GridResponsive<T> | undefined, breakpoint: GridBreakpoint, fallback: T): T => {
	if (!isResponsive(value)) return value ?? fallback;
	const index = BREAKPOINTS.findIndex(([key]) => key === breakpoint);
	for (let i = index; i < BREAKPOINTS.length; i++) {
		const v = value[BREAKPOINTS[i][0]];
		if (v !== undefined) return v;
	}
	return fallback;
};

/**
 * 按顶层分隔符切分，括号内的不切
 * @param value ~
 * @param separator ~
 * @returns ~
 */
const splitTop = (value: string, separator: ' ' | ',') => {
	const result: string[] = [];
	let depth = 0;
	let current = '';
	for (const char of value) {
		if (char === '(' || char === '[') depth++;
		if (char === ')' || char === ']') depth--;
		const isSeparator = separator === ' ' ? /\s/.test(char) : char === ',';
		if (isSeparator && depth === 0) {
			current.trim() && result.push(current.trim());
			current = '';
		} else {
			current += char;
		}
	}
	current.trim() && result.push(current.trim());
	return result;
};

const countTracks = (template: string): number => {
	return splitTop(template, ' ').reduce((sum, token) => {
		// 网格线名称不占轨道
		if (token.startsWith('[')) return sum;
		const matched = /^repeat\((.*)\)$/i.exec(token);
		if (!matched) return sum + 1;
		const [times, ...tracks] = splitTop(matched[1], ',');
		let count = Number.parseInt(times, 10);
		if (Number.isNaN(count)) {
			// auto-fill / auto-fit 的轨道数取决于容器宽度，按1次计算
			new VcError('grid', `columns 不支持 ${times}，轨道数无法确定，按 1 次计算`);
			count = 1;
		}
		return sum + count * countTracks(tracks.join(','));
	}, 0);
};

/**
 * columns转换为grid-template-columns与轨道数
 * @param columns ~
 * @returns ~
 */
export const resolveTracks = (columns: GridColumns) => {
	if (typeof columns === 'number') {
		const count = Math.max(1, Math.floor(columns) || 1);
		return { template: `repeat(${count}, minmax(0, 1fr))`, count };
	}
	const template = Array.isArray(columns)
		? columns.map(v => (typeof v === 'number' ? `${v}px` : v)).join(' ')
		: columns.trim();
	return { template, count: Math.max(1, countTracks(template)) };
};

/**
 * gap转换为CSS gap（行 列）
 * @param gap ~
 * @returns ~
 */
export const resolveGap = (gap: GridGap) => {
	const [x, y] = Array.isArray(gap) ? gap : [gap, gap];
	return `${y || 0}px ${x || 0}px`;
};

/**
 * getSpan的返回值转换为 { rowspan, colspan, hidden }，未返回的项为undefined；任一为0时隐藏
 * @param value ~
 * @returns ~
 */
export const resolveSpan = (value: GridSpanResult) => {
	if (!value) return { hidden: false };
	const [rowspan, colspan] = Array.isArray(value) ? value : [value.rowspan, value.colspan];
	return { rowspan, colspan, hidden: rowspan === 0 || colspan === 0 };
};

export const getCellStyle = (cell: GridLayoutCell) => ({
	gridRow: `${cell.row + 1} / span ${cell.rowspan}`,
	gridColumn: `${cell.start + 1} / span ${cell.span}`
});

const toInteger = (value: unknown, fallback: number) => {
	const v = Math.floor(Number(value));
	return Number.isFinite(v) ? v : fallback;
};

/**
 * 计算每项的位置，规则同CSS grid的稀疏自动放置：按顺序从上一项之后找第一个放得下的位置，跳过已被占用（跨行）的格子
 * 	- span为auto时占满所在位置右侧连续的空格（到limit为止）
 * 	- suffix项作为整体放在最后，靠右；折叠时预留在最后一行末尾
 * 	- 折叠时第一个放不下（超出collapsedRows）的项及之后的项都隐藏
 * 	- fill时每行最右一项（非suffix）向右补满空格
 * @param options ~
 * @param options.columns 轨道数
 * @param options.items 各项的span / offset / suffix / rowspan / hidden
 * @param options.collapsed 是否折叠
 * @param options.collapsedRows 折叠时显示的行数
 * @param options.fill 每行最右一项是否补满
 * @returns ~
 */
export const layout = (options: {
	columns: number;
	items: GridLayoutItem[];
	collapsed?: boolean;
	collapsedRows?: number;
	fill?: boolean;
}): GridLayoutResult => {
	const { columns, items, collapsed = false, fill = false } = options;
	const lastRow = collapsed ? Math.max(1, toInteger(options.collapsedRows, 1)) - 1 : Infinity;
	const cells: GridLayoutCell[] = items.map(() => ({ row: 0, rowspan: 1, start: 0, span: 0, hidden: true }));

	// 占位表：occupied[row][column]
	const occupied: boolean[][] = [];
	const isFree = (row: number, column: number) => !occupied[row]?.[column];
	const occupy = (cell: GridLayoutCell) => {
		for (let r = cell.row; r < cell.row + cell.rowspan; r++) {
			occupied[r] = occupied[r] || [];
			for (let c = cell.start; c < cell.start + cell.span; c++) occupied[r][c] = true;
		}
	};
	// 从column起向右，rowspan行都空着的连续格数
	const getFreeRun = (row: number, column: number, rowspan: number, limit: number) => {
		let count = 0;
		while (column + count < limit) {
			for (let r = row; r < row + rowspan; r++) {
				if (!isFree(r, column + count)) return count;
			}
			count++;
		}
		return count;
	};

	// span为auto时toInteger回退为1：先按1格找位置
	const getOffset = (item: GridLayoutItem) => Math.min(Math.max(0, toInteger(item.offset, 0)), columns - 1);
	const getSpan = (item: GridLayoutItem, offset: number) => Math.min(Math.max(1, toInteger(item.span, 1)), columns - offset);
	const getRowspan = (item: GridLayoutItem) => Math.max(1, toInteger(item.rowspan, 1));

	let rows = 0;
	const place = (index: number, row: number, start: number, span: number) => {
		const cell = cells[index];
		cell.row = row;
		cell.rowspan = getRowspan(items[index]);
		cell.start = start;
		cell.span = span;
		cell.hidden = false;
		occupy(cell);
		rows = Math.max(rows, row + cell.rowspan);
	};

	const suffixes = items.reduce<number[]>((pre, item, index) => (item.suffix && !item.hidden && pre.push(index), pre), []);
	const suffixSpans = suffixes.map(index => getSpan(items[index], 0));
	const reserved = Math.min(columns, suffixSpans.reduce((sum, v) => sum + v, 0));
	const getLimit = (row: number) => (row === lastRow ? columns - reserved : columns);

	let row = 0;
	let cursor = 0;
	let overflow = false;
	for (let index = 0; index < items.length; index++) {
		const item = items[index];
		if (item.suffix || item.hidden) continue;

		const offset = getOffset(item);
		const rowspan = getRowspan(item);
		const span = getSpan(item, offset);

		let start = -1;
		for (let r = row, c = cursor; ; c++) {
			if (c + offset + span > getLimit(r)) {
				r++;
				c = 0;
			}
			// 超出折叠行数（含跨行部分）则停止
			if (r + rowspan - 1 > lastRow || offset + span > getLimit(r)) break;
			if (getFreeRun(r, c + offset, rowspan, c + offset + span) === span) {
				row = r;
				start = c + offset;
				break;
			}
		}
		if (start === -1) {
			overflow = true;
			break;
		}

		place(index, row, start, item.span === 'auto' ? getFreeRun(row, start, rowspan, getLimit(row)) : span);
		cursor = start + cells[index].span;
	}

	if (reserved) {
		const start = columns - reserved;
		const height = Math.max(...suffixes.map(index => getRowspan(items[index])));
		// 放在当前行末尾，放不下则往下找
		let r = start < cursor ? row + 1 : row;
		while (getFreeRun(r, start, height, columns) < reserved) r++;
		let current = start;
		suffixes.forEach((index, i) => {
			place(index, r, current, suffixSpans[i]);
			current += suffixSpans[i];
		});
	}

	if (fill) {
		// 每行最右一项
		const ends: Record<number, number> = {};
		cells.forEach((cell, index) => {
			if (cell.hidden) return;
			const current = ends[cell.row];
			if (current === undefined || cells[current].start < cell.start) ends[cell.row] = index;
		});
		Object.values(ends).forEach((index) => {
			const cell = cells[index];
			if (items[index].suffix) return;
			const extra = getFreeRun(cell.row, cell.start + cell.span, cell.rowspan, columns);
			extra && (cell.span += extra, occupy(cell));
		});
	}

	return { cells, rows, overflow };
};
