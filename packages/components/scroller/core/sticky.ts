/**
 * 吸顶标题（IndexBar、MSelectView 共用）：按标题在列表中的位置与吸附线算出当前分组和被下一段顶出的位移
 * 	- 位置单调递增；用排版位置计算（虚拟列表中未渲染的标题也有位置），不依赖命中测试或已渲染的节点
 */

/**
 * 标题位置不超过 line 的最后一个分组（二分）
 * @param count 分组数
 * @param getOffset 第 i 个分组标题的位置，未知时为 undefined
 * @param line 吸附线在列表中的位置
 * @returns 分组下标，第一个标题也在吸附线之下时为 -1
 */
export const findStickyIndex = (count: number, getOffset: (index: number) => number | undefined, line: number) => {
	let low = 0;
	let high = count - 1;
	let result = -1;
	while (low <= high) {
		const mid = (low + high) >> 1;
		const offset = getOffset(mid);
		if (offset !== undefined && offset <= line) {
			result = mid;
			low = mid + 1;
		} else {
			high = mid - 1;
		}
	}
	return result;
};

/**
 * 吸顶标题被顶出的位移：分组的结束位置（下一个标题或分组后的第一行）进入标题高度内时随之上移
 * @param end 分组结束的位置，未知时不顶出
 * @param line 吸附线在列表中的位置
 * @param size 吸顶标题的高度
 * @returns 位移（≤ 0）
 */
export const getStickyTranslate = (end: number | undefined, line: number, size: number) => {
	return end === undefined ? 0 : Math.min(0, end - line - size);
};
