/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { Scroller } from '../scroller';
import { props as splitterPanelProps } from './splitter-panel-props';

const COMPONENT_NAME = 'vc-splitter-panel';

// 尺寸由 Splitter 计算后写到 style 上；update:size 由 Splitter 在调整完成后经本组件实例发出
export const SplitterPanel = defineComponent({
	name: COMPONENT_NAME,
	props: splitterPanelProps,
	emits: ['update:size'],
	setup(props, { slots }) {
		// 只在 Scroller 的渲染里调用（$stable）：面板因样式变化重绘时，内容不跟着重新渲染
		const renderContent = () => slots.default?.();

		return () => {
			return (
				<div class={['vc-splitter-panel', { 'is-unscrollable': !props.scrollable }]}>
					{
						props.scrollable
							? (
									<Scroller native={false} {...props.scrollerOptions}>
										{{ default: renderContent, $stable: true }}
									</Scroller>
								)
							: renderContent()
					}
				</div>
			);
		};
	}
});
