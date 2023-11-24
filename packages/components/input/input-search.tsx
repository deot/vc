/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import { props as inputSearchProps } from './input-search-props';

import { Icon } from '../icon/index';
import { Input } from './input';
import { useInputSearch } from './use-input-search';
import { useInherit } from './use-inherit';
import { useNativeEmitter } from './use-native-emitter';

const COMPONENT_NAME = 'vc-input-search';

export const InputSearch = defineComponent({
	name: COMPONENT_NAME,
	props: inputSearchProps,
	// 无需声明clear，因为会直接绑定到Input，以下是当前组件使用到的
	emits: [
		'update:modelValue',
		'input',
		'change',
		'focus',
		'blur',
		'paste',
		'keydown',
		'keypress',
		'keyup',
		'enter',
		'tip'
	],
	setup(props, { slots, expose }) {
		const input = ref<HTMLElement>();
		
		useNativeEmitter(input, expose);

		const { currentValue, listeners, handleSearch } = useInputSearch();
		const { binds } = useInherit();

		return () => {
			return (
				<Input
					ref={input}
					{
						...binds.value
					}
					modelValue={currentValue.value}
					clearable={props.clearable}
					prepend={props.prepend}
					append={props.append}
					type={props.type}
					class="vc-input-search"
					{
						...listeners
					}
				>
					{{
						prepend: slots.prepend && (() => slots.prepend?.()),
						append: (() => slots.append?.() || (
							<div class={['vc-input-search__content', { 'is-disabled': binds.value.disabled }]}>
								{
									props.enterText === true 
										? <Icon 
											type={props.append || 'search'} 
											// @ts-ignore
											onClick={handleSearch}
										/>
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
