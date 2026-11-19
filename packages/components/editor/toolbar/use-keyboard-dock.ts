import { ref, watch, onBeforeUnmount } from 'vue';
import type { Ref, ShallowRef } from 'vue';
import type Quill from 'quill';

/**
 * 工具栏停靠在虚拟键盘上方（toolbarPlacement: 'keyboard'）
 * - 停靠时工具栏改为 fixed，位置按 visualViewport 计算：键盘弹出时可视区缩小，底边距 = innerHeight - (offsetTop + height)
 * - 原位置由占位保持高度，内容不跳动
 * - 光标被工具栏挡住时滚动页面，让光标停在工具栏上方
 * @param options ~
 * @param options.active 是否停靠
 * @param options.holder 工具栏的占位容器（工具栏为其第一个子元素）
 * @param options.editor Quill 实例
 * @returns 占位高度与工具栏的定位样式
 */
export const useKeyboardDock = (options: {
	active: Ref<boolean>;
	holder: Ref<HTMLElement | undefined>;
	editor: ShallowRef<Quill | undefined>;
}) => {
	const { active, holder, editor } = options;
	const height = ref(0);
	const style = ref<Record<string, string>>();

	const update = () => {
		const viewport = window.visualViewport;
		const offsetTop = viewport?.offsetTop ?? 0;
		const viewportHeight = viewport?.height ?? window.innerHeight;
		style.value = {
			left: `${viewport?.offsetLeft ?? 0}px`,
			width: `${viewport?.width ?? window.innerWidth}px`,
			bottom: `${Math.max(0, window.innerHeight - offsetTop - viewportHeight)}px`
		};
	};

	// 光标底边超过工具栏上沿时滚动页面
	const reveal = () => {
		const quill = editor.value;
		const range = quill?.getSelection();
		const toolbar = holder.value?.firstElementChild;
		if (!quill || !range || !toolbar) return;
		const bounds = quill.getBounds(range.index, range.length);
		if (!bounds) return;
		const caretBottom = quill.container.getBoundingClientRect().top + bounds.bottom;
		const limit = toolbar.getBoundingClientRect().top;
		caretBottom > limit && window.scrollBy(0, caretBottom - limit + 8);
	};

	let frame = 0;
	const handleViewport = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			update();
			reveal();
		});
	};

	const bind = (on: boolean) => {
		const viewport = window.visualViewport;
		const method = on ? 'addEventListener' : 'removeEventListener';
		viewport?.[method]('resize', handleViewport);
		viewport?.[method]('scroll', handleViewport);
		window[method]('resize', handleViewport);
		editor.value?.[on ? 'on' : 'off']('editor-change', handleViewport);
	};

	watch(active, (value) => {
		if (value) {
			height.value = holder.value?.offsetHeight || 0;
			update();
			bind(true);
		} else {
			bind(false);
			cancelAnimationFrame(frame);
			style.value = undefined;
		}
	});

	onBeforeUnmount(() => active.value && bind(false));

	return {
		height,
		style
	};
};
