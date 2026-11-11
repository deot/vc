import type { ExtractPropTypes, PropType } from 'vue';
import type { PickerEnhancer, PickerType } from './types';
import { FILE_ITEM_LAYOUTS, FILE_ITEM_SIZES } from '../file-preview/item';
import type { FileItemLayout, FileItemSize } from '../file-preview/item';

export const props = {
	picker: {
		type: Array as PropType<PickerType[]>,
		default: () => (['image'])
	},
	sortable: {
		type: Boolean,
		default: false
	},
	mask: {
		type: Boolean,
		default: false
	},
	/**
	 * vc-upload组件的属性
	 */
	uploadOptions: {
		type: Object,
		default() {
			return {};
		}
	},
	/**
	 * 数据源['xxx.jpg', ....]
	 */
	modelValue: {
		type: [String, Array, Object],
		// { value: '', label: '' }
		default: () => [],
	},
	// 数据字典
	keyValue: {
		type: Object as PropType<{ label: string; value: string }>,
		default: () => {
			return {
				label: 'label',
				value: 'value',
			};
		},
	},
	output: {
		type: [String, Function],
		default: 'object',
		validator: (v: string | Function) => typeof v === 'function' || ['string', 'object'].includes(v),
	},
	/**
	 * 可上传的最大值,跟upload内的Max不同，有可能是对象类型，对应的Upload做限制
	 */
	max: {
		type: [Number, Object],
		default: Number.MAX_SAFE_INTEGER
	},
	disabled: {
		type: Boolean,
		default: false
	},
	/**
	 * 布局：list 全部整行；grid 全部方格；group 图片、视频为方格在前，音频、文件为整行在后
	 * 不传时按 picker 自动选择：只有图片、视频为 grid，只有音频、文件为 list，两者都有为 group
	 */
	type: {
		type: String as PropType<FileItemLayout>,
		validator: (v: string) => FILE_ITEM_LAYOUTS.includes(v as FileItemLayout)
	},
	/**
	 * 尺寸：不传时方格为 small（64），整行为 medium（行高 46）
	 */
	size: {
		type: String as PropType<FileItemSize>,
		validator: (v: string) => FILE_ITEM_SIZES.includes(v as FileItemSize)
	},
	/**
	 * 上传成功后对数据的格式化
	 */
	formatter: Function as PropType<(response: any, file: any, type: PickerType) => any>,
	/**
	 * 默认上传入口（添加方格或上传按钮）的 className
	 */
	boxClass: String,
	showError: Boolean,
	enhancer: [Function, Boolean] as PropType<PickerEnhancer | boolean>
};
export type Props = ExtractPropTypes<typeof props>;

export const emits = [
	'update:modelValue',
	'file-success',
	'file-start',
	'file-before',
	'file-error',
	'error',
	'complete',
	'change',
	'remove-before'
] as const;
