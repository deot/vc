/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as swipeActionProps } from './swipe-action-props';
import { useSwipeAction } from './use-swipe-action';

const COMPONENT_NAME = 'vcm-swipe-action';

export const MSwipeAction = defineComponent({
	name: COMPONENT_NAME,
	props: swipeActionProps,
	emits: ['update:modelValue'],
	setup(props, context) {
		const { slots } = context;
		const { root, listeners, getClasses, renderTrack } = useSwipeAction(props, context);

		return () => {
			return (
				<div
					ref={root}
					class={['vcm-swipe-action', getClasses()]}
					{...listeners}
				>
					{renderTrack(slots.default?.())}
				</div>
			);
		};
	}
});
