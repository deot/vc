/** @jsxImportSource vue */

import { defineComponent, inject, computed, getCurrentInstance } from 'vue';
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
			if (typeof to === 'function') {
				const vm = getCurrentInstance()!;
				if (typeof to(props.to, vm) !== 'undefined') return;
			}

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
			return (
				<div
					class="vcm-list-item"
					style={{ paddingLeft: `${props.indent}px` }}
					onClick={handleLinkTo}
				>
					<div
						class={['vcm-list-item__wrapper', classes.value]}
					>
						<div style={labelStyle.value}>
							{ slots.label?.() || props.label }
						</div>
						<div class="vcm-list-item__content">
							<div class="vcm-list-item__extra">
								{ slots.extra?.() || props.extra }
							</div>
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
