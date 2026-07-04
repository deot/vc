/** @jsxImportSource vue */

import { defineComponent, Fragment } from 'vue';

const COMPONENT_NAME = 'vc-table-normal-list';

/**
 * 非虚拟化路径：直接渲染块内容。
 * grid 下行高由内容撑开、同一 grid 行内 cell 高度天然同步，无需测高回写。
 */
export const NormalList = defineComponent({
	name: COMPONENT_NAME,
	props: {
		data: {
			type: Array,
			default: () => ([])
		}
	},
	setup(props, { slots }) {
		return () => {
			return props.data!.map((block: any, index: number) => {
				return (
					<Fragment key={block.id}>
						{slots.default?.({ row: block, index })}
					</Fragment>
				);
			});
		};
	}
});
