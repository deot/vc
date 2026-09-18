import { computed } from 'vue';
import type { Slots } from 'vue';
import { VcInstance } from '../../vc';
import type { Props } from '../recycle-list-props';
import type { Store, RecycleListLoadState } from '../store';

/**
 * 渲染派生：render* 属性的取值、是否有骨架、首尾 slot 的延迟规则
 * @param props 组件 props
 * @param slots 组件 slots
 * @param store 数据中枢（读 inverted）
 * @param loadState 加载状态
 * @returns 渲染期用到的派生值与 slot 渲染函数
 */
export const useRenderer = (
	props: Props,
	slots: Slots,
	store: Store,
	loadState: RecycleListLoadState
) => {
	// 组件属性优先，其次取全局配置
	const renderer = computed(() => {
		const globalProps = VcInstance.options?.RecycleList || {};
		return {
			refresh: props.renderRefresh || globalProps.renderRefresh,
			placeholder: props.renderPlaceholder || globalProps.renderPlaceholder,
			loading: props.renderLoading || globalProps.renderLoading,
			complete: props.renderComplete || globalProps.renderComplete,
			empty: props.renderEmpty || globalProps.renderEmpty
		};
	});

	const hasPlaceholder = computed(() => {
		return !!slots.placeholder || renderer.value.placeholder;
	});

	// lazyTail：延迟加载方向末端的 slot，直到列表到达末尾
	const isTailHidden = computed(() => props.lazyTail && !loadState.isEnd);

	/**
	 * 渲染首尾 slot；末端那一侧受 lazyTail 控制
	 *
	 * 末端随 inverted 翻转：数据向上生长时被列表不断推走的是 header 而非 footer，
	 * 与 ScrollState 的摆放规则一致
	 * @param name slot 名
	 * @returns slot 内容；末端被延迟时为 null
	 */
	const renderEdgeSlot = (name: 'header' | 'footer') => {
		const isTail = store.props.inverted ? name === 'header' : name === 'footer';
		return isTail && isTailHidden.value ? null : slots[name]?.();
	};

	return { renderer, hasPlaceholder, renderEdgeSlot };
};
