/** @jsxImportSource vue */

import { defineComponent, ref } from 'vue';
import { props as inputSearchProps } from '../input-search-props';

import { MIcon } from '../../icon/index.m';
import { MInput } from './input';
import { useNativeEmitter } from '../use-native-emitter';
import { useLocale } from '../../locale';

const COMPONENT_NAME = 'vcm-input-search';

export const MInputSearch = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...inputSearchProps,
		cancelText: {
			type: String,
			default: undefined
		}
	},
	inheritAttrs: false,
	setup(props, { emit, slots, expose, attrs }) {
		const { t } = useLocale();
		const input = ref<HTMLElement>();

		const isFocus = ref(false);
		useNativeEmitter(input, expose);

		const handleCancel = () => {
			// 这里会触发attrs中的函数
			emit('update:modelValue', '');
			emit('input', '');
			emit('cancel');
		};

		return () => {
			const { cancelText: customCancelText, ...inputOptions } = props;
			const cancelText = customCancelText ?? t('vc.MInputSearch.cancelText');
			return (
				<div class="vcm-input-search">
					<MInput
						ref={input}
						{
							...inputOptions
						}
						class={{ 'vcm-input-search__content': !props.styleless }}
						{
							...{
								type: 'search',
								...attrs,
								onFocus: (e) => {
									isFocus.value = true;
									emit('focus', e);
								},
								onBlur: (e) => {
									isFocus.value = false;
									emit('blur', e);
								}
							}
						}
					>
						{{
							prepend: () => slots.prepend?.() || (
								<MIcon class="vcm-input-search__icon" type={props.prepend || 'search'} />
							),
							append: slots.append && (() => slots.append?.()),
						}}
					</MInput>
					{
						isFocus.value && cancelText && (
							<div
								class="vcm-input-search__btn"
								onTouchend={handleCancel}
							>
								{cancelText}
							</div>
						)
					}
				</div>
			);
		};
	}
});
