import { onBeforeUnmount } from 'vue';
import type { Nullable } from '@deot/helper-shared';
import { getFitIndex } from '../../text/utils';
import { Popover } from '../../popover';

/**
 * 多行省略（.vc-table__text-line）被截断时，hover 展示完整内容；表体 cell 与表头 label 共用
 * 	- 同一时刻只保留一个弹层，组件卸载时销毁；
 * 	- 弹层只监听 triggerEl 的移入 / 移出，调用方须在 text-line（或与其重合的容器）上触发。
 * @returns open
 */
export const useTextLineTooltip = () => {
	let poper: Nullable<{ destroy: () => void }> = null;

	/**
	 * 判断是否截断，截断时打开弹层
	 * @param el text-line 元素
	 * @param line 行数，为空或 0（不限行数）时不处理
	 */
	const open = (el?: Nullable<Element>, line?: number) => {
		if (!el || !line) return;
		// clamp 未截断时内容高度不超出，跳过逐字测量
		if (el.scrollHeight <= el.clientHeight) return;

		const value = el.textContent || '';
		const endIndex = getFitIndex({
			el,
			value,
			line,
			ellipsis: '...'
		});
		if (endIndex > 0 && endIndex < value.length - 1) {
			poper && poper.destroy();
			poper = Popover.open({
				el: document.body,
				triggerEl: el,
				hover: true,
				alone: true,
				autoWidth: true,
				placement: 'top',
				content: value
			});
		}
	};

	onBeforeUnmount(() => {
		poper && poper.destroy();
		poper = null;
	});

	return { open };
};
