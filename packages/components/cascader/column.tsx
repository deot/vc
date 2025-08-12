/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { Icon } from '../icon/index';
import { Spin } from '../spin/index';

const COMPONENT_NAME = 'vc-cascader-column';

export const CascaderColumn = defineComponent({
	name: COMPONENT_NAME,
	emits: ['click', 'change'],
	props: {
		data: {
			type: Array,
			default: () => []
		},
		itemStyle: {
			type: Object,
			default: () => {}
		},
		value: {
			type: [String, Number]
		},
		index: {
			type: Number
		}
	},
	setup(props, { emit }) {
		const handleClick = () => {
			emit('click');
		};

		const handleEnter = (value: string | number, rowIndex: number) => {
			emit('change', { value, rowIndex, columnIndex: props.index });
		};

		return () => {
			return (
				<div class="vc-cascader-column">
					<div class="vc-cascader-column__wrapper">
						{
							props.data.map((item: any, index: number) => {
								return (
									<div
										key={index}
										class={[{ 'is-select': props.value == item.value }, 'vc-cascader-column__item']}
										onClick={handleClick}
										onMouseenter={() => handleEnter(item.value, index)}
									>
										<span>{item.label}</span>
										{
											(item.hasChildren && !item.loading)
												? (<Icon type="right" class="vc-cascader-column__icon" />)
												: item.loading
													? (<Spin size={14} class="vc-cascader-column__loading" />)
													: null

										}
									</div>
								);
							})
						}
					</div>
				</div>
			);
		};
	}
});
