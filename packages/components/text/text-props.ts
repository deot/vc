import { h } from 'vue';
import type { ExtractPropTypes } from 'vue';

export const props = {
	tag: {
		type: String,
		default: 'div'
	},
	value: {
		type: String,
		default: ''
	},
	line: {
		type: Number,
		default: 0
	},
	// TODO: 是否改为tail-indent来表示尾部缩进
	indent: {
		type: Number,
		default: 0
	},
	resize: {
		type: [Boolean, Number],
		default: 100
	},
	suffix: {
		type: String,
		default: '...'
	},
	placement: {
		type: String,
		default: 'top'
	},
	portalClassName: [Object, String, Array],
	portalStyle: [Object, String, Array],
	renderRow: {
		type: Function,
		// 函数式可以用于高亮显示
		default: (props$: any) => {
			const { value } = props$;
			return h('span', {}, value);
		}
	}
};
export type Props = ExtractPropTypes<typeof props>;
