/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { Resizer } from '../../resizer';

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
		const handleResize = (e: any, index: any) => {
			emit('row-resize', {
				index,
				size: e.height
			});
		};
		return () => {
			return props.data!.map((mergeData: any, index: number) => {
				return (
					<Resizer
						key={mergeData.id}
						fill={false}
						// @ts-ignore
						onResize={(e: any) => handleResize(e, index)}
					>
						{slots.default?.({ row: mergeData, index })}
					</Resizer>
				);
			});
		};
	}
});
