import type { ShallowRef } from 'vue';
import type { MentionMatch } from './utils';

interface Suggest {
	active: { value: boolean };
	open: () => void;
	close: () => void;
	blur: () => void;
	search: () => void;
}

/**
 * Mention 与 Editor 的提及共用：光标处的提及（见 findMention 的结果）变化后，打开、搜索或关闭联想
 * 	- 与上一次完全相同（光标在同一个词里没动）时不处理
 * 	- 新的提及（位置或前缀变了）：onOpen（调用方定位锚点）后立即打开
 * 	- 同一个提及里搜索词变化：按输入搜索（防抖）
 * @param match 当前的提及（联想的搜索词取自它）
 * @param suggest useSuggest 的返回值
 * @param options ~
 * @param options.onOpen 新的提及：定位锚点
 * @param options.onSearch 新的提及或搜索词变化
 * @returns apply：交给它新的提及（没有时为 null）；clear：失焦、禁用时清掉并关闭
 */
export const useMentionMatch = (
	match: ShallowRef<MentionMatch | null>,
	suggest: Suggest,
	options: { onOpen: (next: MentionMatch) => void; onSearch?: (next: MentionMatch) => void }
) => {
	const { onOpen, onSearch } = options;

	const apply = (next: MentionMatch | null) => {
		const previous = match.value;
		if (!next) {
			if (!previous) return;
			match.value = null;
			suggest.close();
			return;
		}
		const isSame = !!previous && previous.start === next.start && previous.prefix === next.prefix;
		if (isSame && previous.end === next.end && previous.keyword === next.keyword) return;
		match.value = next;
		if (isSame && previous.keyword === next.keyword) return;
		onSearch?.(next);
		if (isSame && suggest.active.value) {
			suggest.search();
			return;
		}
		onOpen(next);
		suggest.open();
	};

	const clear = () => {
		match.value = null;
		suggest.blur();
	};

	return { apply, clear };
};
