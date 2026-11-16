import type { ExtractPropTypes, PropType } from 'vue';
import type { CustomerValue } from '../../customer/types';

export type SwipeActionSide = 'left' | 'right';

// 露出按钮的一侧（'right' 为露出右侧按钮，即向左滑）；false 为收起
export type SwipeActionValue = SwipeActionSide | false;

export type SwipeActionItem = {
	content?: CustomerValue;
	// MIcon 的类型，显示在文字左侧
	icon?: string;
	type?: 'default' | 'primary' | 'success' | 'warning' | 'error';
	disabled?: boolean;
	// 只对最外侧的一项生效（rightActions 的最后一项、leftActions 的第一项）：拖过一半宽度松手直接执行
	fullSwipe?: boolean;
	class?: any;
	style?: any;
	// 返回真值保持展开；返回 Promise 时 resolve 后收起、reject 时保持展开；其余立即收起
	onClick?: (e: Event) => any;
};

export const props = {
	modelValue: {
		type: [String, Boolean] as PropType<SwipeActionValue>,
		default: false
	},
	leftActions: {
		type: Array as PropType<SwipeActionItem[]>,
		default: () => []
	},
	rightActions: {
		type: Array as PropType<SwipeActionItem[]>,
		default: () => []
	},
	disabled: {
		type: Boolean,
		default: false
	},
	closeOnClickOutside: {
		type: Boolean,
		default: true
	},
	// 拖动距离超过该侧按钮总宽的这个比例时松手展开；从展开往回拖同理收起
	threshold: {
		type: Number,
		default: 0.15
	},
	// 展开、归位的动画时长（ms）
	duration: {
		type: Number,
		default: 300
	}
};

export type Props = ExtractPropTypes<typeof props>;

// 除 modelValue 外的配置
export type SwipeActionOptions = Partial<Omit<Props, 'modelValue'>>;
