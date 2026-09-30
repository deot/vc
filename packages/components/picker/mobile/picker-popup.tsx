/** @jsxImportSource vue */

import { computed, defineComponent, ref, watch, withModifiers } from 'vue';
import { useAttrs } from '@deot/vc-hooks';
import { MPopup } from '../../popup/index.m';
import { useLocale } from '../../locale';
import { props as pickerPopupProps } from './picker-popup-props';

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
			isActive.value = false;
			emit(event);
		};

		const handleClose = () => {
			isActive.value = false;
			emit('close');
		};

		return () => {
			return (
				<div class={[its.value.class, 'vcm-picker-popup']} style={its.value.style}>
					<MPopup
						{...its.value.attrs}
						modelValue={isActive.value}
						fixed
						onClose={handleClose}
						onUpdate:modelValue={(v: boolean) => (isActive.value = v)}
					>
						{
							props.showToolbar && (
								<div class="vcm-picker-popup__header">
									{
										cancelText.value && (
											<div
												class="vcm-picker-popup__item is-left"
												onClick={withModifiers(() => handleAction('cancel'), ['stop'])}
											>
												{ cancelText.value }
											</div>
										)
									}
									<div class="vcm-picker-popup__item is-title" innerHTML={props.title} />
									{
										okText.value && (
											<div
												class="vcm-picker-popup__item is-right"
												onClick={withModifiers(() => handleAction('ok'), ['stop'])}
											>
												{ okText.value }
											</div>
										)
									}
								</div>
							)
						}
						{ slots.default?.() }
					</MPopup>
				</div>
			);
		};
	}
});
