import type { ExtractPropTypes } from 'vue';
import { valueType } from '../../customer/customer-props';

export const props = {
	label: valueType
};
export type Props = ExtractPropTypes<typeof props>;
