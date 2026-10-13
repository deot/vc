import { nextTick, ref, watch } from 'vue';
import type { WatchSource } from 'vue';
import { getViewportRect } from '../../scroller/utils';
import { ScrollerManager } from '../../scroller/manager';

/**
 * 弹层打开时响应方向键与回车的对象；方法返回 false 表示不处理（按键交还给浏览器或焦点所在的节点）
 */
export interface Navigator {
	// ↑ ↓
	move?: (step: number) => boolean | void;
	// ← →（仅在没有搜索词时）
	shift?: (step: number) => boolean | void;
	// Enter
	enter?: () => boolean | void;
}

/**
 * 把节点滚动到其所在 Scroller 的可视范围内；只调整该容器，不滚动页面
 * @param el ~
 */
export const scrollIntoScroller = (el?: Element | null) => {
	const scroller = el?.closest<HTMLElement>('.vc-scroller');
	if (!el || !scroller) return;
	const { top, bottom, scale } = getViewportRect(scroller);
	const rect = el.getBoundingClientRect();
	const offset = rect.top < top ? rect.top - top : rect.bottom > bottom ? rect.bottom - bottom : 0;
	if (!offset) return;

	// 经 Scroller 写入：自绘滚动条同步更新
	const y = scroller.scrollTop + offset / scale;
	const instance = ScrollerManager.get(scroller);
	instance ? instance.scrollTo({ y }) : (scroller.scrollTop = y);
};

interface NavigateOptions {
	// 可高亮的列表项
	selector: string;
	// 列表挂载（弹层打开）时优先高亮的列表项，如已选中的一项；没有匹配时为第一项
	prefer?: string;
	// 列表内容的来源（搜索词、数据）：变化后默认高亮第一项，回车即可选中
	source?: WatchSource;
}

/**
 * 列表的键盘高亮：按 DOM 顺序在匹配 selector 的节点间移动，鼠标移入与键盘共用同一个高亮
 * 	- 高亮用 data-active 标记，不经过响应式状态：移动时不触发列表项渲染，Vue 更新 class 也不会抹掉它
 * @param options ~
 * @returns setRoot：列表容器的 ref；handleMouseover：绑在列表容器上；move / enter：交给键盘
 */
export const useNavigate = (options: NavigateOptions) => {
	const { selector, prefer, source } = options;
	let root: Element | null = null;
	let active: Element | null = null;

	const getItems = () => Array.from(root?.querySelectorAll(selector) || []);

	const set = (el: Element | null, scroll?: boolean) => {
		if (el !== active) {
			active?.removeAttribute('data-active');
			el?.setAttribute('data-active', '');
			active = el;
		}
		scroll && scrollIntoScroller(el);
	};

	const reset = (preferred?: string) => {
		const items = getItems();
		set((preferred && items.find(item => item.matches(preferred))) || items[0] || null);
	};

	const setRoot = (el: any) => {
		// 组件实例取其根节点
		el = el?.$el || el || null;
		if (el === root) return;
		root = el;
		el && reset(prefer);
	};

	const move = (step: number) => {
		const items = getItems();
		if (!items.length) return;
		const index = active ? items.indexOf(active) : -1;
		const next = index === -1
			? (step > 0 ? 0 : items.length - 1)
			: (index + step + items.length) % items.length;
		set(items[next], true);
	};

	const enter = () => {
		active?.isConnected && (active as HTMLElement).click();
	};

	const handleMouseover = (e: MouseEvent) => {
		const el = (e.target as Element).closest?.(selector);
		el && root?.contains(el) && set(el);
	};

	source && watch(source, () => reset(), { flush: 'post' });

	return { setRoot, handleMouseover, move, enter };
};

interface ColumnItem {
	[key: string]: any;
	value?: any;
	disabled?: boolean;
}

interface ColumnNavigateOptions {
	// 当前浏览的路径（各级的 value）
	getPath: () => any[];
	// 各列的数据
	getColumns: () => ColumnItem[][];
	// 等同鼠标移入该项
	hover: (item: ColumnItem, columnIndex: number, rowIndex: number) => void;
	// 该项的节点，用于滚动到可视范围
	getItem: (columnIndex: number, rowIndex: number) => Element | null | undefined;
	// 回车（不在搜索时）
	enter: () => void;
	// 是否在搜索：搜索时改为显示扁平的搜索结果（SelectPaths），方向键与回车交给它
	isSearching: () => boolean;
	// 级联列的容器：搜索结果沿用它的宽度
	getView: () => HTMLElement | null | undefined;
}

// 搜索结果的宽度沿用进入搜索前的级联列，并限制在该范围内，避免弹层宽度随结果跳动
const MIN_WIDTH = 240;
const MAX_WIDTH = 360;
export const getPathsWidth = (el?: HTMLElement | null) => {
	return Math.min(Math.max(el?.offsetWidth || 0, MIN_WIDTH), MAX_WIDTH);
};

/**
 * 级联列（Cascader / TreeSelect 级联模式）的键盘与搜索结果切换
 * 	- 方向键：在路径末端所在的列内上下移动，左右回到父级 / 进入子级
 * 	- 搜索时由搜索结果列表接管
 * @param options ~
 * @returns paths：搜索结果列表（SelectPaths）的 ref；searchWidth：它的宽度；navigator：交给键盘
 */
export const useColumnNavigate = (options: ColumnNavigateOptions) => {
	const { getPath, getColumns, hover, getItem, enter, isSearching, getView } = options;
	const paths = ref<Navigator | null>();

	// 默认 flush: 'pre'，此时 DOM 仍是列视图
	const searchWidth = ref(getPathsWidth());
	watch(isSearching, (v) => {
		v && (searchWidth.value = getPathsWidth(getView()));
	});

	// 从 from 起按 step 方向找第一个可用项，首尾循环
	const find = (list: ColumnItem[], from: number, step: number) => {
		const size = list.length;
		for (let i = 0; i < size; i++) {
			const index = (((from + step * i) % size) + size) % size;
			if (!list[index].disabled) return index;
		}
		return -1;
	};

	const go = (list: ColumnItem[], columnIndex: number, rowIndex: number) => {
		if (rowIndex === -1) return;
		hover(list[rowIndex], columnIndex, rowIndex);
		nextTick(() => scrollIntoScroller(getItem(columnIndex, rowIndex)));
	};

	const move = (step: number) => {
		const path = getPath();
		const columnIndex = Math.max(path.length - 1, 0);
		const list = getColumns()[columnIndex] || [];
		if (!list.length) return;
		const current = list.findIndex(item => item.value == path[columnIndex]);
		const from = current === -1 ? (step > 0 ? 0 : list.length - 1) : current + step;
		go(list, columnIndex, find(list, from, step));
	};

	const shift = (step: number) => {
		const path = getPath();
		const columns = getColumns();
		if (step > 0) {
			const list = (path.length && columns[path.length]) || [];
			list.length && go(list, path.length, find(list, 0, 1));
		} else if (path.length > 1) {
			const columnIndex = path.length - 2;
			const list = columns[columnIndex] || [];
			go(list, columnIndex, list.findIndex(item => item.value == path[columnIndex]));
		}
	};

	const navigator: Navigator = {
		move: step => (isSearching() ? paths.value?.move?.(step) : move(step)),
		shift,
		enter: () => (isSearching() ? paths.value?.enter?.() : enter())
	};

	return { paths, searchWidth, navigator };
};
