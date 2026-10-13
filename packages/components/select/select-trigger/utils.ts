export interface FitTagsOptions {
	/**
	 * 候选 tag 的外宽（含左右 margin），长度即候选数量
	 */
	widths: number[];

	/**
	 * 容器可用宽度
	 */
	width: number;

	/**
	 * 最多行数
	 */
	lines: number;

	/**
	 * 折叠 tag（+N...）的外宽
	 */
	plusWidth: number;

	/**
	 * tag 总数
	 */
	total: number;

	/**
	 * 末行在 tag 之后需留出的宽度（如内联的搜索输入框）
	 */
	reserve?: number;
}

export interface FitTagsResult {
	/**
	 * 可显示的 tag 数量
	 */
	count: number;

	/**
	 * 最后一个可显示 tag 需收缩到的外宽（为折叠 tag 让位）
	 */
	shrink?: number;
}

/**
 * 按行贪心放置 tag，计算在给定行数内可显示的数量
 * 	- 需要折叠 tag 时为其让位：减少数量，最后一行只剩一个时收缩它（出现省略号）；
 * 	- 收缩后比折叠 tag 还窄（约只剩一个字）时不再显示它，只保留折叠 tag；
 * 	- reserve：末行还需留出的宽度，放不下时同样靠减少数量让位。
 * @param options ~
 * @returns ~
 */
export const fitTags = (options: FitTagsOptions): FitTagsResult => {
	const { widths, width, lines, plusWidth, total, reserve = 0 } = options;
	if (!widths.length || width <= 0 || lines <= 0) return { count: widths.length };

	// 每个 tag 放置后的所在行、行内已用宽度、是否为该行首个
	const layout: Array<{ row: number; used: number; head: boolean }> = [];
	let row = 1;
	let used = 0;
	for (let i = 0; i < widths.length; i++) {
		// 超长 tag 独占一行，由省略号截断
		const w = Math.min(widths[i], width);
		if (used > 0 && used + w > width) {
			row++;
			used = 0;
		}
		if (row > lines) break;
		layout.push({ row, used: used + w, head: used === 0 });
		used += w;
	}

	// 全部放得下：末行还能容纳预留宽度，或预留部分还能换到下一行
	const last = layout[layout.length - 1];
	if (layout.length >= total && (last.used + reserve <= width || last.row < lines)) {
		return { count: layout.length };
	}

	// 需要折叠 tag：连同预留宽度能跟在最后一个 tag 后面，或还能换到下一行
	const tail = plusWidth + reserve;
	for (let i = layout.length - 1; i >= 0; i--) {
		const item = layout[i];
		if (item.used + tail <= width || (item.row < lines && tail <= width)) {
			return { count: i + 1 };
		}
		if (item.head) {
			const shrink = width - tail;
			return shrink >= plusWidth ? { count: i + 1, shrink } : { count: i };
		}
	}

	// layout[0].head 恒为 true，不会走到这里
	return { count: 0 };
};
