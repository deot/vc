/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import type { Render } from '../customer/types';
import { Scroller } from '../scroller/index';
import { Tree } from './tree';

const COMPONENT_NAME = 'vc-tree-select-content';

export const TreeSelectContent = defineComponent({
	name: COMPONENT_NAME,
	props: {
		value: {
			type: Array as () => Array<string | number>,
			required: true
		},
		data: {
			type: Array,
			default: () => []
		},
		checkStrictly: {
			type: Boolean,
			default: false
		},
		renderNodeLabel: Function as Render
	},
	emits: ['change'],
	setup(props, { emit }) {
		return () => {
			return (
				<Scroller class="vc-tree-select__options" max-height="200px">
					<Tree
						model-value={props.value}
						expanded-values={props.value}
						data={props.data}
						checkStrictly={props.checkStrictly}
						allowDispatch={false}
						showCheckbox={true}
						renderNodeLabel={props.renderNodeLabel}
						onChange={(_: any, data: any) => emit('change', _, data)}
					/>
				</Scroller>
			);
		};
	}
});
