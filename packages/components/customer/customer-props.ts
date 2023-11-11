import type { ExtractPropTypes, SetupContext, PropType } from 'vue';

export const props = {
	render: {
		type: Function as PropType<(props: Record<string, unknown>, context: SetupContext) => any>,
		default: () => null
	}
};
export type Props = ExtractPropTypes<typeof props>;