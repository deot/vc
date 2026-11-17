/** @jsxImportSource vue */

import { computed, defineComponent, nextTick, ref, watch } from 'vue';
import { pick } from 'lodash-es';
import { Portal } from '../../portal';
import { MPickerPopup } from '../../picker/index.m';
import { getConfirmMode } from '../../picker/mobile/picker-popup-props';
import { pickerCoreEmits, usePickerCore } from '../../picker/mobile/use-picker-portal';
import { MButton } from '../../button/index.m';
import { useLocale } from '../../locale';
import { Color } from '../color';
import { MColorPickerView } from './color-picker-view';
import { props as viewProps } from './color-picker-view-props';
import { props as coreProps } from './color-picker-core-props';

const COMPONENT_NAME = 'vcm-color-picker-core';

// 透传给 MColorPickerView 的属性
const viewKeys = Object.keys(viewProps).filter(key => key !== 'modelValue');

const toValue = (value: unknown) => (typeof value === 'string' ? value : '');

export const MColorPickerCore = defineComponent({
	name: COMPONENT_NAME,
	props: coreProps,
	emits: [...pickerCoreEmits, 'clear', 'color-change'],
	setup(props, context) {
		const { emit } = context;
		const { t } = useLocale();
		const core = usePickerCore(props, context);
		const view = ref<any>();
		// 弹层内的值：需要确认时是草稿，确定时提交、取消时丢弃
		const currentValue = ref(toValue(props.modelValue));

		const mode = computed(() => getConfirmMode(props.confirm));

		// 透传给 MColorPickerView：'bottom' 时「清空」在底部按钮，取值行不显示
		const viewBinds = computed(() => ({ ...pick(props, viewKeys), clearable: props.clearable && mode.value !== 'bottom' }));

		watch(
			() => props.modelValue,
			(v) => {
				currentValue.value = toValue(v);
			}
		);

		// 弹层内清空过：此时「确定」提交 nullValue
		const isCleared = ref(false);

		// 不需要确认时点了预设色：这次变化提交并关闭
		let isPresetPicked = false;

		// 不需要确认时：拖动色板、色条或输入色值即提交，弹层保持打开；点预设色提交并关闭
		// 清空时视图先发出 clear、再发出 nullValue：不需要确认时提交空值，弹层保持打开（可以接着选）；否则只清空弹层内的值，由「确定」提交
		const handleChange = (v: string | null) => {
			if (!v || v === props.nullValue) {
				currentValue.value = '';
				isCleared.value = true;
				!mode.value && core.commit(props.nullValue);
				return;
			}

			currentValue.value = v;
			isCleared.value = false;
			emit('color-change', v);
			if (mode.value) return;

			if (isPresetPicked) {
				isPresetPicked = false;
				core.ok(v);
			} else {
				core.commit(v);
			}
		};

		// 捕获阶段先于预设色按钮与视图自身的点击：标记这次是点预设色
		// 点的就是当前颜色时视图不发出变化：等这次点击触发的刷新结束后变化还没来，直接关闭
		// 此时还没有排队的刷新，一次 nextTick 会先于它执行，所以等两次
		const handleClickCapture = (e: MouseEvent) => {
			if (mode.value || !(e.target as Element).closest?.('.vc-color-picker-predefine__block')) return;

			isPresetPicked = true;
			nextTick(() => nextTick(() => {
				if (!isPresetPicked) return;
				isPresetPicked = false;
				core.ok(currentValue.value);
			}));
		};

		// 没有选色就确定时提交默认色（同桌面端）；清空过则提交 nullValue
		const handleOk = () => {
			const value = currentValue.value
				|| (isCleared.value ? props.nullValue : new Color({ alpha: props.alpha, format: props.format }).states.output);
			core.ok(value);
		};

		const handleClear = () => emit('clear');

		const renderView = () => {
			return (
				<MColorPickerView
					ref={view}
					{...viewBinds.value}
					modelValue={currentValue.value}
					onChange={handleChange}
					onClear={handleClear}
					// @ts-ignore
					onClickCapture={handleClickCapture}
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
					disabled={!currentValue.value}
					onClick={() => view.value?.clear()}
				>
					{ t('vc.ColorPicker.clearText') }
				</MButton>
			);
		};

		return () => {
			return (
				<MPickerPopup
					class={['vcm-color-picker-popup', mode.value === 'bottom' && 'is-bottom']}
					{...core.getPopupProps()}
					title={props.title}
					cancelText={props.cancelText}
					okText={props.okText}
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

export const MColorPickerPortal = new Portal(MColorPickerCore, {
	promise: false
});
