/** @jsxImportSource vue */

import { defineComponent, h } from 'vue';
import { props as watermarkProps } from './watermark-props';
import { WatermarkLayer } from './watermark-layer';

const COMPONENT_NAME = 'vc-watermark';

export const Watermark = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: watermarkProps,
	setup(props, { slots, attrs }) {
		// 水印层是独立的组件：它重绘、重建时不会重新执行插槽；
		// 插槽内容更新时传给它的参数引用不变，也不会经过它。
		// 有插槽时水印层留在外层里（不使用 to），由外层的样式定位；满屏时仍挂到 to。
		return () => {
			if (!slots.default) return h(WatermarkLayer, { ...props, ...attrs });

			return (
				<div class="vc-watermark">
					{slots.default()}
					{h(WatermarkLayer, { ...props, ...attrs, to: props.fullscreen ? props.to : undefined })}
				</div>
			);
		};
	}
});
