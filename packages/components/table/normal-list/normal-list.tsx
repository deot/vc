/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { Item } from '../../recycle-list/item';

const COMPONENT_NAME = 'vc-table-normal-list';

export const NormalList = defineComponent({
	name: COMPONENT_NAME,
	props: {
		data: {
			type: Array,
			default: () => ([])
		}
	},
	emits: ['row-resize'],
	setup(props, { emit, slots }) {
		const handleResize = (size: any, index: number) => {
			emit('row-resize', {
				index,
				size
			});
		};
		return () => {
			return props.data!.map((row: any, index: number) => {
				return (
					<Item
						vertical={false}
						onChange={(e: any) => handleResize(e, index)}
					>
						{slots.default?.({ row, index })}
					</Item>
				);
			});
		};
	}
});
