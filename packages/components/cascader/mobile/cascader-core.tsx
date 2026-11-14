/** @jsxImportSource vue */

import { computed, defineComponent, ref, watch } from 'vue';
import { pick } from 'lodash-es';
import { Portal } from '../../portal';
import { MPickerPopup } from '../../picker/index.m';
import { getConfirmMode } from '../../picker/mobile/picker-popup-props';
import { pickerCoreEmits, usePickerCore } from '../../picker/mobile/use-picker-portal';
import { getPathLabels, toCascaderValue } from '../utils';
import { MCascaderView } from './cascader-view';
import { props as cascaderViewProps } from './cascader-view-props';
import { props as coreProps } from './cascader-core-props';
import type { MCascaderSelectPayload } from './cascader-view';

const COMPONENT_NAME = 'vcm-cascader-core';

// 透传给 MCascaderView 的属性
const viewKeys = Object.keys(cascaderViewProps).filter(key => key !== 'modelValue' && key !== 'allowDispatch');

export const MCascaderCore = defineComponent({
	name: COMPONENT_NAME,
	props: coreProps,
	emits: [...pickerCoreEmits, 'select', 'clear'],
	setup(props, context) {
		const { emit } = context;
		const core = usePickerCore(props, context);
		const view = ref<any>();
		// 弹层内的值：确定时提交，取消时丢弃
		const currentValue = ref<any>(props.modelValue);

		// 按钮的位置：changeOnSelect 需要「确定」，没有指定时在顶部
		const mode = computed(() => getConfirmMode(props.confirm || props.changeOnSelect));

		// 只提交最后一级时，路径没到最后一级不能确定
		// clearable 时空路径也可以确定（提交空值）
		const isOkDisabled = computed(() => {
			if (!props.confirm || props.changeOnSelect || !view.value) return false;
			return !view.value.isComplete() && !(props.clearable && !view.value.getPath().length);
		});

		// 透传给 MCascaderView 的属性
		const viewProps = computed(() => pick(props, viewKeys));

		watch(
			() => props.modelValue,
			(v) => {
				currentValue.value = v;
			}
		);

		const handleOk = () => {
			if (isOkDisabled.value) return;
			const value = currentValue.value;
			const labels = getPathLabels(value, props);

			core.ok(value, labels);
		};

		// 选到最后一级：不需要确认时直接提交并关闭
		const handleSelect = (payload: MCascaderSelectPayload) => {
			emit('select', payload);
			payload.leaf && !props.confirm && handleOk();
		};

		// 清空：不需要确认时直接提交空值并关闭；否则只清空弹层内的值，由「确定」提交
		// 视图先发 clear 再提交空值（同桌面端），这里直接取空值
		const handleClear = () => {
			currentValue.value = toCascaderValue([], props);
			emit('clear');
			!props.confirm && handleOk();
		};

		const handleChange = (v: any) => {
			currentValue.value = v;
		};

		const renderView = () => {
			return (
				<MCascaderView
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

		// 没有工具栏时，MPickerPopup 在标题栏显示标题与关闭按钮
		return () => {
			return (
				<MPickerPopup
					class="vcm-cascader-popup"
					{...core.getPopupProps()}
					title={props.title}
					cancelText={props.cancelText}
					okText={props.okText}
					okDisabled={isOkDisabled.value}
					confirm={mode.value}
					onOk={handleOk}
				>
					{ renderView() }
				</MPickerPopup>
			);
		};
	}
});

export const MCascaderPortal = new Portal(MCascaderCore, {
	promise: false
});
