import type { ExtractPropTypes, PropType } from 'vue';
import type { Props as ScrollerProps } from '../scroller/scroller-props';
import type { SplitterPanelCollapsible } from './types';

export const props = {
	/**
	 * 数字为 px，字符串可带 %（相对容器扣除分隔条后的尺寸）；不传时与其它未设的面板按比例分剩余空间
	 * px 面板在容器变化时保持像素，% 与未设的面板随容器等比缩放
	 */
	size: [Number, String] as PropType<number | string>,
	/**
	 * 格式同 size
	 */
	min: [Number, String] as PropType<number | string>,
	max: [Number, String] as PropType<number | string>,
	/**
	 * 为 false 时，两侧的分隔条不可拖动
	 */
	resizable: {
		type: Boolean,
		default: true
	},
	/**
	 * 可折叠到 0（不受 min 限制）；对象指定折叠按钮出现在前一条（start）/ 后一条（end）分隔条上，true 为两侧
	 * 拖动越过 min 的一半时也会吸附折叠
	 */
	collapsible: {
		type: [Boolean, Object] as PropType<boolean | SplitterPanelCollapsible>,
		default: false
	},
	/**
	 * 内容由内置的 Scroller 滚动（自定义滚动条，拖动挤压时不占宽、不闪出原生滚动条）
	 * 为 false 时面板不滚动，内容可用 height: 100% 占满面板（嵌套 Splitter、图表、编辑器等），自行处理溢出
	 */
	scrollable: {
		type: Boolean,
		default: true
	},
	/**
	 * 内置 Scroller 的属性
	 */
	scrollerOptions: Object as PropType<Partial<ScrollerProps>>
};
export type Props = ExtractPropTypes<typeof props>;
