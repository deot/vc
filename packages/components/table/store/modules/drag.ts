import { computed, reactive, toRaw } from 'vue';
import { bisectLast } from '../../../recycle-list/store/position';
import type { Store } from '../store';
import type { TableBlockDragPayload } from '../../types';

/**
 * 落点位置：相对落点块之前 / 之后
 */
export type TableDropPosition = 'before' | 'after';

/**
 * 块的移动：data 中 [from, from + count) 这段行移到移除后数组的 insert 处
 */
export type TableBlockMove = {
	from: number;
	count: number;
	insert: number;
};

/**
 * 拖拽排序（以块为单位）：
 * 	- 块即渲染 / 虚拟化的最小单位（见 Block），普通表格一行一块，getSpan 纵向合并的若干行为一块；
 * 	- 非树形表格的块对应 data 中连续的一段行，移动块即移动这段行；
 * 	- data 由外部持有（v-model:data），这里只计算新顺序，并记录最近一次发出的顺序，
 * 	  外部写回时 setData 据此识别为重排，保留选中等状态。
 */
export class Drag {
	store: Store;

	// 最近一次发出（update:data）的顺序，元素为 raw 行；写回命中后清除，未命中时保留到下一次发出
	pending: any[] | null = null;

	/**
	 * 整行显示 move 光标（并禁用触摸长按的系统菜单）：开启了整行拖拽，且没有把手列（有把手时由把手提示）；
	 * 树形表格暂不支持拖拽
	 */
	rowCursor = computed(() => {
		const { store } = this;
		return !!store.table.props.draggable
			&& !store.tree.isTree
			&& !store.states.columns.some(column => column.states.type === 'drag');
	});

	constructor(store: Store) {
		this.store = store;
	}

	/**
	 * 块的行数据（与 row-click 等事件一致，取自渲染块）
	 * @param block states.list 中的块
	 * @returns 行数据
	 */
	getRows(block: any): any[] {
		return block.rows.map((row: any) => row.data);
	}

	/**
	 * 块的行与首行行号：allowDrag、block-drag-start / end 的参数
	 * @param block states.list 中的块
	 * @returns 行与首行行号
	 */
	getPayload(block: any): TableBlockDragPayload {
		return { rows: this.getRows(block), rowIndex: block.rowStart };
	}

	/**
	 * 按行号查找所属的块（states.list 按 rowStart 递增）
	 *
	 * 查找本身不建立响应式依赖：把手在渲染中调用，list 在每次 setData 时整体替换，不应让所有块随之重渲染；
	 * 找到的块经响应式代理返回，之后读取它的行仍按块追踪
	 * @param rowIndex 行号
	 * @returns 块；不存在时为 null
	 */
	getBlockByRowIndex(rowIndex: number) {
		const { list } = toRaw(this.store.states);
		const block = list[bisectLast(list.length, i => list[i].rowStart <= rowIndex)];
		return block && rowIndex < block.rowStart + block.rows.length ? reactive(block) : null;
	}

	/**
	 * 块能否被拖动：树形表格暂不支持；其余交给 allowDrag
	 * @param block 块
	 * @returns 能否拖动
	 */
	canDrag(block: any) {
		if (this.store.tree.isTree) return false;
		const { allowDrag } = this.store.table.props;
		return typeof allowDrag !== 'function' || !!allowDrag(this.getPayload(block));
	}

	/**
	 * 能否放到落点：交给 allowDrop
	 * @param block 拖动的块
	 * @param target 落点块
	 * @param position 相对落点块的位置
	 * @returns 能否放置
	 */
	canDrop(block: any, target: any, position: TableDropPosition) {
		const { allowDrop } = this.store.table.props;
		return typeof allowDrop !== 'function' || !!allowDrop({
			rows: this.getRows(block),
			targetRows: this.getRows(target),
			position
		});
	}

	/**
	 * 计算块的移动
	 * @param block 拖动的块
	 * @param target 落点块
	 * @param position 相对落点块的位置
	 * @returns 移动；顺序不变时为 null
	 */
	getMove(block: any, target: any, position: TableDropPosition): TableBlockMove | null {
		const from = block.rowStart;
		const count = block.rows.length;
		let insert = position === 'before' ? target.rowStart : target.rowStart + target.rows.length;
		if (insert > from) insert -= count;
		return insert === from ? null : { from, count, insert };
	}

	/**
	 * 按移动生成新的 data（元素为 raw 行，即外部数组中存放的行），并记录为待写回的顺序
	 * @param move 块的移动
	 * @returns 新的 data
	 */
	apply(move: TableBlockMove) {
		const next = toRaw(this.store.states.data).slice();
		const rows = next.splice(move.from, move.count);
		next.splice(move.insert, 0, ...rows);
		this.pending = next;
		return next;
	}

	/**
	 * 外部写回的 data 是否为最近一次发出的顺序（逐项比较 raw 行，写回副本也能识别）
	 * @param data 新的 data
	 * @returns 是否为拖拽后的重排
	 */
	consume(data: any[]) {
		const pending = this.pending;
		if (!pending) return false;
		const source = toRaw(data);
		if (source.length !== pending.length) return false;
		for (let i = 0; i < source.length; i++) {
			if (toRaw(source[i]) !== toRaw(pending[i])) return false;
		}
		this.pending = null;
		return true;
	}
}
