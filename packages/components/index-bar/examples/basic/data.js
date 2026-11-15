// 示例数据：A–Z 26 个分组，每组若干项（文字为中性占位）
const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

export const createGroups = (count = 4) => LETTERS.map((letter, i) => ({
	value: letter,
	label: `${letter} 组`,
	// 每组项数在 count 附近变化，个别分组为空（只显示标题）
	children: i % 9 === 8
		? []
		: Array.from({ length: count + (i % 3) }, (_, j) => ({ label: `${letter} 项 ${j + 1}` }))
}));
