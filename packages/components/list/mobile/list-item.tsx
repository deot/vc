/** @jsxImportSource vue */

import { defineComponent, inject, computed, getCurrentInstance } from 'vue';
import { MCustomer } from '../../customer/index.m';
import { hasCustomerValue } from '../../customer/utils';
import { Icon } from '../../icon';
import { props as listItemProps } from './list-item-props';
import { VcInstance } from '../../vc';

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
				'is-line': !props.multiple,
			};
		});

		const labelStyle = computed(() => {
			const labelWidth = props.labelWidth === 0 || props.labelWidth
				? props.labelWidth
				: list?.props?.labelWidth;

			return {
				width: labelWidth > 0 ? `${labelWidth}px` : 'auto'
			};
		});

		const icon = computed(() => {
			return typeof props.arrow === 'string' ? props.arrow : 'right';
		});

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
			return (
				<div
					class="vcm-list-item"
					style={{ paddingLeft: `${props.indent}px` }}
					onClick={handleLinkTo}
				>
					<div
						class={['vcm-list-item__wrapper', classes.value]}
					>
						<MCustomer wrap style={labelStyle.value} render={slots.label || props.label} />
						<div class="vcm-list-item__content">
							{
								hasCustomerValue(extra)
									? (<MCustomer wrap class="vcm-list-item__extra" render={extra} />)
									: (<div class="vcm-list-item__extra" />)
							}
							{
								props.arrow && (
									<Icon
										type={icon.value}
										class="vcm-list-item__icon"
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
