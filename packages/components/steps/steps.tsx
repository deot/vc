/** @jsxImportSource vue */

import { defineComponent, provide, h, cloneVNode, computed, ref, watch, Fragment } from 'vue';
import type { VNode } from 'vue';
import { props as stepsProps } from './steps-props';
import type { StepStatus } from './steps-props';
import { Step } from './step';

const COMPONENT_NAME = 'vc-steps';

/**
 * 展开v-for, <template>产生的Fragment, 只保留Step
 * @param vnodes ~
 * @param items ~
 * @returns ~
 */
const getItems = (vnodes: VNode[] = [], items: VNode[] = []) => {
	vnodes.forEach((vnode) => {
		if (vnode.type === Fragment && Array.isArray(vnode.children)) {
			getItems(vnode.children as VNode[], items);
		} else if (vnode.type === Step) {
			items.push(vnode);
		}
	});
	return items;
};

export const Steps = defineComponent({
	name: COMPONENT_NAME,
	props: stepsProps,
	emits: ['update:modelValue', 'change'],
	setup(props, { slots, emit }) {
		const currentValue = ref(props.modelValue);

		// arrow/navigation只支持横向
		const isVertical = computed(() => {
			return props.vertical && (props.type === 'default' || props.type === 'dot');
		});

		/**
		 * 标题与描述的实际位置；arrow没有节点，navigation固定在右侧且没有连线，两者都不参与
		 */
		const labelPosition = computed(() => {
			if (props.type === 'arrow' || props.type === 'navigation') return '';

			const isBefore = props.labelPosition === 'left' || props.labelPosition === 'top';
			if (isVertical.value) return isBefore ? 'left' : 'right';
			if (props.type === 'dot') return isBefore ? 'top' : 'bottom';
			return props.labelPosition;
		});

		// 连线：横向right/left时由标题/节点后的伪元素绘制（见steps.scss），其余由Step中的tail绘制
		const hasTail = computed(() => {
			return !props.lineless && (
				isVertical.value
				|| labelPosition.value === 'bottom'
				|| labelPosition.value === 'top'
			);
		});

		const getStatus = (index: number): StepStatus => {
			if (index < currentValue.value) return 'success';
			if (index === currentValue.value) return props.status;
			return 'default';
		};

		// 是否可点击由Step判断（clickable、disabled、当前步）
		const change = (index: number) => {
			currentValue.value = index;
			emit('update:modelValue', index);
			emit('change', index);
		};

		watch(
			() => props.modelValue,
			(v) => {
				currentValue.value = v;
			}
		);

		provide('vc-steps', {
			props,
			slots,
			currentValue,
			hasTail,
			change
		});

		return () => {
			const items = getItems(slots.default?.());
			// Step单独设置的status优先
			const statuses = items.map((vnode, index) => vnode.props?.status || getStatus(index + 1));

			return h(
				props.tag,
				{
					class: [
						'vc-steps',
						`is-${isVertical.value ? 'vertical' : 'horizontal'}`,
						`is-${props.type}`,
						{
							[`is-label-${labelPosition.value}`]: !!labelPosition.value,
							'is-lineless': props.lineless,
							'is-clickable': props.clickable
						}
					],
					role: 'list'
				},
				items.map((vnode, index) => {
					return cloneVNode(vnode, {
						index: index + 1,
						status: statuses[index],
						class: {
							'is-next-error': statuses[index + 1] === 'error'
						}
					});
				})
			);
		};
	}
});
