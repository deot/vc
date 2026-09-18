import { nextTick, watch } from 'vue';
import type { Ref } from 'vue';
import type { Store } from '../store';
import type { Props } from '../table-props';

type Options = {
	isReady: Ref<boolean>;
	updateLayout: () => void;
};

/**
 * 把 props 同步进 store / layout
 *
 * 其中多数 watch 为 immediate，会在调用处立即执行（如 store.setData），
 * 因此须在原先这些 watch 所在的位置调用，保持与其它 setup 代码的先后顺序
 * @param props Table props
 * @param store 表格 store
 * @param options 就绪状态与表格布局更新
 */
export const usePropsSync = (props: Props, store: Store, options: Options) => {
	const { isReady, updateLayout } = options;
	const { layout } = store;

	watch(
		() => props.height,
		(v) => {
			layout.setHeight(v);
		},
		{ immediate: true }
	);

	watch(
		() => props.maxHeight,
		(v) => {
			layout.setMaxHeight(v);
		},
		{ immediate: true }
	);

	watch(
		() => props.currentRowValue,
		(v) => {
			if (!props.primaryKey) return;
			store.row.setById(v);
		},
		{ immediate: true }
	);

	watch(
		() => [props.data, props.data.length],
		() => {
			store.setData(props.data);
			isReady.value && nextTick(updateLayout);
		},
		{ immediate: true }
	);

	watch(
		() => props.expandRowValue,
		(v) => {
			if (v) {
				store.setExpandRowValueAdapter(v);
			}
		},
		{ immediate: true }
	);

	// v-model:columns 外部写回：按 id 设置 hidden + 按 id 重排
	// deep 以便外部仅修改某项 hidden 字段（数组引用不变）也能触发
	// 防回环由 store.column.applyExternal 内部控制
	watch(
		() => props.columns,
		(v) => {
			if (!Array.isArray(v) || v.length === 0) return;
			store.column.applyExternal(v);
		},
		{ deep: true, flush: 'post' }
	);
};
