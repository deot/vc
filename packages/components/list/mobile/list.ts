import { defineComponent, h, provide } from 'vue';
import { props as listProps } from './list-props';

const COMPONENT_NAME = 'vcm-list';

export const MList = defineComponent({
	name: COMPONENT_NAME,
	props: listProps,
	setup(props, { slots }) {
		provide('list', { props });
		return () => {
			return h(
				props.tag,
				{
					class: [
						'vcm-list',
						{
							'is-border': props.border
						}
					]
				},
				slots
			);
		};
	}
});
