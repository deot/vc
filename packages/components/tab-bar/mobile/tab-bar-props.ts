import type { ExtractPropTypes, PropType } from 'vue';
import type { TabBarOption, TabBarValue } from './tab-bar-item-props';

export const props = {
	// 选中项的 value（v-model），不传时取第一项
	modelValue: {
		type: [String, Number] as PropType<TabBarValue>
	},
	// 传了就按 data 渲染，忽略子组件
	data: {
		type: Array as PropType<TabBarOption[]>
	},
	// 固定在视口底部
	fixed: {
		type: Boolean,
		default: false
	},
	// fixed 时在原位置留同高占位（含安全区）
	placeholder: {
		type: Boolean,
		default: true
	},
	// 底部补安全区，不传时跟随 fixed
	safeArea: {
		type: Boolean,
		default: void 0
	},
	// fixed 时的层级
	zIndex: Number
};

export type Props = ExtractPropTypes<typeof props>;
