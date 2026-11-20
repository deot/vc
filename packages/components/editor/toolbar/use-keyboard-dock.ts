import { ref, shallowRef, watch, onBeforeUnmount } from 'vue';
import type { Ref, ShallowRef } from 'vue';
import type Quill from 'quill';

type DockStyle = { left: string; width: string; bottom: string };

// 光标被工具栏挡住时，滚动页面留出的间距（px）
const REVEAL_GAP = 8;

// 停靠位置：按 visualViewport 计算（键盘弹出时可视区缩小，布局视口不变），底边距 = innerHeight - (offsetTop + height)
const getDockStyle = (): DockStyle => {
	const viewport = window.visualViewport;
	const offsetTop = viewport?.offsetTop ?? 0;
	const viewportHeight = viewport?.height ?? window.innerHeight;
	return {
		left: `${viewport?.offsetLeft ?? 0}px`,
		width: `${viewport?.width ?? window.innerWidth}px`,
		bottom: `${Math.max(0, window.innerHeight - offsetTop - viewportHeight)}px`
	};
};

/**
 * 工具栏停靠在虚拟键盘上方（toolbarPlacement: 'keyboard'）
 * - 停靠时工具栏改为 fixed 并移到 body（见 use-editor），位置按 visualViewport 计算；位置没变时不替换 style（不引起渲染）
 * - 原位置由占位保持高度，内容不跳动
 * - 光标被工具栏挡住时滚动页面，让光标停在工具栏上方；可视区变化、内容变化（editor-change）时下一帧检查
 * @param options ~
 * @param options.active 是否停靠
 * @param options.holder 工具栏的占位容器（停靠时保持原高度）
 * @param options.editor Quill 实例
 * @param options.getToolbar 工具栏节点
 * @returns 占位高度与工具栏的定位样式
 */
export const useKeyboardDock = (options: {
	active: Ref<boolean>;
	holder: Ref<HTMLElement | undefined>;
	editor: ShallowRef<Quill | undefined>;
	getToolbar: () => HTMLElement | undefined;
}) => {
	const { active, holder, editor, getToolbar } = options;
	const height = ref(0);
	const style = shallowRef<DockStyle>();

	const update = () => {
		const next = getDockStyle();
		const current = style.value;
		const isSame = !!current && current.left === next.left && current.width === next.width && current.bottom === next.bottom;
		isSame || (style.value = next);
	};

	// 光标底边超过工具栏上沿时滚动页面
	const reveal = () => {
		const quill = editor.value;
		const range = quill?.getSelection();
		const toolbar = getToolbar();
		if (!quill || !range || !toolbar) return;
		const bounds = quill.getBounds(range.index, range.length);
		if (!bounds) return;
		const caretBottom = quill.container.getBoundingClientRect().top + bounds.bottom;
		const limit = toolbar.getBoundingClientRect().top;
		caretBottom > limit && window.scrollBy(0, caretBottom - limit + REVEAL_GAP);
	};

	let frame = 0;
	const refresh = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			if (!active.value) return;
			update();
			reveal();
		});
	};

	const bind = (on: boolean) => {
		const viewport = window.visualViewport;
		const method = on ? 'addEventListener' : 'removeEventListener';
		viewport?.[method]('resize', refresh);
		viewport?.[method]('scroll', refresh);
		window[method]('resize', refresh);
		editor.value?.[on ? 'on' : 'off']('editor-change', refresh);
	};

	watch(active, (value) => {
		if (value) {
			height.value = holder.value?.offsetHeight || 0;
			update();
			bind(true);
			refresh();
		} else {
			bind(false);
			cancelAnimationFrame(frame);
			style.value = undefined;
		}
	});

	onBeforeUnmount(() => {
		active.value && bind(false);
		cancelAnimationFrame(frame);
	});

	return {
		height,
		style
	};
};
