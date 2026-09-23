import { nextTick, watch } from 'vue';
import { isEqual } from 'lodash-es';
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
		() => [props.data, props.data.length],
		() => {
			store.setData(props.data);
			// 数据晚于 currentRowValue 到达（如异步加载）时，按 currentRowValue 找回当前行
			if (props.primaryKey && props.currentRowValue != null && !store.states.currentRow) {
				store.row.setById(props.currentRowValue);
			}
			isReady.value && nextTick(updateLayout);
		},
		{ immediate: true }
	);

	// 初始值与数据晚到的情况由上方 data 同步处理
	watch(
		() => props.currentRowValue,
		(v) => {
			if (!props.primaryKey) return;
			store.row.setById(v);
		}
	);

	// 按值比较：模板中的字面量数组每次渲染都是新引用，不应因此重置用户的展开操作
	watch(
		() => props.expandRowValue,
		(v, oldV) => {
			if (!v || isEqual(v, oldV)) return;
			store.setExpandRowValue(v);
			isReady.value && nextTick(updateLayout);
		},
		{ immediate: true }
	);

	// 树节点的默认展开状态变化：重建可见行
	watch(
		() => props.defaultExpandAll,
		() => {
			store.updateList();
			isReady.value && nextTick(updateLayout);
		}
	);

	// 开启 / 关闭合并：立即重建渲染块
	// 只看有无，不看函数引用：模板里的内联函数每次渲染都是新引用，按引用监听会让每次父级渲染都整表重算；
	// 换一套合并规则会在 data / 列变化时生效（Block 按 getSpan 引用判断缓存是否失效）
	watch(
		() => typeof props.getSpan === 'function',
		() => {
			store.updateList();
			isReady.value && nextTick(updateLayout);
		}
	);

	// 子行不可选择时，移出已选中的子行
	watch(
		() => props.expandSelectable,
		() => {
			store.selection.clean();
			store.selection.updateAllSelected();
		}
	);

	// v-model:columns 外部写回：按 id 设置 hidden + 按 id 重排
	// deep 以便外部仅修改某项 hidden 字段（数组引用不变）也能触发
	// 防回环与空值由 store.column.applyExternal 内部处理：空数组也须交给它，回流标志才会复位
	watch(
		() => props.columns,
		(v) => {
			store.column.applyExternal(v);
		},
		{ deep: true, flush: 'post' }
	);
};
