import type { ExtractPropTypes, PropType } from 'vue';
import type { PickerEnhancer } from '../upload-picker/types';

export const props = {
	modelValue: {
		type: String,
		default: ''
	},
	// new Quill('', options)
	// {
	// 		toolbar: ['bold', 'italic', 'underline', 'strike', 'color'],
	// 		modules: {
	// 			EventExtend: {},
	// 		}
	// 	}
	options: Object,
	disabled: {
		type: Boolean,
		default: false
	},
	// 注册扩展
	register: Function,
	// 插入视频时的封面地址；未提供或返回空值时不设置封面
	poster: Function as PropType<(data: { value: string; type: 'video' }) => string | undefined>,
	enhancer: {
		type: [Function, Boolean] as PropType<PickerEnhancer | boolean>,
		default: true
	},
	// 点击img元素是否可以进行预览，为false的时候会将光标聚焦到该元素后面
	previewable: {
		type: Boolean,
		default: true
	},
	// 工具栏位置：top 在编辑区上方；keyboard 聚焦时停在虚拟键盘上方（仅移动端，桌面端同 top）
	toolbarPlacement: {
		type: String as PropType<'top' | 'keyboard'>,
		default: 'top'
	}
};
export type Props = ExtractPropTypes<typeof props>;
