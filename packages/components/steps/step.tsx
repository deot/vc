/** @jsxImportSource vue */

import { defineComponent, computed, inject, ref } from 'vue';
import type { Slots } from 'vue';
import { props as stepProps } from './step-props';
import type { Props as StepsProps, StepStatus } from './steps-props';
import { Customer } from '../customer';
import { Icon } from '../icon';

const COMPONENT_NAME = 'vc-step';

// 成功/失败时节点显示的图标
const STATUS_ICONS: Partial<Record<StepStatus, string>> = {
	success: 'correct',
	error: 'close'
};

export const Step = defineComponent({
	name: COMPONENT_NAME,
	props: stepProps,
	setup(props, { slots }) {
		const steps = inject('vc-steps', {
			props: {} as Partial<StepsProps>,
			slots: {} as Slots,
			currentValue: ref(1),
			hasTail: ref(false),
			change: (() => {}) as (index: number) => void
		});

		const status = computed(() => props.status || 'default');

		const isActive = computed(() => props.index === steps.currentValue.value);

		const isClickable = computed(() => {
			return !!steps.props.clickable && !props.disabled && !isActive.value;
		});

		/**
		 * 插槽优先，其次字符串（innerHTML）或函数（Customer）
		 * @param key ~
		 * @returns ~
		 */
		const renderContent = (key: 'title' | 'description') => {
			const value = props[key];
			if (slots[key]) return slots[key]!();
			return typeof value === 'function'
				? (<Customer render={value} />)
				: (<span innerHTML={value} />);
		};

		/**
		 * 默认节点：dot为圆点，其余为序号，成功/失败时为图标
		 * @returns ~
		 */
		const renderIcon = () => {
			if (steps.props.type === 'dot') {
				return (<div class="vc-step__icon" />);
			}

			const type = STATUS_ICONS[status.value];
			return (
				<div class="vc-step__icon">
					{ type ? (<Icon type={type} />) : props.index }
				</div>
			);
		};

		/**
		 * dot插槽优先于renderDot；arrow没有节点
		 * @returns ~
		 */
		const renderDot = () => {
			if (steps.props.type === 'arrow') return null;

			const render = steps.slots.dot || steps.props.renderDot;
			const dot = renderIcon();
			const options = {
				index: props.index,
				status: status.value,
				title: props.title,
				description: props.description,
				dot
			};
			return (
				<div class="vc-step__dot">
					{ render ? render(options) : dot }
				</div>
			);
		};

		const renderDescription = () => {
			if (!slots.description && !props.description) return null;
			return (
				<div class="vc-step__description">
					{ renderContent('description') }
				</div>
			);
		};

		const handleClick = () => {
			isClickable.value && steps.change(props.index);
		};

		return () => {
			return (
				<div
					class={[
						'vc-step',
						`is-${status.value}`,
						{
							'is-active': isActive.value,
							'is-disabled': props.disabled,
							'is-clickable': isClickable.value
						}
					]}
					role="listitem"
					onClick={handleClick}
				>
					{ steps.hasTail.value && (<div class="vc-step__tail" />) }
					{ renderDot() }
					<div class="vc-step__content">
						<div class="vc-step__title">
							{ renderContent('title') }
						</div>
						{ renderDescription() }
					</div>
				</div>
			);
		};
	}
});
