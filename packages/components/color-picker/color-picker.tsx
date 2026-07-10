/** @jsxImportSource vue */

import { computed, defineComponent, inject, ref, watch } from 'vue';
import { useAttrs } from '@deot/vc-hooks';
import { props as colorPickerProps } from './color-picker-props';
import { Color } from './color';
import { VcError } from '../vc/index';
import { Popover } from '../popover/index';
import { Icon } from '../icon/index';
import { Input } from '../input/index';
import { Button } from '../button/index';
import { ColorPickerView } from './picker-view';

const COMPONENT_NAME = 'vc-color-picker';

const getColorRgb = (color: Color, alpha: boolean) => {
	if (!(color instanceof Color)) {
		throw new VcError('color-picker', 'color should be instance of Color Class');
	}

	const { r, g, b } = color.toRgb();

	return alpha
		? `rgba(${r}, ${g}, ${b}, ${color.states.alpha / 100})`
		: `rgb(${r}, ${g}, ${b})`;
};

export const ColorPicker = defineComponent({
	name: COMPONENT_NAME,
	props: colorPickerProps,
	inheritAttrs: false,
	emits: [
		'update:modelValue',
		'change',
		'ready',
		'close',
		'visible-change',
		'color-change'
	],
	setup(props, { emit }) {
		const its = useAttrs({ merge: false });
		const formItem = inject<any>('vc-form-item', {});
		const isActive = ref(false);
		const customColor = ref('');
		const currentColor = ref('');
		const displayedColorStyle = ref('transparent');

		const classes = computed(() => {
			return {
				[`is-${props.size}`]: true,
				'is-disabled': props.disabled
			};
		});

		const icon = computed(() => {
			return isActive.value ? 'up' : 'down';
		});

		const getDefaultColorValue = () => {
			return new Color({
				enableAlpha: props.alpha,
				format: props.format
			}).states.output;
		};

		watch(
			() => props.modelValue,
			(v) => {
				currentColor.value = v || '';
				displayedColorStyle.value = v || 'transparent';
			},
			{ immediate: true }
		);

		watch(
			() => currentColor.value,
			(v) => {
				customColor.value = v || '';
			},
			{ immediate: true }
		);

		const sync = (value: string) => {
			emit('update:modelValue', value);
			emit('change', value);
			formItem?.change?.(value);
			isActive.value = false;
		};

		const handleColorChange = (value: string, color: Color) => {
			customColor.value = value;
			displayedColorStyle.value = getColorRgb(color, props.alpha);
			isActive.value && emit('color-change', value);
		};

		const handleResetColor = () => {
			currentColor.value = props.modelValue || '';
			displayedColorStyle.value = props.modelValue || 'transparent';
		};

		const handleConfirm = () => {
			currentColor.value = customColor.value;
		};

		const handleClearValue = () => {
			sync('');
		};

		const handleConfirmValue = () => {
			sync(customColor.value || currentColor.value || getDefaultColorValue());
		};

		const handleVisibleChange = (value: boolean) => {
			isActive.value = value;
			emit('visible-change', value);
		};

		return () => {
			return (
				<Popover
					{...its.value.attrs}
					modelValue={isActive.value}
					trigger={props.trigger}
					arrow={props.arrow}
					portalClass={['is-padding-none', 'vc-color-picker-wrapper', props.portalClass]}
					disabled={props.disabled}
					tag="div"
					class={['vc-color-picker', classes.value, its.value.class]}
					style={its.value.style}
					animation="y"
					onReady={() => emit('ready')}
					onClose={() => {
						handleResetColor();
						emit('close');
					}}
					// @ts-ignore
					onVisibleChange={handleVisibleChange}
					onUpdate:modelValue={(value: boolean) => (isActive.value = value)}
				>
					{{
						default: () => (
							<Input
								disabled={props.disabled}
								allowDispatch={false}
								class={[
									'vc-color-picker__box',
									{ 'is-focus': isActive.value }
								]}
							>
								{{
									content: () => (
										<div>
											<input value={props.modelValue} type="hidden" />
											<div class="vc-color-picker__input">
												<div class="vc-color-picker__color">
													{
														props.modelValue === ''
															? (
																	<div>
																		<Icon type="close" />
																	</div>
																)
															: (
																	<div style={{ backgroundColor: displayedColorStyle.value }} />
																)
													}
												</div>
											</div>
										</div>
									),
									append: () => (
										<div class="vc-color-picker__append">
											<Icon type={icon.value} />
										</div>
									)
								}}
							</Input>
						),
						content: () => (
							<div class="vc-color-picker__picker">
								<div class="vc-color-picker__wrapper">
									<ColorPickerView
										modelValue={currentColor.value}
										colors={props.colors}
										hue={props.hue}
										alpha={props.alpha}
										panel={props.panel}
										recommend={props.recommend}
										format={props.format}
										onChange={handleColorChange}
									/>
								</div>
								<div class="vc-color-picker__confirm">
									<span class="vc-color-picker__value">
										{
											props.editable
												? (
														<Input
															modelValue={customColor.value}
															allowDispatch={false}
															onInput={(value: string) => (customColor.value = value)}
															onBlur={handleConfirm}
															onEnter={handleConfirm}
														/>
													)
												: currentColor.value
										}
									</span>
									<Button
										size="small"
										class="vc-btn is-default"
										onClick={handleClearValue}
									>
										清空
									</Button>
									<Button
										type="primary"
										size="small"
										class="vc-btn"
										onClick={handleConfirmValue}
									>
										确定
									</Button>
								</div>
							</div>
						)
					}}
				</Popover>
			);
		};
	}
});
