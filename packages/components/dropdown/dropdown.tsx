/** @jsxImportSource vue */

import { defineComponent, computed } from 'vue';
import { useAttrs } from '@deot/vc-hooks';
import { props as dropdownProps } from './dropdown-props';
import { useDropdown } from './use-dropdown';
import { Popover } from '../popover/index';

const COMPONENT_NAME = 'vc-dropdown';

export const Dropdown = defineComponent({
	name: COMPONENT_NAME,
	props: dropdownProps,
	inheritAttrs: false,
	emits: ['update:modelValue', 'ready', 'close', 'visible-change', 'click'],
	setup(props, context) {
		const { slots, emit } = context;
		const its = useAttrs({ merge: false });
		const { isActive, handleChange } = useDropdown(props, context);

		const inherit = computed(() => {
			return {
				style: its.value.style,
				class: its.value.class,
			};
		});

		const attrs = computed(() => {
			return its.value.attrs;
		});

		return () => {
			return (
				<Popover
					{
						...attrs.value
					}
					modelValue={isActive.value}
					placement={props.placement}
					trigger={props.trigger}
					arrow={props.arrow}
					scrollable={props.scrollable}
					scrollerOptions={props.scrollerOptions}
					portalClass={['is-padding-none', 'vc-dropdown-wrapper', props.portalClass]}
					class={['vc-dropdown', inherit.value.class]}
					style={inherit.value.style}
					onReady={() => emit('ready')}
					onClose={() => emit('close')}
					// @ts-ignore
					onVisibleChange={handleChange}
				>
					{{
						default: () => slots?.default?.(),
						header: slots.header,
						content: () => slots?.content?.(),
						footer: slots.footer
					}}
				</Popover>

			);
		};
	}
});
