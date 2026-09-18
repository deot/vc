import { computed, ref, watch } from 'vue';
import type { ComputedRef } from 'vue';
import type { RecycleListLoadState } from '../../recycle-list';
import type { Props } from '../table-props';

/**
 * append 的延迟展示：记录内部 RecycleList 推送的加载状态并原样转发（load-change），据此决定 append 是否延迟
 * @param props Table props（读 lazyTail、data）
 * @param usesRecycleList 是否走虚拟列表
 * @param emit 组件的 emit
 * @param refreshAffix append 出现后重算吸底合计行的边界
 * @returns 供 TableBody 监听的回调与 append 是否隐藏
 */
export const useLazyTail = (
	props: Props,
	usesRecycleList: ComputedRef<boolean>,
	emit: (event: 'load-change', loadState: RecycleListLoadState) => void,
	refreshAffix: () => void
) => {
	// 虚拟模式由内部 RecycleList 推送，这里记一份用于 lazyTail 并原样转发
	const loadState = ref<RecycleListLoadState>({ isEnd: false, isLoading: false, isSilentRefresh: false, isEmpty: false });
	const handleLoadChange = (v: RecycleListLoadState) => {
		loadState.value = v;
		emit('load-change', v);
	};

	// 普通表格整表一次渲染完，没有分批过程，直接视为已到末尾；
	// 否则 @load-change + v-show="loadState.isEnd" 的写法在非虚拟表格上永远等不到结束
	watch(
		() => [usesRecycleList.value, props.data.length === 0],
		([virtual, empty]) => {
			if (virtual) return;
			handleLoadChange({ isEnd: true, isLoading: false, isSilentRefresh: false, isEmpty: !!empty });
		},
		{ immediate: true }
	);

	// lazyTail：append 等数据全部进入虚拟列表后再渲染
	const isTailHidden = computed(() => props.lazyTail && !loadState.value.isEnd);

	// append 出现后表格总高度变化，吸底的合计行需要重算边界
	watch(isTailHidden, (hidden, oldHidden) => {
		if (!hidden && oldHidden) refreshAffix();
	});

	return { handleLoadChange, isTailHidden };
};
