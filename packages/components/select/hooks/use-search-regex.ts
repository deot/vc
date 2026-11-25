import { computed } from 'vue';
import { isEqual } from 'lodash-es';
import { createSearchRegex, DEFAULT_SEARCH_MATCH, normalizeSearchMatch } from '../utils';
import type { SearchMatch, SearchRegex } from '../utils';

/**
 * 搜索词 -> 正则（见 createSearchRegex）；内容不变时沿用上一次的对象，依赖它的选项列表、树的过滤都不会重算
 * 	- 分隔符：模板里内联的对象每次渲染都是新的，按内容比较
 * 	- 正则：只改空白、分隔符（如尾随空格）时关键词不变，按 source 比较
 * @param keyword 搜索词
 * @param match 生效的分隔符，组件按 getSearchMatch 取值；不传时为默认规则
 * @returns ~
 */
export const useSearchRegex = (keyword: () => string, match?: () => SearchMatch) => {
	let separators: ReturnType<typeof normalizeSearchMatch> | undefined;
	const normalized = computed(() => {
		const next = normalizeSearchMatch(match?.() ?? DEFAULT_SEARCH_MATCH);
		if (!separators || !isEqual(separators, next)) separators = next;
		return separators;
	});

	let regex: SearchRegex | undefined;
	return computed(() => {
		const next = createSearchRegex(keyword(), normalized.value);
		if (!regex || regex.source !== next.source || regex.highlight?.source !== next.highlight?.source) regex = next;
		return regex;
	});
};
