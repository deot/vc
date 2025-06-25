/** @jsxImportSource vue */

import { defineComponent, watch, computed, ref } from 'vue';
import { getUid } from '@deot/helper-utils';
import { useAttrs } from '@deot/vc-hooks';
import { props as dropdownProps } from './dropdown-props';
import { Popover } from '../popover/index';

const COMPONENT_NAME = 'vc-dropdown';

export const Dropdown = defineComponent({
	name: COMPONENT_NAME,
	props: dropdownProps,
	inheritAttrs: false,
	emits: ['update:modelValue', 'ready', 'close', 'visible-change', 'click'],
	setup(props, { slots, emit, expose }) {
		const its = useAttrs({ merge: false });
		const isActive = ref(false);
		const dropdownId = ref(getUid('dropdown'));

		const inherit = computed(() => {
			return {
				style: its.value.style,
				class: its.value.class,
			};
		});

		const attrs = computed(() => {
			return its.value.attrs;
		});

		watch(
			() => props.modelValue,
			(v) => {
				isActive.value = v;
			},
			{ immediate: true }
		);

		/**
		 * v-model 同步, 外部的数据改变时不会触发
		 */
		const sync = () => {
			emit('update:modelValue', isActive.value);
			emit('visible-change', isActive.value);
		};

		const handleChange = (v) => {
			isActive.value = v;
			sync();
		};

		const close = () => {
			isActive.value = false;
			sync();
		};

		expose({
			close,
			dropdownId
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
						content: () => slots?.content?.()
					}}
				</Popover>

			);
		};
	}
});
