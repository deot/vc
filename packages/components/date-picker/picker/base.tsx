/** @jsxImportSource vue */

import { defineComponent, h } from 'vue';
import { props as baseProps } from './base-props';

import { Input } from '../../input';
import { Popover } from '../../popover';
import { Icon } from '../../icon';
import { useLocale } from '../../locale';
import { useBase } from './use-base';

export const createPicker = (name: string, pickerProps: object, usePicker: Function) => defineComponent({
	name,
	props: Object.assign({}, baseProps, pickerProps),
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
		const { t } = useLocale();
		const { icon, panel, panelOptions, scrollable = true, isDisabled } = usePicker();
		const {
			its,
			isHover,
			isActive,
			isEditable,
			currentValue,
			focusedDate,
			showClear,
			classes,
			isConfirm,
			showTime,
			inputValue,
			inputListeners,

			handleIconClick,
			handlePick,
			handleClear,
			handleOK,
			handleClose
		} = useBase({ isDisabled });

		const renderAppend = () => {
			return (
				<div class={[{ 'is-clear': showClear.value }, 'vc-date-picker__append']}>
					<Icon
						type={showClear.value ? 'clear' : icon.value}
						// @ts-ignore
						onClick={handleIconClick}
					/>
				</div>
			);
		};

		const renderInput = () => {
			return (
				<Input
					{...inputListeners}
					id={props.id}
					disabled={props.disabled}
					modelValue={inputValue.value}
					allowDispatch={false}
					class="vc-date-picker__input"
					// @ts-ignore
					readonly={!isEditable.value}
					placeholder={props.placeholder ?? t('vc.DatePicker.placeholder')}
				>
					{{ append: renderAppend }}
				</Input>
			);
		};

		const renderContent = () => {
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
		};

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
					portal={props.portal}
					portalClass={['is-padding-none', 'vc-date-picker--portal', props.portalClass]}
					// 面板能自行收缩并滚动时（时间面板）由 picker 声明为 false；带日历的面板放不下时整体滚动
					scrollable={scrollable}
					// 可输入时，点后缀图标、面板不让输入框失焦，打开后点击输入框只移动光标
					keepFocus={isEditable.value}
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
						default: slots.default || renderInput,
						content: renderContent
					}}
				</Popover>
			);
		};
	}
});
