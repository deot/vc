import type { ExtractPropTypes } from 'vue';

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
	uploadOptions: {
		type: Object,
		default: () => ({
			file: {},
			image: {},
			video: {}
		})
	},
	// 注册扩展
	register: Function,
	poster: Function,
	enhancer: {
		type: [Function, Boolean],
		default: true
	},
	// 点击img元素是否可以进行预览，为false的时候会将光标聚焦到该元素后面
	previewable: {
		type: Boolean,
		default: true
	}
};
export type Props = ExtractPropTypes<typeof props>;
