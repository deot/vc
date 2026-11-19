import type { ExtractPropTypes, PropType } from 'vue';

export const props = {
	type: {
		type: String as PropType<'line' | 'circle'>,
		validator(val: string) {
			return ['line', 'circle'].includes(val);
		},
		default: 'line'
	},
	// 转为数字后限制在 0–100；达到 100 时视为 success
	percent: {
		type: [Number, String],
		default: 0
	},
	status: {
		type: String as PropType<'default' | 'success' | 'error'>,
		validator(val: string) {
			return ['default', 'error', 'success'].includes(val);
		},
		default: 'default'
	},
	showText: {
		type: Boolean,
		default: true
	},
	// 线形：文字显示在进度条内（白字、靠进度末端），线宽默认加粗
	textInside: {
		type: Boolean,
		default: false
	},
	textStyle: {
		type: [String, Object]
	},
	textClass: {
		type: [String, Object]
	},
	animated: {
		type: Boolean,
		default: false
	},
	// 置灰：进度与文字改用 foreground-color-inactive，忽略 color，停止 animated
	disabled: {
		type: Boolean,
		default: false
	},
	// 线形为线高（数字：桌面端 px，移动端 750 稿）；圆形为 SVG 100 × 100 坐标系中的描边宽度
	// 不传时：线形 6（移动端 8），textInside 16（移动端 36），圆形 6
	strokeWidth: {
		type: Number
	},
	// 不传时使用主题色（--vc-progress-track-color）
	trackColor: {
		type: String
	},
	// 圆形画布宽高（数字：桌面端 px，移动端 750 稿）
	size: {
		type: [Number, String],
		default: 120
	},
	// 字符串统一颜色，或按 default / success / error 取值的对象；缺少的状态使用主题色
	color: {
		type: [Object, String] as PropType<string | Partial<Record<'default' | 'success' | 'error', string>>>
	}
};
export type Props = ExtractPropTypes<typeof props>;
