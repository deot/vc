/** @jsxImportSource vue */

import { defineComponent, ref, withModifiers } from 'vue';
import type { PropType } from 'vue';
import { props as inputSearchProps } from '../input-search-props';

import { MIcon } from '../../icon/index.m';
import { MInput } from './input';
import { useNativeEmitter } from '../use-native-emitter';
import { useLocale } from '../../locale';

const COMPONENT_NAME = 'vcm-input-search';

export const M_INPUT_SEARCH_THEMES = ['fill', 'inverted'] as const;
export const M_INPUT_SEARCH_SHAPES = ['circle', 'square'] as const;

export const MInputSearch = defineComponent({
	name: COMPONENT_NAME,
	props: {
		...inputSearchProps,
		cancelText: {
			type: String,
			default: undefined
		},
		// 填充方案：fill 白底、输入框浅灰底；inverted 浅灰底、输入框白底
		theme: {
			type: String as PropType<typeof M_INPUT_SEARCH_THEMES[number]>,
			default: 'fill',
			validator: (v: string) => M_INPUT_SEARCH_THEMES.includes(v as any)
		},
		// 输入框的形状：circle 胶囊；square 方角
		shape: {
			type: String as PropType<typeof M_INPUT_SEARCH_SHAPES[number]>,
			default: 'circle',
			validator: (v: string) => M_INPUT_SEARCH_SHAPES.includes(v as any)
		}
	},
	inheritAttrs: false,
	setup(props, { emit, slots, expose, attrs }) {
		const { t } = useLocale();
		const input = ref<HTMLElement>();

		const isFocus = ref(false);
		const native = useNativeEmitter(input, expose);

		// 按下时触发（阻止默认行为，按钮在失焦隐藏前就能响应）；清空后让输入框失焦，收起键盘与取消按钮
		const handleCancel = () => {
			// 这里会触发attrs中的函数
			emit('update:modelValue', '');
			emit('input', '');
			emit('cancel');
			native.blur();
		};

		return () => {
			const { cancelText: customCancelText, theme, shape, ...inputOptions } = props;
			const cancelText = customCancelText ?? t('vc.MInputSearch.cancelText');
			return (
				<div class={['vcm-input-search', `is-${theme}`, `is-${shape}`]}>
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
								// 阻止默认行为后触屏上不再派发 mousedown；mousedown 供桌面浏览器使用
								onTouchstart={withModifiers(handleCancel, ['prevent'])}
								onMousedown={withModifiers(handleCancel, ['prevent'])}
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
