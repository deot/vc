/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import { props as inputSearchProps } from './input-search-props';

import { Icon } from '../icon/index';
import { Input } from './input';
import { useNativeEmitter } from './use-native-emitter';

const COMPONENT_NAME = 'vc-input-search';

export const InputSearch = defineComponent({
	name: COMPONENT_NAME,
	props: inputSearchProps,
	inheritAttrs: false,
	setup(props, { emit, slots, expose, attrs }) {
		const input = ref<HTMLElement>();

		useNativeEmitter(input, expose);

		return () => {
			return (
				<Input
					ref={input}
					{
						...props
					}
					class={{ 'vc-input-search': !props.styleless }}
					{
						// 包含所有on*都会被绑定
						...attrs
					}
				>
					{{
						prepend: slots.prepend && (() => slots.prepend?.()),
						append: () => slots.append?.() || (
							<div
								class={['vc-input-search__content', { 'is-disabled': props.disabled }]}
								onClick={e => emit('enter', e)}
							>
								{
									props.enterText === true
										? <Icon type={props.append || 'search'} />
										: props.enterText
								}
							</div>
						)
					}}
				</Input>
			);
		};
	}
});
