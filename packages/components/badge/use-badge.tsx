/** @jsxImportSource vue */

import { computed, ref, watch, Transition } from 'vue';
import type { SetupContext } from 'vue';
import { toPx, toRem } from '@deot/vc-shared';
import type { Props } from './badge-props';
import { Customer } from '../customer';
import { hasCustomerValue } from '../customer/utils';
import type { CustomerValue } from '../customer/types';

// 元素类名与进出场名称（两端相同）
const names = {
	custom: 'vc-badge__custom',
	dot: 'vc-badge__dot',
	value: 'vc-badge__value',
	content: 'vc-badge__content',
	status: 'vc-badge__status',
	statusDot: 'vc-badge__status-dot',
	label: 'vc-badge__label',
	zoom: 'vc-badge__zoom'
};

/**
 * Badge 与 MBadge 共用的状态与渲染
 * @param props ~
 * @param context ~
 * @param options ~
 * @param options.mobile 移动端（MBadge）：根节点加标记类 vcm-badge，尺寸由 mobile/style.scss 覆盖局部变量；offset 为 750 稿长度，随 --vc-rem 缩放
 * @returns render 函数
 */
export const useBadge = (
	props: Props,
	context: SetupContext,
	options: { mobile?: boolean } = {}
) => {
	const { slots } = context;
	const name = options.mobile ? 'vc-badge vcm-badge' : 'vc-badge';
	const toLength = options.mobile ? toRem : toPx;

	// 徽标上显示的文字，空字符串表示不显示
	const content = computed(() => {
		const { value, max } = props;
		if (typeof value !== 'number') return value ?? '';
		if (!(value > 0)) return '';
		return max > 0 && value > max ? `${max}+` : `${value}`;
	});

	// 数字变化时（前后都可见）内层文字重新挂载并播放缩放动画；从无到有只走外层的进场
	const isChanged = ref(false);
	watch(content, (v, old) => {
		isChanged.value = !!v && !!old;
	});

	const colorStyle = computed(() => {
		return props.color ? { backgroundColor: props.color } : undefined;
	});

	const offsetStyle = computed(() => {
		const { offset } = props;
		if (!offset) return;
		const [x = 0, y = 0] = Array.isArray(offset) ? offset : [offset, offset];
		return { marginRight: toLength(-x), marginTop: toLength(y) };
	});

	/**
	 * label的内容（插槽优先），没有时为undefined
	 * @returns ~
	 */
	const getLabel = () => {
		return slots.label || (hasCustomerValue(props.label) ? props.label : undefined);
	};

	/**
	 * 角标：#dot插槽优先，其次dot，最后value；dot在value为小于等于0的数字时隐藏
	 * @returns ~
	 */
	const renderIndicator = () => {
		const { value, dot, dotClass, dotStyle } = props;
		if (slots.dot) {
			return (
				<span key="custom" class={[names.custom, dotClass]} style={[offsetStyle.value, dotStyle]}>
					{ slots.dot() }
				</span>
			);
		}
		if (dot) {
			if (typeof value === 'number' && !(value > 0)) return null;
			return (
				<span key="dot" class={[names.dot, dotClass]} style={[colorStyle.value, offsetStyle.value, dotStyle]} />
			);
		}
		if (!content.value) return null;
		return (
			<span key="value" class={[names.value, dotClass]} style={[colorStyle.value, offsetStyle.value, dotStyle]}>
				<span key={content.value} class={[names.content, { 'is-changed': isChanged.value }]}>
					{ content.value }
				</span>
			</span>
		);
	};

	const renderStatus = (label?: CustomerValue) => {
		const { status, dotClass, dotStyle } = props;
		return (
			<span class={names.status}>
				<span
					class={[names.statusDot, `is-${status || 'default'}`, dotClass]}
					style={[colorStyle.value, dotStyle]}
				/>
				{ label !== undefined && (<Customer wrap tag="span" class={names.label} render={label} />) }
			</span>
		);
	};

	return () => {
		const label = getLabel();
		return (
			<span class={[name, { 'is-standalone': !slots.default }]}>
				{ slots.default?.() }
				{
					props.status || label !== undefined
						? renderStatus(label)
						: (<Transition name={names.zoom} appear>{ renderIndicator() }</Transition>)
				}
			</span>
		);
	};
};
