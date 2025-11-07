/** @jsxImportSource vue */

import { defineComponent, ref, nextTick } from 'vue';
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
		const resizeChanges = ref(new Map<number, { oldSize?: number; size: number }>());
		let pendingEmit = false;

		const emitChanges = () => {
			if (resizeChanges.value.size > 0) {
				const changes = Array.from(resizeChanges.value.entries()).map(([idx, { oldSize, size }]) => ({
					index: idx,
					oldSize,
					size
				}));
				emit('row-resize', changes);
				resizeChanges.value.clear();
			}
			pendingEmit = false;
		};

		const handleResize = (e: any, index: number) => {
			// 收集尺寸变化信息
			const current = resizeChanges.value.get(index);
			const prevSize = current?.size;
			resizeChanges.value.set(index, { oldSize: prevSize, size: e.height });

			// 使用 nextTick 批量触发事件,在同一个 tick 内的所有变化会被合并
			if (!pendingEmit) {
				pendingEmit = true;
				nextTick(emitChanges);
			}
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
