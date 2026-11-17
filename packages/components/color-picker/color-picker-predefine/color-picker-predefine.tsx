/** @jsxImportSource vue */

import { computed, defineComponent } from 'vue';
import type { PropType } from 'vue';
import { Color } from '../color';

const COMPONENT_NAME = 'vc-color-picker-predefine';

type Channels = Pick<Color['states'], 'hue' | 'saturation' | 'value' | 'opacity'>;

// 与 Color#compare 相同的容差
const isSame = (a: Channels, b: Channels) => {
	return Math.abs(a.hue - b.hue) < 2
		&& Math.abs(a.saturation - b.saturation) < 1
		&& Math.abs(a.value - b.value) < 1
		&& Math.abs(a.opacity - b.opacity) < 1;
};

export const Predefine = defineComponent({
	name: COMPONENT_NAME,
	props: {
		colors: {
			type: Array as PropType<string[]>,
			default: () => []
		},
		color: {
			type: Object as PropType<Color>,
			required: true
		}
	},
	setup(props) {
		// 只在 colors 变化时解析：拖动时每帧只做比较，不再重建实例；无法解析的跳过
		const items = computed(() => {
			return props.colors.flatMap((value) => {
				const color = Color.parse(value, { alpha: true });
				if (!color) return [];

				const { hue, saturation, value: brightness, opacity } = color.states;
				return [{
					value,
					css: color.toCss(),
					states: { hue, saturation, value: brightness, opacity } as Channels
				}];
			});
		});

		return () => {
			const current = props.color.states;
			// 输出不带透明度时按不透明比较
			const target = current.alpha ? current : { ...current, opacity: 100 };

			return (
				<div class="vc-color-picker-predefine">
					{
						items.value.map((item, index) => {
							const selected = isSame(item.states, target);

							return (
								<button
									key={`${item.value}-${index}`}
									type="button"
									class={[
										'vc-color-picker-predefine__block',
										{
											'is-selected': selected,
											'is-alpha': item.states.opacity < 100
										}
									]}
									aria-label={item.value}
									aria-pressed={selected}
									onClick={() => props.color.set(item.states)}
								>
									<span style={{ backgroundColor: item.css }} />
								</button>
							);
						})
					}
				</div>
			);
		};
	}
});
