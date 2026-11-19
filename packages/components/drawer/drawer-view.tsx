/** @jsxImportSource vue */

import { defineComponent, computed, Fragment } from 'vue';
import { useScrollbar } from '@deot/vc-hooks';
import { toPx } from '@deot/vc-shared';
import { Button } from '../button';
import { Icon } from '../icon';
import { Customer } from '../customer';
import { hasCustomerValue } from '../customer/utils';
import { Scroller } from '../scroller';
import { TransitionFade, TransitionSlide } from '../transition';
import { props as drawerProps } from './drawer-view-props';
import { useDrawer } from './use-drawer';

const COMPONENT_NAME = 'vc-drawer';

export const DrawerView = defineComponent({
	name: COMPONENT_NAME,
	props: drawerProps,
	emits: ['close', 'update:modelValue', 'visible-change', 'portal-fulfilled'],
	setup(props, context) {
		const { slots } = context;
		const {
			isActive,
			okText,
			cancelText,
			hasFooter,
			handleOk,
			handleCancel,
			handleBefore,
			handleClose,
			handleRemove
		} = useDrawer(props, context);

		const classes = computed(() => {
			return {
				[`is-${props.placement}`]: true,
			};
		});
		const style = computed(() => {
			return props.placement === 'top' || props.placement === 'bottom'
				? { height: toPx(props.height) }
				: { width: toPx(props.width) };
		});

		useScrollbar(isActive);

		const renderContent = () => {
			return (
				<Fragment>
					<Customer render={props.content} />
					{ slots.default?.() }
				</Fragment>
			);
		};

		const renderHeader = () => {
			const hasTitle = !!slots.header || (props.title !== false && hasCustomerValue(props.title));
			if (!hasTitle && !props.closable) return;
			return (
				<div class="vc-drawer__header">
					<Customer class="vc-drawer__title" render={slots.header || props.title} />
					{
						props.closable && (
							<button
								type="button"
								aria-label="close"
								class="vc-drawer__close"
								onClick={e => handleClose(e, true)}
							>
								<Icon type="close" />
							</button>
						)
					}
				</div>
			);
		};

		const renderFooter = () => {
			if (!hasFooter.value) return;
			return (
				<div class="vc-drawer__footer">
					{ slots['footer-extra']?.() }
					{
						!slots.footer
							? (
									<Fragment>
										{
											cancelText.value && (
												<Button
													class="vc-drawer__cancel"
													disabled={props.cancelDisabled}
													onClick={e => handleBefore(e, handleCancel)}
												>
													{ cancelText.value }
												</Button>
											)
										}
										{
											okText.value && (
												<Button
													type="primary"
													disabled={props.okDisabled}
													onClick={e => handleBefore(e, handleOk)}
												>
													{ okText.value }
												</Button>
											)
										}
									</Fragment>
								)
							: slots.footer?.()
					}
				</div>
			);
		};

		return () => {
			return (
				<div class={[classes.value, 'vc-drawer']}>
					<TransitionFade delay={50}>
						<div
							v-show={props.mask && isActive.value}
							style={props.maskStyle}
							class="vc-drawer__mask"
							onClick={e => handleClose(e, props.maskClosable)}
						/>
					</TransitionFade>

					<TransitionSlide
						mode={props.placement}
						// @ts-ignore
						onAfterLeave={handleRemove}
					>
						<div
							v-show={isActive.value}
							class={[props.wrapperClass, 'vc-drawer__wrapper']}
							style={[style.value, props.wrapperStyle]}
						>
							<div class="vc-drawer__container">
								{ renderHeader() }
								<div class="vc-drawer__content-container">
									{
										props.scrollable
											? (
													<Scroller
														native={false}
														{...props.scrollerOptions}
														contentClass={[props.contentClass, 'vc-drawer__content']}
														contentStyle={props.contentStyle}
													>
														{renderContent()}
													</Scroller>
												)
											: (
													<div
														class={[props.contentClass, 'vc-drawer__content', 'is-unscrollable']}
														style={props.contentStyle}
													>
														{renderContent()}
													</div>
												)
									}
								</div>
								{ renderFooter() }
							</div>
						</div>
					</TransitionSlide>
				</div>
			);
		};
	}
});
