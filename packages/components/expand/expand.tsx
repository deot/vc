/** @jsxImportSource vue */

import { defineComponent, ref, watch, withDirectives, vShow } from 'vue';
import { TransitionCollapse } from '../transition/index';
import { props as expandProps } from './expand-props';

const COMPONENT_NAME = 'vc-expand';

export const Expand = defineComponent({
	name: COMPONENT_NAME,
	props: expandProps,
	setup(props, { slots }) {
		const isActive = ref(false);
		const Content = props.tag;

		watch(
			() => props.modelValue,
			(v) => {
				isActive.value = v;
			},
			{ immediate: true }
		);

		return () => {
			return (
				<TransitionCollapse duration={{ enter: 200, leave: 200 }}>
					{
						withDirectives(
							<Content>
								{
									(
										props.alive
										|| (!props.alive && isActive.value)
									) && slots.default?.()
								}
							</Content>,
							[[vShow, isActive.value]]
						)
					}
				</TransitionCollapse>
			);
		};
	}
});
