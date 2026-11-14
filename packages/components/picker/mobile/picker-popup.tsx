/** @jsxImportSource vue */

import { computed, defineComponent, ref, watch, withModifiers } from 'vue';
import { useAttrs } from '@deot/vc-hooks';
import { MCustomer } from '../../customer/index.m';
import { MPopup } from '../../popup/index.m';
import { MButton } from '../../button/index.m';
import { useLocale } from '../../locale';
import { props as pickerPopupProps, getConfirmMode } from './picker-popup-props';

const COMPONENT_NAME = 'vcm-picker-popup';

export const PickerPopup = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: pickerPopupProps,
	emits: ['update:modelValue', 'update:visible', 'visible-change', 'close', 'cancel', 'ok'],
	setup(props, { emit, slots }) {
		const { t } = useLocale();
		const its = useAttrs({ merge: false });
		const isActive = ref(false);
		const cancelText = computed(() => props.cancelText ?? t('vc.Picker.cancelText'));
		const okText = computed(() => props.okText ?? t('vc.Picker.okText'));
		const mode = computed(() => getConfirmMode(props.confirm));

		const visible = computed(() => {
			return typeof props.visible === 'boolean' ? props.visible : props.modelValue;
		});

		watch(
			visible,
			(v) => {
				isActive.value = v;
			},
			{ immediate: true }
		);

		watch(
			() => isActive.value,
			(v) => {
				emit('visible-change', v);
				emit('update:modelValue', v);
				emit('update:visible', v);
			}
		);

		const handleAction = (event: 'cancel' | 'ok') => {
			if (event === 'cancel' ? props.cancelDisabled : props.okDisabled) return;
			isActive.value = false;
			emit(event);
		};

		const renderAction = (event: 'cancel' | 'ok') => {
			const text = event === 'cancel' ? cancelText.value : okText.value;
			const disabled = event === 'cancel' ? props.cancelDisabled : props.okDisabled;
			return text && (
				<div
					class={['vcm-picker-popup__item', event === 'cancel' ? 'is-left' : 'is-right', { 'is-disabled': disabled }]}
					onClick={withModifiers(() => handleAction(event), ['stop'])}
				>
					{ text }
				</div>
			);
		};

		const handleClose = () => {
			isActive.value = false;
			emit('close');
		};

		// 底部的「确定」：footer 插槽可整个替换；footer-extra 插槽在「确定」之前（如「清空」），按钮用 .vcm-picker-popup__button 平分宽度
		const renderFooter = () => {
			return (
				<div class="vcm-picker-popup__footer">
					{ slots['footer-extra']?.() }
					<MButton
						class="vcm-picker-popup__button"
						type="primary"
						size="large"
						round
						disabled={props.okDisabled}
						onClick={() => handleAction('ok')}
					>
						{ okText.value }
					</MButton>
				</div>
			);
		};

		return () => {
			return (
				<div class={[its.value.class, 'vcm-picker-popup']} style={its.value.style}>
					<MPopup
						// 内容（滚轮、级联、列表等）自己滚动：标题栏在 MPopup 上时也不再包一层 MScroller；需要时可经 attrs 覆盖
						scrollable={false}
						{...its.value.attrs}
						modelValue={isActive.value}
						fixed
						// 不在顶部时，标题与关闭按钮放在 MPopup 的标题栏；内容（滚轮、级联等）都铺满，不留内边距
						title={mode.value === 'top' ? void 0 : props.title}
						closable={mode.value !== 'top'}
						contentClass={['vcm-picker-popup__content', its.value.attrs?.contentClass]}
						onClose={handleClose}
						onUpdate:modelValue={(v: boolean) => (isActive.value = v)}
					>
						{{
							default: () => [
								mode.value === 'top' && (
									<div class="vcm-picker-popup__header">
										{ renderAction('cancel') }
										<MCustomer wrap class="vcm-picker-popup__item is-title" render={props.title} />
										{ renderAction('ok') }
									</div>
								),
								slots.default?.()
							],
							// 底部：'bottom' 时默认为「确定」按钮；footer 插槽优先，参数同 MPopup 的 footer 插槽
							footer: slots.footer || (mode.value === 'bottom' ? renderFooter : void 0)
						}}
					</MPopup>
				</div>
			);
		};
	}
});
