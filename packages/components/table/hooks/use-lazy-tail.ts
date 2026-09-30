import { computed, ref, watch } from 'vue';
import type { ComputedRef } from 'vue';
import type { RecycleListLoadState } from '../../recycle-list';
import type { Props } from '../table-props';
import type { Store } from '../store';

/**
 * append 的延迟展示：记录内部 RecycleList 推送的加载状态，换算成行数后转发（load-change），据此决定 append 是否延迟
 *
 * 普通表格读 store 里的行数，须在 store 同步 data 之后调用
 * @param props Table props（读 lazyTail）
 * @param store Table 的 store（读渲染块与行数）
 * @param usesRecycleList 是否走虚拟列表
 * @param emit 组件的 emit
 * @param refreshAffix append 出现后重算吸底 dock（横向滚动条 + 合计行）的边界
 * @returns 供 TableBody 监听的回调与 append 是否隐藏
 */
export const useLazyTail = (
	props: Props,
	store: Store,
	usesRecycleList: ComputedRef<boolean>,
	emit: (event: 'load-change', loadState: RecycleListLoadState) => void,
	refreshAffix: () => void
) => {
	const loadState = ref<RecycleListLoadState>({ isEnd: false, isLoading: false, isSilentRefresh: false, isEmpty: false, loaded: 0 });
	const commit = (v: RecycleListLoadState) => {
		loadState.value = v;
		emit('load-change', v);
	};

	// 内部 RecycleList 按块计数：合并单元格时一块含多行，换算成已构建的行数（树形表格为铺平后的可见行）
	const toRowCount = (blocks: number) => {
		const { list } = store.states;
		const block = list[Math.min(blocks, list.length) - 1];
		return block ? block.rowStart + block.rows.length : 0;
	};

	// 虚拟模式由内部 RecycleList 推送，这里记一份用于 lazyTail 并转发
	const handleLoadChange = (v: RecycleListLoadState) => {
		commit({ ...v, loaded: toRowCount(v.loaded) });
	};

	// 普通表格整表一次渲染完，没有分批过程，直接视为已到末尾；
	// 否则 @load-change + v-show="loadState.isEnd" 的写法在非虚拟表格上永远等不到结束
	watch(
		() => [usesRecycleList.value, store.states.renderData.length] as const,
		([virtual, rows]) => {
			if (virtual) return;
			commit({ isEnd: true, isLoading: false, isSilentRefresh: false, isEmpty: rows === 0, loaded: rows });
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
