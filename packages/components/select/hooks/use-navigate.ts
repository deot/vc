import { nextTick, ref, watch } from 'vue';
import type { WatchSource } from 'vue';
import { getViewportRect } from '../../scroller/utils';
import { ScrollerManager } from '../../scroller/manager';
import type { SelectListExposed } from '../select-list';

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
 * 节点滚动到 Scroller 可视范围内所需的滚动量（滚动坐标）
 * @param el ~
 * @param scroller ~
 * @param align 已完整可见时为 0；否则 nearest：贴近离得近的一边，start：置顶
 * @returns 滚动量
 */
export const getScrollOffset = (el: Element, scroller: HTMLElement, align: 'nearest' | 'start' = 'nearest') => {
	const { top, bottom, scale } = getViewportRect(scroller);
	const rect = el.getBoundingClientRect();
	const offset = rect.top < top || (align === 'start' && rect.bottom > bottom)
		? rect.top - top
		: rect.bottom > bottom ? rect.bottom - bottom : 0;
	return offset / scale;
};

/**
 * 把节点滚动到其所在 Scroller 的可视范围内；只调整该容器，不滚动页面
 * @param el ~
 * @param align 见 getScrollOffset
 */
export const scrollIntoScroller = (el?: Element | null, align: 'nearest' | 'start' = 'nearest') => {
	const scroller = el?.closest<HTMLElement>('.vc-scroller');
	if (!el || !scroller) return;
	const offset = getScrollOffset(el, scroller, align);
	if (!offset) return;

	// 经 Scroller 写入：自绘滚动条同步更新
	const y = scroller.scrollTop + offset;
	const instance = ScrollerManager.get(scroller);
	instance ? instance.scrollTo({ y }) : (scroller.scrollTop = y);
};

// 从 from 起按 step 方向找第一个可用项，首尾循环；没有可用项时为 -1
export const findEnabled = <T>(list: T[], from: number, step: number, isEnabled: (item: T, index: number) => boolean) => {
	const size = list.length;
	for (let i = 0; i < size; i++) {
		const index = (((from + step * i) % size) + size) % size;
		if (isEnabled(list[index], index)) return index;
	}
	return -1;
};

interface NavigateOptions<T> {
	// 列表的数据（与 SelectList 的 data 一致）
	getList: () => T[];
	// 可高亮的项（如未禁用、默认渲染的选项）
	isEnabled: (item: T, index: number) => boolean;
	// 列表挂载（弹层打开）时优先高亮的项，如首个已选中的一项；没有时为第一个可用项
	prefer?: (item: T, index: number) => boolean;
	// 回车：选中高亮的项
	select: (item: T, index: number) => void;
	// 列表内容的来源（搜索词、数据）：变化后默认高亮第一项，回车即可选中
	source?: WatchSource;
}

/**
 * 列表的键盘高亮：按数据下标在可用项间移动，鼠标移入与键盘共用同一个高亮
 * 	- 高亮的呈现交给 SelectList（直接写在行的节点上，不触发渲染；虚拟列表中尚未渲染的行滚入时补上）
 * 	- 记下高亮的项：列表增减（如树展开、收起）后调用 sync 按项重新对上下标
 * @param options ~
 * @returns setList：SelectList 的 ref；hover：交给 SelectList 的 hover；move / enter：交给键盘；scrollIntoActive：把高亮项滚动到可视范围（不在其中时置顶）；
 * getActive / activate：读取、设置（并滚动到）高亮的下标；sync：列表变化后按项对上下标
 */
export const useNavigate = <T>(options: NavigateOptions<T>) => {
	const { getList, isEnabled, prefer, select, source } = options;
	let list: SelectListExposed | null = null;
	let active = -1;
	let activeItem: T | undefined;

	const set = (index: number, scroll?: boolean) => {
		active = index;
		activeItem = getList()[index];
		list?.highlight(index);
		scroll && list?.scrollToIndex(index, 'nearest');
	};

	const reset = (preferred?: NavigateOptions<T>['prefer'], scroll?: boolean) => {
		const items = getList();
		const index = preferred ? items.findIndex((item, i) => isEnabled(item, i) && preferred(item, i)) : -1;
		set(index !== -1 ? index : findEnabled(items, 0, 1, isEnabled), scroll);
	};

	const setList = (vm: any) => {
		vm = vm || null;
		if (vm === list) return;
		list = vm;
		vm && reset(prefer);
	};

	const move = (step: number) => {
		const items = getList();
		if (!items.length) return;
		const from = active === -1 ? (step > 0 ? 0 : items.length - 1) : active + step;
		const index = findEnabled(items, from, step, isEnabled);
		index !== -1 && set(index, true);
	};

	const enter = () => {
		const item = getList()[active];
		item !== undefined && isEnabled(item, active) && select(item, active);
	};

	const hover = (index: number) => {
		const item = getList()[index];
		item !== undefined && isEnabled(item, index) && set(index);
	};

	const scrollIntoActive = () => {
		list?.scrollToIndex(active, 'start');
	};

	const sync = () => {
		if (activeItem === undefined) return;
		const index = getList().indexOf(activeItem);
		index === -1 ? reset() : index !== active && set(index);
	};

	// 内容变化后高亮第一项并滚动到它（列表变短时滚动位置可能停在末尾，回车会选中看不见的一项）
	source && watch(source, () => reset(void 0, true), { flush: 'post' });

	return {
		setList,
		hover,
		move,
		enter,
		scrollIntoActive,
		sync,
		getActive: () => active,
		activate: (index: number) => index !== -1 && set(index, true)
	};
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
	// 把该项滚动到可视范围
	scrollTo: (columnIndex: number, rowIndex: number) => void;
	// 回车（不在搜索时）
	enter: () => void;
	// 是否在搜索：搜索时改为显示扁平的搜索结果（SelectPaths），方向键与回车交给它
	isSearching: () => boolean;
	// 级联列的容器：搜索结果沿用它的宽度
	getView: () => HTMLElement | null | undefined;
	// 向左展开（见 cascader/hooks/use-column-direction）：← 进入下一级，→ 回到上一级
	isInverted?: () => boolean;
}

// 搜索结果的宽度沿用进入搜索前的级联列，并限制在该范围内，避免弹层宽度随结果跳动
const MIN_WIDTH = 240;
const MAX_WIDTH = 360;
export const getPathsWidth = (el?: HTMLElement | null) => {
	return Math.min(Math.max(el?.offsetWidth || 0, MIN_WIDTH), MAX_WIDTH);
};

/**
 * 级联列（Cascader / TreeSelect 级联模式）的鼠标移入、键盘与搜索结果切换
 * 	- 鼠标：指针在某项上移动时等同移入该项，见 handleMove
 * 	- 方向键：在路径末端所在的列内上下移动，左右回到父级 / 进入子级
 * 	- 搜索时由搜索结果列表接管
 * @param options ~
 * @returns paths：搜索结果列表（SelectPaths）的 ref；searchWidth：它的宽度；navigator：交给键盘；handleMove：交给级联列（CascaderColumns）的 move
 */
export const useColumnNavigate = (options: ColumnNavigateOptions) => {
	const { getPath, getColumns, hover, scrollTo, enter, isSearching, getView, isInverted } = options;
	const paths = ref<Navigator | null>();

	// 默认 flush: 'pre'，此时 DOM 仍是列视图
	const searchWidth = ref(getPathsWidth());
	watch(isSearching, (v) => {
		v && (searchWidth.value = getPathsWidth(getView()));
	});

	const find = (list: ColumnItem[], from: number, step: number) => findEnabled(list, from, step, item => !item.disabled);

	const go = (list: ColumnItem[], columnIndex: number, rowIndex: number) => {
		if (rowIndex === -1) return;
		hover(list[rowIndex], columnIndex, rowIndex);
		nextTick(() => scrollTo(columnIndex, rowIndex));
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
		shift: step => shift(isInverted?.() ? -step : step),
		enter: () => (isSearching() ? paths.value?.enter?.() : enter())
	};

	/**
	 * 指针在某项上移动：等同移入该项
	 * 	- 不用 mouseenter：列数、列宽变化使内容在静止的指针下平移时（如弹层贴边），浏览器会补发 mouseenter 但不补发 mousemove，
	 * 	  响应它会连锁展开 / 收起（指针下换了一项，又引起平移）
	 * 	- 已是路径末端的一项不重复处理（在同一项内移动时每次都会触发）
	 * @param cell 该项及其所在的列、行
	 * @param cell.item ~
	 * @param cell.columnIndex ~
	 * @param cell.rowIndex ~
	 */
	const handleMove = ({ item, columnIndex, rowIndex }: { item: ColumnItem; columnIndex: number; rowIndex: number }) => {
		const path = getPath();
		if (path.length === columnIndex + 1 && path[columnIndex] == item.value) return;
		hover(item, columnIndex, rowIndex);
	};

	return { paths, searchWidth, navigator, handleMove };
};
