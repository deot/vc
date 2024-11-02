import type { ExtractPropTypes } from 'vue';
import type { Render } from '../customer/types';
import { STATUS_MAP } from './container-constant';

export const props = {
	inverted: {
		type: Boolean,
		default: false
	},

	pullable: {
		type: Boolean,
		default: false
	},
	pauseY: {
		type: Number,
		default: 30
	},
	render: {
		type: Function as Render,
		default: ({ status, type }) => STATUS_MAP[type][status]
	}
};
export type Props = ExtractPropTypes<typeof props>;
