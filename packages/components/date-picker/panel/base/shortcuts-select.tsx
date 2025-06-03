/** @jsxImportSource vue */

import { defineComponent } from 'vue';

const COMPONENT_NAME = 'vc-shortcuts-select';

export const ShortcutsSelect = defineComponent({
	name: COMPONENT_NAME,
	props: {
		panelDate: Date,
		config: Array,
		value: Date
	},
	emits: [
		'pick'
	],
	setup(props, { emit }) {
		const handleSelect = ({ value, onClick }) => {
			if (typeof value != 'function' && !onClick) {
				throw Error('【vc-date-picker】:options[value]需要是一个方法');
			}
			if (value) {
				emit('pick', value());
			}
			onClick && onClick();
		};

		return () => {
			return (
				<div class="vc-date-shortcuts">
					<ul class="vc-date-shortcuts__ul">
						{
							props.config!.map((item: any, index: number) => {
								return (
									<li
										key={index}
										class="vc-date-shortcuts__li"
										onClick={() => handleSelect(item)}
									>
										{ item.text }
									</li>
								);
							})
						}
					</ul>
				</div>
			);
		};
	}
});
