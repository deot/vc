/** @jsxImportSource vue */

import { defineComponent, computed, ref, watch, Transition } from 'vue';
import { props as badgeProps } from './badge-props';
import { Customer } from '../customer';
import { hasCustomerValue } from '../customer/utils';
import type { CustomerValue } from '../customer/types';

const COMPONENT_NAME = 'vc-badge';

export const Badge = defineComponent({
	name: COMPONENT_NAME,
	props: badgeProps,
	setup(props, { slots }) {
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
			return { marginRight: `${-x}px`, marginTop: `${y}px` };
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
					<span key="custom" class={['vc-badge__custom', dotClass]} style={[offsetStyle.value, dotStyle]}>
						{ slots.dot() }
					</span>
				);
			}
			if (dot) {
				if (typeof value === 'number' && !(value > 0)) return null;
				return (
					<span key="dot" class={['vc-badge__dot', dotClass]} style={[colorStyle.value, offsetStyle.value, dotStyle]} />
				);
			}
			if (!content.value) return null;
			return (
				<span key="value" class={['vc-badge__value', dotClass]} style={[colorStyle.value, offsetStyle.value, dotStyle]}>
					<span key={content.value} class={['vc-badge__content', { 'is-changed': isChanged.value }]}>
						{ content.value }
					</span>
				</span>
			);
		};

		const renderStatus = (label?: CustomerValue) => {
			const { status, dotClass, dotStyle } = props;
			return (
				<span class="vc-badge__status">
					<span
						class={['vc-badge__status-dot', `is-${status || 'default'}`, dotClass]}
						style={[colorStyle.value, dotStyle]}
					/>
					{ label !== undefined && (<Customer wrap tag="span" class="vc-badge__label" render={label} />) }
				</span>
			);
		};

		return () => {
			const label = getLabel();
			return (
				<span class={['vc-badge', { 'is-standalone': !slots.default }]}>
					{ slots.default?.() }
					{
						props.status || label !== undefined
							? renderStatus(label)
							: (<Transition name="vc-badge__zoom" appear>{ renderIndicator() }</Transition>)
					}
				</span>
			);
		};
	}
});
