import type { ExtractPropTypes, PropType } from 'vue';
import { pick } from 'lodash-es';
import { props as dropdownProps } from '../dropdown-props';

const keys = ['modelValue', 'placement', 'caret', 'portalClass'] as const;

export const props = {
	...(pick(dropdownProps, keys) as Pick<typeof dropdownProps, typeof keys[number]>),
	// 触屏只有点按；custom 由调用方通过 v-model 控制
	trigger: {
		type: String,
		default: 'click',
		validator: (v: string) => /^(click|custom)$/.test(v)
	},
	portalStyle: [Object, String],
	tag: {
		type: String,
		default: 'span'
	},
	disabled: {
		type: Boolean,
		default: false
	},
	// 弹层挂到 body；为 false 时渲染在原位（弹层仍为 fixed 定位）
	portal: {
		type: Boolean,
		default: true
	},
	// 弹层的挂载容器：CSS 选择器或元素，优先于 portal
	to: [String, Object] as PropType<string | HTMLElement>
};
export type Props = ExtractPropTypes<typeof props>;
