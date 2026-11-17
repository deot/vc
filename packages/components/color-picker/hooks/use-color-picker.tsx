/** @jsxImportSource vue */

import { computed, inject, ref, watch } from 'vue';
import type { SetupContext } from 'vue';
import { useAttrs } from '@deot/vc-hooks';
import type { Props } from '../color-picker-props';
import { Color } from '../color';
import { ColorPickerView } from '../color-picker-view';
import { Popover } from '../../popover';
import { Icon } from '../../icon';
import { Input } from '../../input';
import { Button } from '../../button';
import { useLocale } from '../../locale';

type Emits = ['update:modelValue', 'change', 'clear', 'color-change', 'visible-change', 'ready', 'close'];

// 打开浮层的按键
const OPEN_KEYS = ['Enter', ' ', 'ArrowDown'];

const toDraft = (value: unknown) => (typeof value === 'string' ? value : '');

/**
 * ColorPicker 的状态与渲染
 * @param props ~
 * @param context ~
 * @param context.emit ~
 * @param context.slots ~
 * @param options ~
 * @param options.mobile 移动端：根节点加标记类 vcm-color-picker
 * @returns render
 */
export const useColorPicker = (
	props: Props,
	{ emit, slots }: SetupContext<Emits>,
	options: { mobile?: boolean } = {}
) => {
	const { t } = useLocale();
	const its = useAttrs({ merge: false });
	const formItem = inject<any>('vc-form-item', {});
	const isActive = ref(false);
	const isHover = ref(false);
	// 浮层内的当前色值：confirm 时是未提交的草稿，否则与 v-model 一致
	const draft = ref(toDraft(props.modelValue));
	// 输入框正在键入的文本；null 时显示 draft
	const inputText = ref<string | null>(null);

	watch(
		() => props.modelValue,
		(v) => {
			draft.value = toDraft(v);
			inputText.value = null;
		}
	);

	// 触发器显示的颜色：打开时跟随草稿预览，开始收起即回到已提交值；hsv 等 CSS 不支持的格式也能显示
	const css = computed(() => {
		const value = isActive.value ? draft.value : toDraft(props.modelValue);
		return (value && Color.parse(value, { alpha: props.alpha })?.toCss()) || '';
	});
	const showClear = computed(() => props.clearable && !props.disabled && isHover.value && !!toDraft(props.modelValue));

	const classes = computed(() => [
		'vc-color-picker',
		`is-${props.size}`,
		{
			'vcm-color-picker': !!options.mobile,
			'is-disabled': props.disabled
		}
	]);

	// 只在值真正变化时提交
	const commit = (value: string | null) => {
		if (value === props.modelValue) return;

		emit('update:modelValue', value);
		emit('change', value);
		formItem?.change?.(value);
	};

	const handleChange = (value: string) => {
		draft.value = value;
		inputText.value = null;
		emit('color-change', value);
		!props.confirm && commit(value);
	};

	// 失焦或回车时解析输入：按当前输出格式归一化，无法解析时恢复
	const handleInputCommit = () => {
		const text = inputText.value;
		inputText.value = null;
		if (text === null) return;

		const color = Color.parse(text, { alpha: props.alpha, format: props.format });
		color && color.states.output !== draft.value && handleChange(color.states.output);
	};

	const handleOK = () => {
		commit(draft.value || new Color({ alpha: props.alpha, format: props.format }).states.output);
		isActive.value = false;
	};

	const handleClear = (e: MouseEvent) => {
		if (!showClear.value) return;

		// 不打开浮层
		e.stopPropagation();
		draft.value = '';
		isActive.value = false;
		commit(props.nullValue);
		emit('clear');
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (props.disabled) return;

		if (OPEN_KEYS.includes(e.key) && !isActive.value) {
			e.preventDefault();
			isActive.value = true;
		} else if (e.key === 'Escape' && isActive.value) {
			isActive.value = false;
		}
	};

	const handleVisibleChange = (value: boolean) => {
		isActive.value = value;
		emit('visible-change', value);
	};

	// 离场完成：未确认的修改作废
	const handleClose = () => {
		draft.value = toDraft(props.modelValue);
		inputText.value = null;
		emit('close');
	};

	const renderTrigger = () => {
		if (slots.default) return slots.default({ value: props.modelValue, color: css.value });

		return (
			<div
				class={['vc-color-picker__trigger', { 'is-focus': isActive.value, 'is-disabled': props.disabled }]}
				role="button"
				tabindex={props.disabled ? -1 : 0}
				aria-haspopup="dialog"
				aria-expanded={isActive.value}
				aria-disabled={props.disabled}
				onKeydown={handleKeydown}
				onMouseenter={() => (isHover.value = true)}
				onMouseleave={() => (isHover.value = false)}
			>
				<span class={['vc-color-picker__swatch', { 'is-empty': !css.value }]}>
					<span style={css.value ? { backgroundColor: css.value } : undefined} />
				</span>
				<span class={['vc-color-picker__suffix', { 'is-clear': showClear.value }]}>
					<Icon
						type={showClear.value ? 'clear' : (isActive.value ? 'up' : 'down')}
						// @ts-ignore
						onClick={handleClear}
					/>
				</span>
			</div>
		);
	};

	const renderContent = () => {
		return (
			<div class="vc-color-picker__picker">
				<ColorPickerView
					class="vc-color-picker__view"
					modelValue={draft.value}
					colors={props.colors}
					hue={props.hue}
					alpha={props.alpha}
					panel={props.panel}
					format={props.format}
					onChange={handleChange}
				/>
				<div class="vc-color-picker__footer">
					{
						props.editable
							? (
									<Input
										class="vc-color-picker__value"
										modelValue={inputText.value ?? draft.value}
										allowDispatch={false}
										onInput={(value: string) => (inputText.value = value)}
										onBlur={handleInputCommit}
										onEnter={handleInputCommit}
									/>
								)
							: <span class="vc-color-picker__value">{draft.value}</span>
					}
					{
						props.confirm && (
							<Button type="primary" size="small" onClick={handleOK}>
								{t('vc.ColorPicker.confirmText')}
							</Button>
						)
					}
				</div>
			</div>
		);
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
				class={[classes.value, its.value.class]}
				style={its.value.style}
				animation="y"
				onReady={() => emit('ready')}
				onClose={handleClose}
				// @ts-ignore
				onVisibleChange={handleVisibleChange}
				onUpdate:modelValue={(value: boolean) => (isActive.value = value)}
			>
				{{
					default: renderTrigger,
					content: renderContent
				}}
			</Popover>
		);
	};
};
