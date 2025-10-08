import type { ExtractPropTypes } from 'vue';

export const props = {
	value: {
		type: [String, Number, Boolean],
		default: void 0
	},
	label: {
		type: [String, Function],
		default: ''
	},
	/**
	 * 服务端渲染时，lazy设置为false，可以把内容渲染出来;
	 * 不能设置为!IS_SERVER, 会影响客服端激活，不一样会存在问题
	 */
	lazy: {
		type: Boolean,
		default: true
	},
	closable: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;
