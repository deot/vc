/** @jsxImportSource vue */

import { defineComponent, nextTick } from 'vue';
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
		let resizeChanges: any[] = [];

		const emitChanges = () => {
			if (resizeChanges.length > 0) {
				emit('row-resize', resizeChanges);
				resizeChanges = [];
			}
		};

		const handleResize = (e: any, index: number) => {
			resizeChanges.push({ index, size: e.height });
			nextTick(emitChanges);
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
