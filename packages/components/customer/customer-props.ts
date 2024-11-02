import type { ExtractPropTypes } from 'vue';
import type { Render } from './types';

export const props = {
	render: {
		type: Function as Render,
		default: () => null
	}
};
export type Props = ExtractPropTypes<typeof props>;
