/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { TransitionFade } from '../../transition';
import { props as sortListProps } from '../sort-list-props';
import { useSortList } from '../use-sort-list';

const COMPONENT_NAME = 'vcm-sort-list';

export const MSortList = defineComponent({
	name: COMPONENT_NAME,
	props: sortListProps,
	emits: ['update:modelValue', 'change'],
	setup(props, { emit, expose, slots }) {
		const {
			currentValue,
			getDraggable,
			getSortList,
			handleDragStart,
			handleDragEnter,
			handleDragOver,
			handleDragEnd
		} = useSortList(props, emit);

		expose({
			getSortList
		});

		return () => {
			const Tag = props.tag as any;

			return (
				<TransitionFade tag="div" class="vcm-sort-list" group>
					{
						currentValue.value.map((row, index) => {
							const draggable = getDraggable(row);

							return (
								<Tag
									key={row && typeof row === 'object' ? row[props.primaryKey] : row}
									draggable={draggable}
									class="vcm-sort-list__item"
									onTouchmove={(e: TouchEvent) => e.preventDefault()}
									onDragstart={(e: DragEvent) => handleDragStart(e, row)}
									onDragenter={(e: DragEvent) => handleDragEnter(e, index, row)}
									onDragover={(e: DragEvent) => handleDragOver(e, row)}
									onDragend={handleDragEnd}
								>
									{ slots.default?.({ row, index }) }
								</Tag>
							);
						})
					}
				</TransitionFade>
			);
		};
	}
});
