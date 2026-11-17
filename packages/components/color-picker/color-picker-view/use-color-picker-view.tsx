/** @jsxImportSource vue */

import { ref, watch } from 'vue';
import type { SetupContext } from 'vue';
import { Color } from '../color';
import type { Props } from './color-picker-view-props';
import { COLORS } from './constants';
import { Panel } from '../color-picker-panel';
import { Predefine } from '../color-picker-predefine';
import { Slider as DesktopSlider } from '../../slider';
import type { MSlider } from '../../slider/mobile/slider';
import type { MInput } from '../../input/mobile/input';
import { useLocale } from '../../locale';
import { useColorInput } from '../hooks/use-color-input';

// 移动端多一个 clear（取值行的「清空」）
type Emits = ['change', 'update:modelValue'];
type MobileEmits = [...Emits, 'clear'];

// 移动端多出的属性（取值行）：可输入色值、可清空、清空后的值
interface MobileProps {
	editable?: boolean;
	clearable?: boolean;
	nullValue?: string | null;
}

interface Options {
	// 移动端：根节点加标记类 vcm-color-picker-view，顶部多一行取值（色块 + 色值 + 清空），滑块为圆形
	mobile?: boolean;
	// 色相、透明度条的滑块组件，移动端为 MSlider（桌面端入口不引入移动端代码）
	Slider?: typeof DesktopSlider | typeof MSlider;
	// 取值行的输入框，移动端为 MInput
	Input?: typeof MInput;
}

// 色相、透明度条的滑块：桌面端为竖条，移动端为圆形（填充色由根节点上的变量给出），样式见 color-picker-view.scss、mobile/style.scss
const SLIDER_SLOTS = {
	thumb: () => <span class="vc-color-picker-view__thumb" />
};

/**
 * ColorPickerView（移动端为 MColorPickerView）的状态与渲染
 * @param props ~
 * @param context ~
 * @param options ~
 * @returns render
 */
export const useColorPickerView = (
	props: Props & MobileProps,
	context: SetupContext<Emits> | SetupContext<MobileEmits>,
	options: Options = {}
) => {
	const { mobile, Slider = DesktopSlider, Input } = options;
	// clear 只在移动端发出
	const emit = context.emit as SetupContext<MobileEmits>['emit'];
	const { t } = useLocale();
	const color = new Color({
		alpha: props.alpha,
		format: props.format,
		value: props.modelValue
	});

	// 父组件改值或改输出选项带来的输出变化不回抛，只有用户操作才触发事件
	let external = color.states.output;

	// 移动端：未选择（或已清空）。色板保持上次的颜色，取值行显示为空
	const isEmpty = ref(!props.modelValue);

	const emitChange = (v: string) => {
		external = v;
		isEmpty.value = false;
		emit('update:modelValue', v, color);
		emit('change', v, color);
	};

	// 取值行的输入框：失焦或回车时按当前输出格式解析
	const input = useColorInput(props, {
		getValue: () => (isEmpty.value ? '' : color.states.output),
		commit: (value: string) => {
			color.setColor(value);
			// 清空后输入与色板相同的颜色，输出不变，也要提交
			isEmpty.value && color.states.output === external && emitChange(external);
		}
	});

	watch(
		() => props.modelValue,
		(v) => {
			input.reset();
			isEmpty.value = !v;
			// 移动端清空时色板保持上次的颜色，再选时从那里开始
			if (v === color.states.output || (mobile && !v)) return;

			color.setColor(v);
			external = color.states.output;
		}
	);

	watch(
		() => [props.alpha, props.format] as const,
		([alpha, format]) => {
			color.setOptions({ alpha, format });
			external = color.states.output;
		}
	);

	watch(
		() => color.states.output,
		(v) => {
			if (v === external) return;

			emitChange(v);
		}
	);

	/**
	 * 清空：先发出 clear，再提交 nullValue（同桌面端）
	 */
	const clear = () => {
		input.reset();
		isEmpty.value = true;
		emit('clear');
		emit('update:modelValue', props.nullValue as any);
		emit('change', props.nullValue as any);
	};

	mobile && context.expose({ clear });

	// 移动端：未选择时色板停在某个颜色（默认红色或清空前的颜色），点选与它相同的颜色输出不变，也要提交
	// 点按色板、色条、预设色都会触发 click；取值行（输入框、清空）不算
	// 用派发时的路径判断：真实点按时监听器之间会执行微任务，「清空」冒泡到这里时已重新渲染、从文档中移除，target.closest 找不到取值行
	const isInValueRow = (e: MouseEvent) => {
		return e.composedPath().some(el => (el as Element).classList?.contains('vcm-color-picker-view__value'));
	};

	const handleClick = (e: MouseEvent) => {
		if (!isEmpty.value || isInValueRow(e)) return;
		color.states.output === external && emitChange(external);
	};

	const handleHue = (v: number) => color.set('hue', v);
	const handleOpacity = (v: number) => color.set('opacity', v);

	// 移动端顶部的取值行：色块（未选择时为斜线）、色值（可输入）、清空
	const renderValue = () => {
		const css = isEmpty.value ? '' : color.toCss();

		return (
			<div class="vcm-color-picker-view__value">
				<span class={['vc-color-picker__swatch', { 'is-empty': !css }]}>
					<span style={css ? { backgroundColor: css } : undefined} />
				</span>
				{
					props.editable && Input
						? (
								<Input
									class="vcm-color-picker-view__input"
									modelValue={input.getText()}
									allowDispatch={false}
									// placeholder 由 MInput 透传给输入框
									{...{ placeholder: t('vc.ColorPicker.placeholder') }}
									onInput={input.handleInput}
									onBlur={input.handleCommit}
									onEnter={input.handleCommit}
								/>
							)
						: <span class="vcm-color-picker-view__text">{input.getText()}</span>
				}
				{
					props.clearable && !isEmpty.value && (
						<span class="vcm-color-picker-view__clear" onClick={clear}>
							{t('vc.ColorPicker.clearText')}
						</span>
					)
				}
			</div>
		);
	};

	return () => {
		const colors = props.colors === true ? COLORS : props.colors || [];
		const { r, g, b } = color.toRgb();

		return (
			<div
				class={['vc-color-picker-view', { 'vcm-color-picker-view': mobile }]}
				onClick={mobile ? handleClick : undefined}
				// 移动端光标与圆形滑块的填充：色板光标为当前颜色（不透明），色相条为纯色相，透明度条为当前颜色
				style={mobile
					? {
							'--vc-color-picker-solid-color': `rgb(${r}, ${g}, ${b})`,
							'--vc-color-picker-hue-color': `hsl(${color.states.hue}, 100%, 50%)`,
							'--vc-color-picker-current-color': color.toCss()
						}
					: undefined}
			>
				{mobile && renderValue()}
				{props.panel && <Panel color={color} />}
				{
					props.hue && (
						<Slider
							class="vc-color-picker-view__hue"
							modelValue={color.states.hue}
							max={360}
							tooltip="never"
							v-slots={SLIDER_SLOTS}
							onUpdate:modelValue={handleHue}
						/>
					)
				}
				{
					props.alpha && (
						<Slider
							class="vc-color-picker-view__alpha"
							style={{ '--vc-color-picker-alpha-color': `rgb(${r}, ${g}, ${b})` }}
							modelValue={Math.round(color.states.opacity)}
							tooltip="never"
							v-slots={SLIDER_SLOTS}
							onUpdate:modelValue={handleOpacity}
						/>
					)
				}
				{colors.length > 0 && <Predefine colors={colors} color={color} empty={mobile && isEmpty.value} />}
			</div>
		);
	};
};
