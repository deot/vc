/**
 * 光标处正在输入的提及：前缀所在的位置、前缀、前缀之后到光标的词
 */
export interface MentionMatch {
	// 前缀在文字中的位置
	start: number;
	// 提及的词的结束位置（光标在词中间时延伸到词尾）
	end: number;
	prefix: string;
	// 前缀之后到光标的文字（搜索词）
	keyword: string;
}

const isBoundary = (char: string | undefined, split: string) => {
	return char === undefined || /\s/.test(char) || (!!split && char === split);
};

/**
 * 找出光标处正在输入的提及
 * 	- 光标前最近的一个前缀（多个前缀取最靠后的，同一位置取较长的）
 * 	- 前缀在开头，或前一个字符是空白 / 分隔符：邮箱这类 a@b 不算
 * 	- 前缀到光标之间不含换行与分隔符
 * 	- 光标在词中间时，词延伸到下一个空白 / 分隔符之前，选中后整个替换
 * @param text 全部文字
 * @param caret 光标位置
 * @param prefixes 前缀
 * @param split 分隔符
 * @returns 没有时为 null
 */
export const findMention = (text: string, caret: number, prefixes: string[], split: string): MentionMatch | null => {
	const before = text.slice(0, caret);
	let start = -1;
	let prefix = '';
	prefixes.forEach((item) => {
		if (!item) return;
		const index = before.lastIndexOf(item);
		if (index > start || (index === start && item.length > prefix.length)) {
			start = index;
			prefix = item;
		}
	});
	if (start === -1 || !isBoundary(text[start - 1], split)) return null;

	const keyword = before.slice(start + prefix.length);
	if (/[\r\n]/.test(keyword) || (split && keyword.includes(split))) return null;

	let end = caret;
	while (end < text.length && !isBoundary(text[end], split)) end++;
	return { start, end, prefix, keyword };
};

/**
 * 用选中的提及替换光标处的词：前缀 + value + 分隔符（后面已是分隔符或空白时不再补）
 * @param text 全部文字
 * @param match 见 findMention
 * @param value 选中项的值
 * @param split 分隔符
 * @returns 新的文字与插入后光标的位置
 */
export const insertMention = (text: string, match: MentionMatch, value: string, split: string) => {
	const tail = text.slice(match.end);
	const suffix = !split || tail.startsWith(split) ? '' : split;
	const inserted = `${match.prefix}${value}${suffix}`;
	const caret = match.start + inserted.length + (suffix ? 0 : Math.min(split.length, tail.length));
	return {
		text: `${text.slice(0, match.start)}${inserted}${tail}`,
		caret
	};
};

export const toPrefixes = (prefix: string | string[]) => (Array.isArray(prefix) ? prefix : [prefix]).filter(Boolean);
