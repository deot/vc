/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import { props as inputSearchProps } from './input-search-props';

import { Icon } from '../icon/index';
import { Input } from './input';
import { useInherit } from './use-inherit';
import { useNativeEmitter } from './use-native-emitter';

const COMPONENT_NAME = 'vc-input-search';

export const InputSearch = defineComponent({
	name: COMPONENT_NAME,
	props: inputSearchProps,
	inheritAttrs: false,
	setup(props, { emit, slots, expose, attrs }) {
		const input = ref<HTMLElement>();
		
		useNativeEmitter(input, expose);

		const { binds } = useInherit();

		return () => {
			return (
				<Input
					ref={input}
					{
						...binds.value
					}
					modelValue={props.modelValue}
					clearable={props.clearable}
					prepend={props.prepend}
					append={props.append}
					type={props.type}
					styleless={props.styleless}
					class={{ 'vc-input-search': !props.styleless }}
					{
						// 包含所有on*都会被绑定
						...attrs
					}
				>
					{{
						prepend: slots.prepend && (() => slots.prepend?.()),
						append: (() => slots.append?.() || (
							<div 
								class={['vc-input-search__content', { 'is-disabled': binds.value.disabled }]}
								onClick={(e) => emit('enter', e)}
							>
								{
									props.enterText === true 
										? <Icon type={props.append || 'search'} />
										: props.enterText
								}
							</div>
						))
					}}
				</Input>
			);
		};
	}
});
