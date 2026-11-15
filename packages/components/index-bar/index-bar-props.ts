import type { ExtractPropTypes, PropType } from 'vue';

export type IndexBarValue = string | number;

export interface IndexBarGroup {
	// 分组的标识，侧栏显示它
	value: IndexBarValue;
	// 分组标题，默认取 value
	label?: string;
	// 分组内的各项
	children?: unknown[];
	[key: string]: unknown;
}

export type IndexBarEstimateSize = number | ((ctx: { row: unknown; group: IndexBarGroup; index: number }) => number | undefined);

export const props = {
	// 当前分组的 value（v-model）；外部改值时滚动到该分组
	modelValue: {
		type: [String, Number] as PropType<IndexBarValue>
	},
	data: {
		type: Array as PropType<IndexBarGroup[]>,
		default: () => ([])
	},
	// 固定高度：自带滚动，虚拟列表（同 Table）
	height: {
		type: [String, Number]
	},
	// 最大高度：自带滚动，不虚拟（同 Table）
	maxHeight: {
		type: [String, Number]
	},
	// 不设高度时依靠外部滚动；开启后用虚拟列表（同 Table）
	virtualized: {
		type: Boolean,
		default: false
	},
	// 虚拟列表中分组内各项的预估尺寸；不传时取默认行高（桌面 40px，移动端 750 稿 108）
	estimateSize: {
		type: [Number, Function] as PropType<IndexBarEstimateSize>
	},
	// 分组标题吸顶
	sticky: {
		type: Boolean,
		default: true
	},
	// 吸附线距滚动容器可视区顶部的距离，同 Affix 的 offset
	offset: {
		type: [Number, String],
		default: 0
	},
	// 拖动侧栏时显示提示
	tip: {
		type: Boolean,
		default: true
	}
};

export type Props = ExtractPropTypes<typeof props>;
