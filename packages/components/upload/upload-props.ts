import type {
	ExtractPropTypes,
	ExtractPublicPropTypes,
	PropType
} from 'vue';
import type {
	UploadCallback,
	UploadEnhancer,
	UploadRequestOptions
} from './types';

export const props = {
	// 外层标签
	tag: {
		type: [String, Object],
		default: 'span'
	},

	// 是否禁用
	disabled: {
		type: Boolean,
		default: false
	},

	// 选择文件时最多选择文件数量，> 1 就是多选上传
	max: {
		type: Number,
		default: 1
	},

	// 上传类型限制
	accept: String,

	// 文件大小
	size: {
		type: Number,
		default: 0
	},

	// 给后端的字段名
	name: {
		type: String,
		default: ''
	},

	// ajax url
	url: String,

	// ajax formData
	body: {
		type: Object as PropType<UploadRequestOptions['body']>,
		default: () => ({})
	},

	// ajax headers
	headers: {
		type: Object as PropType<UploadRequestOptions['headers']>,
		default: () => ({})
	},

	// 进度视口弹窗
	showTask: {
		type: Boolean,
		default: false
	},

	// 选取文件夹
	directory: {
		type: Boolean,
		default: false
	},

	// 增强器，如：原生选取
	enhancer: Function as PropType<UploadEnhancer>,

	// 并行上传
	parallel: {
		type: Boolean,
		default: true
	},

	showError: {
		type: Boolean,
		default: true
	},
	showLoading: {
		type: Boolean,
		default: false
	}
};
export type UploadResolvedProps = ExtractPropTypes<typeof props>;

export type UploadProps = ExtractPublicPropTypes<typeof props>;

export type UploadOpenOptions = Partial<UploadProps & UploadCallback> & {
	silent?: boolean;
};
