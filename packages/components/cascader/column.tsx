/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { Icon } from '../icon/index';
import { Spin } from '../spin/index';
import { Scroller } from '../scroller/index';

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

		// 指针在某项上移动（不用 mouseenter，见 useColumnNavigate 的 handleMove）：在列上统一监听，由 Cascader 判断是否需要处理
		const handleMove = (e: MouseEvent) => {
			const el = (e.target as Element).closest<HTMLElement>('.vc-cascader-column__item');
			if (!el) return;
			const rowIndex = +el.dataset.index!;
			emit('change', props.data[rowIndex], props.index, rowIndex);
		};

		return () => {
			return (
				<div class="vc-cascader-column" onMousemove={handleMove}>
					<Scroller class="vc-cascader-column__wrapper">
						{
							props.data.map((item: any, index: number) => {
								return (
									<div
										key={index}
										data-index={index}
										class={[{ 'is-select': props.value == item.value }, 'vc-cascader-column__item']}
										onClick={handleClick}
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
					</Scroller>
				</div>
			);
		};
	}
});
