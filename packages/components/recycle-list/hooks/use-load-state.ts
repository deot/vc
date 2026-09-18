import { computed, reactive, watch } from 'vue';
import type { Store, RecycleListLoadState } from '../store';
import type { Props } from '../recycle-list-props';

/**
 * 列表的加载状态：lazyTail、ScrollState、load-change 共用这一份，不再各自推导
 *
 * 字段都是 computed，值不变就不会通知，读哪个字段只依赖哪个字段
 * @param props 组件 props（读 disabled）
 * @param store 数据中枢
 * @returns 加载状态（reactive，引用稳定）
 */
export const useLoadState = (props: Props, store: Store) => {
	// disabled 挡住了远程分支，store.states.isEnd 永不置真：以本地数据全部构建并完成布局为准
	const isEnd = computed(() => store.states.isEnd || (props.disabled && store.states.isBuilt));
	return reactive({
		isEnd,
		isLoading: computed(() => store.states.isLoading),
		isSilentRefresh: computed(() => store.states.isSilentRefresh),
		// 远程路径结束时 stop() 会裁掉全部占位，disabled 下不分配占位，因此没有节点即没有数据
		isEmpty: computed(() => isEnd.value && store.states.rebuildData.length === 0)
	}) as RecycleListLoadState;
};

/**
 * 把加载状态以快照形式单向推给外层（load-change）
 *
 * 只出不进：没有对应的属性，也不 emit `update:*`；加载是否结束由列表自己决定，外层写回会误关 loadData。
 * 任一字段变化就发完整快照；immediate 让外层挂载即拿到初值
 * @param loadState 加载状态
 * @param emit 组件的 emit
 */
export const useLoadEmitter = (
	loadState: RecycleListLoadState,
	emit: (event: 'load-change', loadState: RecycleListLoadState) => void
) => {
	// 载荷是新对象且字段均为原始值，外层改它不会回写
	watch(() => ({ ...loadState }), v => emit('load-change', v), { immediate: true });
};
