/** @jsxImportSource vue */

import { watch } from 'vue';
import type { SetupContext } from 'vue';
import { Color } from '../color';
import type { Props } from './color-picker-view-props';
import { COLORS } from './constants';
import { Panel } from '../color-picker-panel';
import { Predefine } from '../color-picker-predefine';
import { Slider } from '../../slider';

type Emits = ['change', 'update:modelValue'];

// 色相、透明度条的滑块：竖条，样式见 color-picker-view.scss
const SLIDER_SLOTS = {
	thumb: () => <span class="vc-color-picker-view__thumb" />
};

/**
 * ColorPickerView 的状态与渲染
 * @param props ~
 * @param context ~
 * @param context.emit ~
 * @returns render
 */
export const useColorPickerView = (props: Props, { emit }: SetupContext<Emits>) => {
	const color = new Color({
		alpha: props.alpha,
		format: props.format,
		value: props.modelValue
	});

	// 父组件改值或改输出选项带来的输出变化不回抛，只有用户操作才触发事件
	let external = color.states.output;

	watch(
		() => props.modelValue,
		(v) => {
			if (v === color.states.output) return;

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

			external = v;
			emit('update:modelValue', v, color);
			emit('change', v, color);
		}
	);

	const handleHue = (v: number) => color.set('hue', v);
	const handleOpacity = (v: number) => color.set('opacity', v);

	return () => {
		const colors = props.colors === true ? COLORS : props.colors || [];
		const { r, g, b } = color.toRgb();

		return (
			<div class="vc-color-picker-view">
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
				{colors.length > 0 && <Predefine colors={colors} color={color} />}
			</div>
		);
	};
};
