import type { ExtractPropTypes, PropType } from 'vue';

export const props = {
	modelValue: {
		type: [Number, String],
		default: 0
	},
	// 星星的数量
	count: {
		type: Number,
		default: 5
	},
	// 选中及半选的颜色；不传时取 --vc-rate-color（默认金色）
	color: String,
	icon: {
		type: String,
		default: 'star'
	},
	// 自定义的字符串
	character: String,
	half: {
		type: Boolean,
		default: false
	},
	clearable: {
		type: Boolean,
		default: false
	},
	// 禁用：不可操作，整体半透明
	disabled: {
		type: Boolean,
		default: false
	},
	// 只读：仅展示，颜色照常
	readonly: {
		type: Boolean,
		default: false
	},
	// 每项的提示
	tooltip: {
		type: Array as PropType<unknown[]>,
		default: () => ([])
	},
	iconStyle: {
		type: Object,
		default: () => ({})
	}
};
export type Props = ExtractPropTypes<typeof props>;
