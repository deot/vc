import type { ExtractPropTypes, PropType } from 'vue';
import { pick } from 'lodash-es';
import { props as viewProps } from './popover-view-props';

export const viewKeys = [
	'modelValue',
	'animation',
	'placement',
	'theme',
	'content',
	'arrow',
	'portalClass',
	'portalStyle',
	'autoWidth',
	'always',
	'scrollable',
	'scrollerOptions'
] as const;

export const props = {
	trigger: {
		type: String,
		default: 'hover',
		validator: (v: string) => /(hover|strictHover|click|focus|custom)/.test(v)
	},
	tag: {
		type: String,
		default: 'span'
	},
	disabled: {
		type: Boolean,
		default: false
	},
	outsideClickable: {
		type: Boolean,
		default: true
	},
	// 浮层挂到 body；为 false 时渲染在根节点内（无 to 时）
	portal: {
		type: Boolean,
		default: true
	},
	// 浮层的挂载容器：CSS 选择器或元素，优先于 portal；应为包含触发器的定位容器
	to: [String, Object] as PropType<string | HTMLElement>,
	...(pick(viewProps, viewKeys) as Pick<typeof viewProps, typeof viewKeys[number]>)
};
export type Props = ExtractPropTypes<typeof props>;
