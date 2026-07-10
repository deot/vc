/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as sortListProps } from './sort-list-props';
import { TransitionFade } from '../transition';
import { useSortList } from './use-sort-list';

const COMPONENT_NAME = 'vc-sort-list';

export const SortList = defineComponent({
	name: COMPONENT_NAME,
	props: sortListProps,
	emits: ['update:modelValue', 'change'],
	setup(props, { emit, expose, slots }) {
		const {
			currentValue,
			dragging,
			getDraggable,
			getSortList,
			handleClick,
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
				<TransitionFade tag="div" class="vc-sort-list" group>
					{
						currentValue.value.map((row, index) => {
							const draggable = getDraggable(row);

							return (
								<Tag
									key={row && typeof row === 'object' ? row[props.primaryKey] : row}
									draggable={draggable}
									class="vc-sort-list__item"
									onDragstart={(e: DragEvent) => handleDragStart(e, row)}
									onDragenter={(e: DragEvent) => handleDragEnter(e, index, row)}
									onDragover={(e: DragEvent) => handleDragOver(e, row)}
									onDragend={handleDragEnd}
								>
									{ slots.default?.({ row, index }) }
									{
										props.mask && !dragging.value && (
											<div class="vc-sort-list__mask">
												<span
													style={{ visibility: index !== 0 ? 'unset' : 'hidden' }}
													onClick={(e: MouseEvent) => handleClick(e, { row, index, type: 'left' })}
												>
													&#10094;
												</span>
												<span onClick={(e: MouseEvent) => handleClick(e, { row, index, type: 'delete' })}>
													&#10006;
												</span>
												<span
													style={{ visibility: index !== currentValue.value.length - 1 ? 'unset' : 'hidden' }}
													onClick={(e: MouseEvent) => handleClick(e, { row, index, type: 'right' })}
												>
													&#10095;
												</span>
											</div>
										)
									}
								</Tag>
							);
						})
					}
				</TransitionFade>
			);
		};
	}
});
