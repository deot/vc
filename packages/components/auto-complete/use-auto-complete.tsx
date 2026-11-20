/** @jsxImportSource vue */

import { nextTick } from 'vue';
import type { Component, SetupContext } from 'vue';
import { useAttrs } from '@deot/vc-hooks';
import { Popover } from '../popover/index';
import { Input } from '../input/index';
import { props as inputProps, indicatorProps, rightProps } from '../input/input-props';
import { emits as inputEmits } from '../input/use-input';
import type { TreeData } from '../select/utils';
import { useSuggest, useSuggestHost } from '../suggest';
import type { SuggestOptions } from '../suggest';
import type { Props, MobileProps } from './auto-complete-props';

export const emits = [...inputEmits, 'select', 'visible-change'] as const;

/**
 * AutoComplete 与 MAutoComplete 共用：输入框 + 联想弹层
 * 	- v-model 就是输入框的文字；选中联想项时整段替换为它的 value，焦点留在输入框、光标移到末尾
 * 	- 聚焦时打开（有联想项才显示），输入时搜索，失焦、Esc、选中后关闭
 * 	- Input 的属性、事件、方法原样交出，见 useSuggestHost
 * 	- 移动端：外观与尺寸为 750 稿，不默认高亮；按可视区翻转、限高由 Popover 处理
 * @param props ~
 * @param context ~
 * @param options ~
 * @param options.mobile 移动端（MAutoComplete）
 * @param options.components 移动端替换的组件（输入框、虚拟列表、加载图标）
 * @returns render
 */
export const useAutoComplete = (
	props: Props | MobileProps,
	context: SetupContext<typeof emits[number][]>,
	options: { mobile?: boolean; components?: SuggestOptions['components'] & { Input?: Component } } = {}
) => {
	const { emit, slots, expose } = context;
	const mobile = !!options.mobile;
	const it = useAttrs({ merge: false });
	const InputComponent = (options.components?.Input || Input) as any;

	const host = useSuggestHost({
		props,
		hostProps: mobile ? { ...inputProps, ...rightProps } : { ...inputProps, ...indicatorProps },
		hostEmits: inputEmits,
		handled: ['focus', 'blur'],
		emit,
		expose,
		getSuggest: () => suggest
	});

	const pickItem = (item: TreeData) => {
		const value = String(item.value ?? '');
		host.commit(value);
		emit('select', { value, item });
		suggest.close();
		nextTick(() => {
			const el = host.getElement<HTMLInputElement>('input');
			if (!el) return;
			el.focus();
			el.setSelectionRange(value.length, value.length);
		});
	};

	const suggest = useSuggest(() => props, slots, {
		keyword: () => host.value.value,
		pick: pickItem,
		onVisibleChange: v => emit('visible-change', v),
		mobile,
		components: options.components
	});

	const handleUpdate = (value: string, e?: Event) => {
		host.update(value, e);
		if (props.disabled) return;
		suggest.active.value = true;
		suggest.search();
	};

	const handleFocus = (...args: any[]) => {
		!props.disabled && suggest.open();
		emit('focus', ...args);
	};

	const handleBlur = (...args: any[]) => {
		suggest.blur();
		emit('blur', ...args);
	};

	const renderInput = () => {
		return (
			<InputComponent
				ref={host.host}
				{...it.value.attrs}
				{...it.value.listeners}
				{...host.binds.value}
				{...host.listeners}
				modelValue={host.value.value}
				// @ts-ignore
				onUpdate:modelValue={handleUpdate}
				onFocus={handleFocus}
				onBlur={handleBlur}
			>
				{{ prepend: slots.prepend, append: slots.append }}
			</InputComponent>
		);
	};

	return () => {
		return (
			<Popover
				{...suggest.popover.value}
				tag="div"
				autoWidth={props.autoWidth}
				disabled={props.disabled}
				class={[mobile ? 'vc-auto-complete vcm-auto-complete' : 'vc-auto-complete', it.value.class]}
				style={it.value.style}
			>
				{{ default: renderInput, content: suggest.renderContent }}
			</Popover>
		);
	};
};
