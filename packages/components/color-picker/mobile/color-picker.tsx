/** @jsxImportSource vue */

import { computed, defineComponent, ref, watch } from 'vue';
import { omit, pick } from 'lodash-es';
import { MListItem } from '../../list/index.m';
import { useLocale } from '../../locale';
import { usePickerTrigger } from '../../picker/mobile/use-picker-portal';
import { Color } from '../color';
import { props as colorPickerProps, coreOmitKeys } from './color-picker-props';
import { props as coreProps } from './color-picker-core-props';
import { MColorPickerPortal } from './color-picker-core';

const COMPONENT_NAME = 'vcm-color-picker';

// 透传给弹层的属性
const coreKeys = Object.keys(omit(coreProps, coreOmitKeys));

const toValue = (value: unknown) => (typeof value === 'string' ? value : '');

export const MColorPicker = defineComponent({
	name: COMPONENT_NAME,
	props: colorPickerProps,
	emits: [
		'update:modelValue',
		'change',
		'clear',
		'color-change',
		'visible-change',
		'ok',
		'cancel',
		'close'
	],
	setup(props, context) {
		const { slots } = context;
		const { t } = useLocale();
		const currentValue = ref<string | null>(props.modelValue);
		const trigger = usePickerTrigger(context, {
			portal: MColorPickerPortal,
			accept: (value: string | null) => (currentValue.value = value),
			forward: ['clear', 'color-change']
		});

		watch(
			() => props.modelValue,
			(v) => {
				currentValue.value = v;
			}
		);

		// 色块的颜色：hsv 等 CSS 不支持的格式也能显示
		const css = computed(() => {
			const value = toValue(currentValue.value);
			return (value && Color.parse(value, { alpha: props.alpha })?.toCss()) || '';
		});

		const handleClick = () => {
			if (props.disabled) return;
			trigger.open({
				...pick(props, coreKeys),
				modelValue: toValue(currentValue.value)
			});
		};

		// 色块 + 文字；未选择时为占位文字
		const renderExtra = () => {
			const value = toValue(currentValue.value);
			if (!value) return props.extra ?? t('vc.ColorPicker.placeholder');

			return (
				<span class="vcm-color-picker__extra">
					<span class="vc-color-picker__swatch">
						<span style={css.value ? { backgroundColor: css.value } : undefined} />
					</span>
					<span class="vcm-color-picker__text">{ props.formatter(value) }</span>
				</span>
			);
		};

		return () => {
			return (
				<div class={['vcm-color-picker', { 'is-disabled': props.disabled }]} onClick={handleClick}>
					{
						slots.default
							? slots.default({
									value: currentValue.value,
									color: css.value
								})
							: (
									<MListItem
										label={props.label}
										labelWidth={props.labelWidth}
										arrow={props.disabled ? false : props.arrow}
										extra={renderExtra}
									/>
								)
					}
				</div>
			);
		};
	}
});
