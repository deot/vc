/** @jsxImportSource vue */

import { defineComponent, onBeforeMount, ref, watch } from 'vue';
import type { PropType } from 'vue';
import { Color } from './color';

const COMPONENT_NAME = 'vc-color-picker-predefine';

const formatColors = (colors: string[], color: Color) => {
	return colors.map((value) => {
		const item = new Color({
			enableAlpha: true,
			format: 'rgb',
			value
		});

		item.states.selected = item.compare(color);
		return item;
	});
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
		const rgbaColors = ref<Color[]>([]);

		const update = () => {
			rgbaColors.value = formatColors(props.colors, props.color);
		};

		const handleSelect = (index: number) => {
			props.color.setColor(props.colors[index]);
		};

		onBeforeMount(update);

		watch(
			() => props.colors,
			update
		);

		watch(
			() => props.color.states.output,
			update
		);

		return () => (
			<div class="vc-color-picker-predefine">
				{
					rgbaColors.value.map((item, index) => {
						return (
							<div
								key={`${item.states.output}-${index}`}
								class={[
									'vc-color-picker-predefine__block',
									{
										'is-selected': item.states.selected,
										'is-alpha': item.states.alpha < 100
									}
								]}
								onClick={() => handleSelect(index)}
							>
								<div style={{ backgroundColor: item.states.output }} />
							</div>
						);
					})
				}
			</div>
		);
	}
});
