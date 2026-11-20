import { reactive } from 'vue';

// 同一 top 的固定定位提示竖向排列：单行提示高 33px，间距 7px（与此前每条下移 40px 一致）
export const GAP = 7;

export interface StackItem {
	// 第一条提示的位置（props.top）
	top: number;
	// 提示面板的高度
	height: number;
}

const items = reactive<StackItem[]>([]);

/**
 * 加入堆叠：返回的 item 为响应式对象，修改 top / height 后，同组后续提示的位置随之更新
 * @param top ~
 * @returns item
 */
export const add = (top: number): StackItem => {
	const item = reactive({ top, height: 0 });
	items.push(item);
	return item;
};

/**
 * 移出堆叠，后续提示上移补位；可重复调用
 * @param item ~
 */
export const remove = (item: StackItem) => {
	const index = items.indexOf(item);
	index !== -1 && items.splice(index, 1);
};

/**
 * 在堆叠中的位置：同一 top 的前序提示高度与间距之和
 * @param item ~
 * @returns px
 */
export const getOffset = (item: StackItem) => {
	let offset = item.top;
	for (const it of items) {
		if (it === item) break;
		// 尚未量到高度（刚挂载或未显示）的不占位
		if (it.top === item.top && it.height) offset += it.height + GAP;
	}
	return offset;
};
