/** @jsxImportSource vue */

import { defineComponent, inject, computed, getCurrentInstance } from 'vue';
import { MCustomer } from '../../customer/index.m';
import { hasCustomerValue } from '../../customer/utils';
import { MIcon } from '../../icon/index.m';
import { props as listItemProps } from './list-item-props';
import { VcInstance } from '../../vc';
import { toRem } from '@deot/vc-shared';

const COMPONENT_NAME = 'vcm-list-item';
const HTTP_REGEX = /[a-zA-z]+:\/\/[^\s]*/;

export const MListItem = defineComponent({
	name: COMPONENT_NAME,
	props: listItemProps,
	emits: ['click'],
	setup(props, { slots, emit }) {
		const instance = getCurrentInstance()!;
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
			return (
				<div
					class={['vcm-list-item', { 'is-clickable': isClickable() }]}
					style={props.indent != null ? { paddingLeft: toRem(props.indent) } : undefined}
					onClick={handleLinkTo}
				>
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
				</div>
			);
		};
	}
});
