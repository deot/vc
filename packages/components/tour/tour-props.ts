import type { ExtractPropTypes, PropType, StyleValue } from 'vue';
import type { TourButtonOptions, TourPlacement, TourEndType } from './types';

export const props = {
	placement: {
		type: String as PropType<TourPlacement>,
		default: 'bottom'
	},
	arrow: {
		type: Boolean,
		default: true
	},
	closable: {
		type: Boolean,
		default: true
	},
	width: {
		type: [Number, String],
		default: 300
	},
	footer: {
		type: Boolean,
		default: true
	},
	contentClass: [String, Object, Array],
	contentStyle: [String, Object, Array],
	mask: {
		type: Boolean,
		default: true
	},
	maskClosable: {
		type: Boolean,
		default: true
	},
	escClosable: {
		type: Boolean,
		default: true
	},
	maskStyle: [String, Object, Array],
	stagePadding: {
		type: [Number, Array] as PropType<number | number[]>,
		default: 10
	},
	stageRadius: {
		type: Number,
		default: 5
	},
	disableActiveInteraction: {
		type: Boolean,
		default: false
	},
	showProgress: {
		type: Boolean,
		default: true
	},
	progressType: {
		type: String as PropType<'number' | 'dot'>,
		default: 'number'
	},
	progressFormatter: Function as PropType<(context: { current: number; total: number }) => any>,
	// 文案含 Boolean 类型，显式 default: undefined 避免未传时被转换为 false，才能回退到语言包
	previousText: {
		type: [String, Boolean],
		default: undefined
	},
	nextText: {
		type: [String, Boolean],
		default: undefined
	},
	finishText: {
		type: [String, Boolean],
		default: undefined
	},
	skipText: {
		type: [String, Boolean],
		default: undefined
	},
	previousButtonOptions: Object as PropType<TourButtonOptions>,
	nextButtonOptions: Object as PropType<TourButtonOptions>,
	finishButtonOptions: Object as PropType<TourButtonOptions>,
	skipButtonOptions: Object as PropType<TourButtonOptions>,
	animated: {
		type: Boolean,
		default: true
	},
	duration: {
		type: Number,
		default: 300
	},
	keyboard: {
		type: Boolean,
		default: true
	},
	scrollIntoViewOptions: {
		type: [Object, Boolean] as PropType<ScrollIntoViewOptions | false>,
		default: () => ({
			block: 'center',
			inline: 'nearest'
		})
	},
	advanceOnClick: {
		type: Boolean,
		default: false
	},
	waitForElement: {
		type: Number,
		default: 0
	},
	skipMissingElement: {
		type: Boolean,
		default: false
	},
	maskClickBehavior: {
		type: String as PropType<'close' | 'next' | 'none'>,
		default: 'close'
	},
	current: Number,
	// 步骤参数由本文件推导（见 tour-step-props），这里不能引用 TourStepOptions，否则类型循环
	steps: {
		type: Array as PropType<Record<string, any>[]>,
		default: () => []
	},
	getPopupContainer: Function as PropType<() => HTMLElement>,
	zIndex: Number,
	scrollable: {
		type: Boolean,
		default: false
	},
	wrapperClass: [String, Object, Array],
	wrapperStyle: [String, Object, Array] as PropType<StyleValue>,
	cache: {
		type: [String, Boolean],
		default: false
	},
	cacheTypes: Array as PropType<TourEndType[]>,
	onOpen: Function as PropType<(context: { cacheKey?: string; steps: Record<string, any>[] }) => any>,
	modelValue: {
		type: Boolean,
		default: false
	}
};
export type Props = ExtractPropTypes<typeof props>;

export const emits = ['update:modelValue', 'update:current', 'visible-change', 'ready', 'change', 'finish', 'skip', 'close', 'error'] as const;
