interface GridItem {
	span: number;
	wide: boolean;
}

// 整行卡片在前；其余卡片分成总高度最接近的两列，列内保留组件顺序。
export const balanceGrid = (items: GridItem[], columns: number, fixedColumns?: number[]) => {
	const layout = items.map(item => ({ row: 1, column: 1, span: item.span, width: 1 }));
	if (columns === 1) {
		let row = 1;
		layout.forEach((item) => { item.row = row; row += item.span; });
		return layout;
	}
	let row = 1;
	items.forEach((item, index) => {
		if (!item.wide) return;
		layout[index] = { row, column: 1, span: item.span, width: 2 };
		row += item.span;
	});
	const narrow = items.map((item, index) => ({ ...item, index })).filter(item => !item.wide);
	const left = fixedColumns
		? new Set(narrow.filter(item => fixedColumns[item.index] === 1).map(item => item.index))
		: balanceColumns(narrow);
	const rows = [row, row];
	for (const item of narrow) {
		const column = left.has(item.index) ? 0 : 1;
		layout[item.index] = { row: rows[column], column: column + 1, span: item.span, width: 1 };
		rows[column] += item.span;
	}
	return layout;
};

const balanceColumns = (narrow: (GridItem & { index: number })[]) => {
	const total = narrow.reduce((sum, item) => sum + item.span, 0);
	const subsets = new Map<number, number[]>([[0, []]]);
	for (const item of narrow) {
		for (const [sum, indices] of [...subsets]) {
			const next = sum + item.span;
			if (next <= Math.ceil(total / 2) && !subsets.has(next)) subsets.set(next, [...indices, item.index]);
		}
	}
	const best = [...subsets.keys()].reduce((chosen, sum) => (
		Math.abs(total - sum * 2) < Math.abs(total - chosen * 2) ? sum : chosen
	), 0);
	const selected = new Set(subsets.get(best));
	return narrow.length && !selected.has(narrow[0].index)
		? new Set(narrow.filter(item => !selected.has(item.index)).map(item => item.index))
		: selected;
};
