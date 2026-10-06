/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import type { PropType } from 'vue';
import type { usePosition } from './use-position';
import { getStagePath } from './utils';

const COMPONENT_NAME = 'vc-tour-mask';

// 镂空随高亮动画逐帧更新，独立成组件：只有蒙层重新渲染，卡片与气泡不受影响
export const TourMask = defineComponent({
	name: COMPONENT_NAME,
	props: {
		position: {
			type: Object as PropType<ReturnType<typeof usePosition>>,
			required: true
		},
		options: {
			type: Object as PropType<Record<string, any>>,
			required: true
		},
		onShadeClick: Function as PropType<(event: MouseEvent) => void>
	},
	setup(props) {
		return () => {
			const { position, options } = props;
			const { width, height } = position.size.value;
			const rect = position.stage.value;
			const blocker = position.targetStage.value;
			return (
				<svg class="vc-tour__mask" width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
					{
						options.mask && (
							<path
								class="vc-tour__shade"
								d={getStagePath(width, height, rect, options.stageRadius)}
								fill-rule="evenodd"
								style={options.maskStyle}
								onClick={props.onShadeClick}
							/>
						)
					}
					{
						blocker && options.disableActiveInteraction && (
							<rect
								class="vc-tour__blocker"
								x={blocker.x}
								y={blocker.y}
								width={blocker.width}
								height={blocker.height}
								rx={options.stageRadius}
							/>
						)
					}
				</svg>
			);
		};
	}
});
