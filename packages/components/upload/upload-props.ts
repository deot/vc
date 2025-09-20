import type { ExtractPropTypes } from 'vue';

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
		type: Object,
		default: () => ({})
	},

	// ajax headers
	headers: {
		type: Object,
		default: () => ({})
	},

	// 上传类型为文件
	mode: {
		type: String,
		default: '' // file | image | video | ...
	},

	// 进度视口弹窗
	showTaskManager: {
		type: Boolean,
		default: false
	},

	// 选取文件夹
	directory: {
		type: Boolean,
		default: false
	},

	// 增强器，如：原生选取
	enhancer: Function,

	// 并行上传
	parallel: {
		type: Boolean,
		default: true
	},

	showMessage: {
		type: Boolean,
		default: true
	},

	showToast: {
		type: Boolean,
		default: false
	},
	showLoading: {
		type: Boolean,
		default: false
	},
};
export type Props = ExtractPropTypes<typeof props>;
