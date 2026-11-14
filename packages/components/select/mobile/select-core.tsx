/** @jsxImportSource vue */

import { computed, defineComponent, ref, watch } from 'vue';
import { pick } from 'lodash-es';
import { Portal } from '../../portal';
import { MPickerPopup } from '../../picker/index.m';
import { getConfirmMode } from '../../picker/mobile/picker-popup-props';
import { pickerCoreEmits, usePickerCore } from '../../picker/mobile/use-picker-portal';
import { MButton } from '../../button/index.m';
import { useLocale } from '../../locale';
import { flattenData, getSelectLabels, isMultiple, toCurrentValue, toModelValue } from '../utils';
import { MSelectView } from './select-view';
import { props as selectViewProps } from './select-view-props';
import { props as coreProps } from './select-core-props';
import type { MSelectSelectPayload } from './select-view';

const COMPONENT_NAME = 'vcm-select-core';

// 透传给 MSelectView 的属性
const viewKeys = Object.keys(selectViewProps).filter(key => key !== 'modelValue' && key !== 'allowDispatch');

export const MSelectCore = defineComponent({
	name: COMPONENT_NAME,
	props: coreProps,
	emits: [...pickerCoreEmits, 'select', 'clear'],
	setup(props, context) {
		const { emit } = context;
		const { t } = useLocale();
		const core = usePickerCore(props, context);
		const view = ref<any>();
		// 弹层内的值：确定时提交，取消时丢弃
		const currentValue = ref<any>(props.modelValue);

		const multiple = computed(() => isMultiple(props.max));

		// 按钮的位置：多选总是需要确定，没有指定时在顶部
		const mode = computed(() => getConfirmMode(props.confirm || multiple.value));

		const isEmpty = computed(() => !toCurrentValue(currentValue.value, props).length);

		// 不可清空时，一项都没选不能确定
		const isOkDisabled = computed(() => !props.clearable && isEmpty.value);

		// 透传给 MSelectView：'bottom' 时「清空」在底部按钮，汇总栏不显示
		const viewProps = computed(() => ({ ...pick(props, viewKeys), clearable: props.clearable && mode.value !== 'bottom' }));

		watch(
			() => props.modelValue,
			(v) => {
				currentValue.value = v;
			}
		);

		const handleOk = () => {
			if (mode.value && isOkDisabled.value) return;
			const value = currentValue.value;
			const source = flattenData(props.data, { parent: true, cascader: true });
			const labels = getSelectLabels(toCurrentValue(value, props), source);

			core.ok(value, labels);
		};

		// 不需要确认时（单选），点一项即提交并关闭
		const handleSelect = (payload: MSelectSelectPayload) => {
			emit('select', payload);
			!mode.value && handleOk();
		};

		// 清空：不需要确认时直接提交空值并关闭；否则只清空弹层内的值，由「确定」提交
		// 视图先发 clear 再提交空值（同桌面端），这里直接取空值
		const handleClear = () => {
			currentValue.value = toModelValue([], { ...props, modelValue: currentValue.value });
			emit('clear');
			!mode.value && handleOk();
		};

		const handleChange = (v: any) => {
			currentValue.value = v;
		};

		const renderView = () => {
			return (
				<MSelectView
					ref={view}
					{...viewProps.value}
					modelValue={currentValue.value}
					allowDispatch={false}
					// @ts-ignore
					onUpdate:modelValue={handleChange}
					onSelect={handleSelect}
					onClear={handleClear}
				/>
			);
		};

		// 'bottom' 且可清空：「确定」前加「清空」，各占一半
		const renderClear = () => {
			return (
				<MButton
					class="vcm-picker-popup__button"
					size="large"
					round
					disabled={isEmpty.value}
					onClick={() => view.value?.clear()}
				>
					{ t('vc.Select.clearText') }
				</MButton>
			);
		};

		// 没有工具栏时，MPickerPopup 在标题栏显示标题与关闭按钮
		return () => {
			return (
				<MPickerPopup
					class={['vcm-select-popup', mode.value === 'bottom' && 'is-bottom']}
					{...core.getPopupProps()}
					title={props.title}
					cancelText={props.cancelText}
					okText={props.okText}
					okDisabled={isOkDisabled.value}
					confirm={mode.value}
					onOk={handleOk}
				>
					{{
						'default': renderView,
						'footer-extra': props.clearable ? renderClear : void 0
					}}
				</MPickerPopup>
			);
		};
	}
});

export const MSelectPortal = new Portal(MSelectCore, {
	promise: false
});
