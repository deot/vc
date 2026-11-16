/** @jsxImportSource vue */

import { defineComponent, inject, computed, getCurrentInstance } from 'vue';
import { MCustomer } from '../../customer/index.m';
import { hasCustomerValue } from '../../customer/utils';
import { MIcon } from '../../icon/index.m';
import { props as listItemProps } from './list-item-props';
import { VcInstance } from '../../vc';
import { toRem } from '@deot/vc-shared';
import { useSwipeAction } from '../../swipe-action/mobile/use-swipe-action';
import { toSwipeActionProps, type SwipeActionValue } from '../../swipe-action/mobile/swipe-action-props';

const COMPONENT_NAME = 'vcm-list-item';
const HTTP_REGEX = /[a-zA-z]+:\/\/[^\s]*/;

export const MListItem = defineComponent({
	name: COMPONENT_NAME,
	props: listItemProps,
	emits: ['click', 'update:swiped'],
	setup(props, context) {
		const { slots, emit } = context;
		const instance = getCurrentInstance()!;
		// 滑动操作：swiped + swipeActionOptions 转成 MSwipeAction 的 props，状态变化以 update:swiped 发出
		const swipe = useSwipeAction(
			toSwipeActionProps(() => props.swiped, () => props.swipeActionOptions),
			{ ...context, emit: (_: string, value: SwipeActionValue) => emit('update:swiped', value) }
		);
		const list = inject('vc-list', {} as any);

		const classes = computed(() => {
			const hasList = !!list.props;

			return {
				'is-alone': !hasList || props.alone,
				'is-multi': props.multiple,
				'is-line': !props.multiple
			};
		});

		const labelStyle = computed(() => {
			const labelWidth = props.labelWidth === 0 || props.labelWidth
				? props.labelWidth
				: list?.props?.labelWidth;

			// 固定宽度时不被 extra 压缩
			return labelWidth > 0
				? { width: toRem(labelWidth), flexShrink: 0 }
				: { width: 'auto' };
		});

		const arrow = computed(() => {
			return typeof props.arrow === 'string' ? props.arrow : 'right';
		});

		// 按下反馈：显示箭头、可跳转或监听了 click 时视为可点击；监听只能从 vnode.props 得知（context 不提供）
		const isClickable = () => {
			return !!(props.arrow || props.to || props.href || instance.vnode.props?.onClick);
		};

		const handleLinkTo = (e: Event) => {
			emit('click', e);

			/**
			 * 再考虑如何使用ctx.$router.push(props.to);
			 * 至于返回值目前是有值就终止
			 * undefined会继续走默认的
			 */
			const to = VcInstance.options.MListItem?.to;
			if (typeof to === 'function' && typeof to({ value: props.to, instance }) !== 'undefined') return;

			if (props.href) {
				window.location.href = props.href;
				return;
			}

			if (props.to) {
				/* istanbul ignore else -- @preserve */
				if (typeof props.to === 'function') {
					props.to();
				} else if (typeof props.to === 'string' && HTTP_REGEX.test(props.to)) {
					window.open(props.to);
				}
				return;
			}
		};
		return () => {
			const extra = slots.extra || props.extra;
			const description = slots.description || props.description;
			const indentStyle = props.indent != null ? { paddingLeft: toRem(props.indent) } : undefined;
			const wrapper = (
				<div
					class={['vcm-list-item__wrapper', classes.value, { 'is-description': hasCustomerValue(description) }]}
				>
					{
						(slots.icon || props.icon) && (
							<div class="vcm-list-item__icon">
								{slots.icon ? slots.icon() : <MIcon type={props.icon} />}
							</div>
						)
					}
					<div class="vcm-list-item__label" style={labelStyle.value}>
						<MCustomer wrap class="vcm-list-item__title" render={slots.label || props.label} />
						{
							hasCustomerValue(description) && (
								<MCustomer wrap class="vcm-list-item__description" render={description} />
							)
						}
					</div>
					<div class="vcm-list-item__content">
						{
							hasCustomerValue(extra)
								? (<MCustomer wrap class="vcm-list-item__extra" render={extra} />)
								: (<div class="vcm-list-item__extra" />)
						}
						{
							props.arrow && (
								<MIcon
									type={arrow.value}
									class="vcm-list-item__arrow"
								/>
							)
						}
					</div>
				</div>
			);

			// 有操作项时整行（含缩进、分隔线）在轨道里滑动；根节点仍是 .vcm-list-item，:last-child 等规则不受影响
			if (swipe.hasActions()) {
				return (
					<div
						ref={swipe.root}
						class={['vcm-list-item', 'vcm-swipe-action', { 'is-clickable': isClickable() }, swipe.getClasses()]}
						{...swipe.listeners}
						onClick={handleLinkTo}
					>
						{swipe.renderTrack(wrapper, indentStyle)}
					</div>
				);
			}

			return (
				<div
					class={['vcm-list-item', { 'is-clickable': isClickable() }]}
					style={indentStyle}
					onClick={handleLinkTo}
				>
					{wrapper}
				</div>
			);
		};
	}
});
