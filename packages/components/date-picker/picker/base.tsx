/** @jsxImportSource vue */

import { defineComponent, h } from 'vue';
import { props as baseProps } from './base-props';

import { Input } from '../../input';
import { Popover } from '../../popover';
import { Icon } from '../../icon';
import { useBase } from './use-base';

export const createPicker = (name: string, pickerProps: object, usePicker: Function) => defineComponent({
	name,
	props: Object.assign(baseProps, pickerProps),
	inheritAttrs: false,
	emits: [
		'update:modelValue',
		'change',
		'clear',
		'error',
		'close',
		'input',
		'ready',
		'visible-change',
		'ok'
	],
	setup(props, { slots, emit }) {
		const {
			its,
			isHover,
			isActive,
			currentValue,
			focusedDate,
			showClear,
			classes,
			isConfirm,
			visibleValue,
			showTime,

			handleIconClick,
			handlePick,
			handleClear,
			handleOK,
			handleClose
		} = useBase();

		const { icon, panel, panelOptions } = usePicker();
		return () => {
			return (
				<Popover
					modelValue={isActive.value}
					{
						...its.value.attrs
					}
					arrow={props.arrow}
					trigger={props.trigger}
					tag={props.tag}
					placement={props.placement}
					autoWidth={true}
					disabled={props.disabled}
					portalClass={['is-padding-none', 'vc-date-picker--portal', props.portalClass]}
					class={[classes.value, its.value.class, 'vc-date-picker']}
					style={its.value.style}
					animation="y"
					// @ts-ignore
					onMouseenter={() => isHover.value = true}
					onMouseleave={() => isHover.value = false}
					onReady={() => emit('ready')}
					onClose={handleClose}
					onVisibleChange={() => emit('visible-change', isActive.value)}
					onUpdate:modelValue={v => isActive.value = v}
				>
					{{
						default: slots.default
							? slots.default
							: () => (
									<Input
										id={props.id}
										disabled={props.disabled}
										modelValue={visibleValue.value}
										allowDispatch={false}
										class="vc-date-picker__input"
										// @ts-ignore
										readonly={true}
										placeholder={props.placeholder || '请选择'}
									>
										{{
											append: () => {
												return (
													<div class={[{ 'is-clear': showClear }, 'vc-date-picker__append']}>
														<Icon
															type={showClear.value ? 'clear' : icon.value}
															// @ts-ignore
															onClick={handleIconClick}
														/>
													</div>
												);
											}
										}}
									</Input>
								),
						content: () => {
							return h(panel.value, {
								key: props.type,
								type: props.type,
								value: currentValue.value,
								confirm: isConfirm.value,
								startDate: props.startDate,
								focusedDate: focusedDate.value,
								splitPanels: props.splitPanels,
								showTime: showTime.value,
								format: props.format,
								steps: props.steps,
								multiple: props.multiple,
								...panelOptions.value,

								onPick: handlePick,
								onClear: handleClear,
								onOk: handleOK
							});
						}
					}}
				</Popover>
			);
		};
	}
});
