import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { raf } from '@deot/helper-utils';
import type { Layout } from '../store/modules';
import type { Props } from '../table-props';

type Options = {
	tableWrapper: Ref<any>;
	headerWrapper: Ref<any>;
	footerWrapper: Ref<any>;
	bodyXWrapper: Ref<any>;
	layout: Layout;
	props: Props;
};

/**
 * 横向滚动同步：表头 / 合计行跟随表体，并在根节点维护 is-scrolling-* 类名
 * @param options 相关元素与布局
 * @returns 表体滚动时的处理函数
 */
export const useScrollSync = (options: Options) => {
	const { tableWrapper, headerWrapper, footerWrapper, bodyXWrapper, layout, props } = options;
	const scrollPosition = ref('left');

	// 同步滚动：sticky 模式只剩一份 DOM，仅需保持 header / footer 横向滚动跟随 body
	const handleScrollX = () => {
		if (!bodyXWrapper.value) return;
		const { scrollLeft, offsetWidth, scrollWidth } = bodyXWrapper.value;
		if (headerWrapper.value) headerWrapper.value.scrollLeft = scrollLeft;
		if (footerWrapper.value) footerWrapper.value.scrollLeft = scrollLeft;
		const maxScrollLeftPosition = scrollWidth - offsetWidth - 1;
		if (scrollLeft >= maxScrollLeftPosition) {
			scrollPosition.value = 'right';
		} else if (scrollLeft === 0) {
			scrollPosition.value = 'left';
		} else {
			scrollPosition.value = 'middle';
		}
	};

	// 直接修改className（不使用render函数）, 解决临界值设置修改className时的顿挫。
	// 挂到 .vc-table 根节点上，让 header / body / footer 三处的 sticky 阴影都能共用同一个状态。
	watch(
		() => [scrollPosition.value, props.data?.length],
		([v]) => {
			raf(() => {
				const el = tableWrapper.value;
				if (!el) return;
				const className = `is-scrolling-${layout.states.scrollX ? v : 'none'}`;

				if (el.classList.contains(className)) return;

				el.classList.remove(...['left', 'middle', 'right', 'none'].map(i => `is-scrolling-${i}`));
				el.classList.add(className);
			});
		},
		{ immediate: true }
	);

	return { handleScrollX };
};
