/** @jsxImportSource vue */

import { defineComponent, computed, inject, ref } from 'vue';
import type { Ref } from 'vue';
import { props as gridItemProps } from './grid-item-props';

const COMPONENT_NAME = 'vc-grid-item';

// 位置由Grid计算后写到style上，这里只负责对齐与插槽
export const GridItem = defineComponent({
	name: COMPONENT_NAME,
	props: gridItemProps,
	setup(props, { slots }) {
		const grid = inject<{ overflow: Ref<boolean> }>('vc-grid', { overflow: ref(false) });

		const classes = computed(() => {
			return [
				'vc-grid-item',
				{
					[`is-justify-${props.justify}`]: !!props.justify,
					[`is-align-${props.align}`]: !!props.align
				}
			];
		});

		return () => {
			return (
				<div class={classes.value}>
					{
						// 插槽读取时才依赖overflow
						slots.default?.({ get overflow() { return grid.overflow.value; } })
					}
				</div>
			);
		};
	}
});
