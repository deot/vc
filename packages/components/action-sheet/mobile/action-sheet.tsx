/** @jsxImportSource vue */

import { defineComponent, Fragment, onMounted, ref, withModifiers } from 'vue';
import { MCustomer } from '../../customer/index.m';
import { MPopup } from '../../popup/index.m';
import { MSpin } from '../../spin/index.m';
import { props as actionSheetProps } from './action-sheet-props';
import type { ActionSheetAction, ActionSheetActionValue, ActionSheetContent } from './action-sheet-props';

const COMPONENT_NAME = 'vcm-action-sheet';

const renderContent = (content: ActionSheetContent | undefined, className: string, loading = false) => {
	if (typeof content === 'string') {
		return <div class={className} innerHTML={content} />;
	}

	if (typeof content === 'function') {
		return (
			<MCustomer
				render={content}
				class={className}
				// @ts-ignore
				loading={loading}
			/>
		);
	}

	return null;
};

export const ActionSheet = defineComponent({
	name: COMPONENT_NAME,
	props: actionSheetProps,
	emits: ['portal-fulfilled'],
	setup(props, { emit }) {
		const isActive = ref(false);
		const loadingIndex = ref(-1);
		const fulfilledValue = ref<ActionSheetActionValue>();

		onMounted(() => {
			isActive.value = true;
		});

		const close = (value?: ActionSheetActionValue) => {
			fulfilledValue.value = value;
			loadingIndex.value = -1;
			isActive.value = false;
		};

		const handlePopupFulfilled = () => {
			emit('portal-fulfilled', fulfilledValue.value);
		};

		const handleClose = () => {
			if (loadingIndex.value !== -1) return;
			close();
		};

		const handleActionClick = async (action: ActionSheetAction, index: number) => {
			if (action.disabled || loadingIndex.value !== -1) return;

			try {
				if (!action.onClick) {
					close(action);
					return;
				}

				const result = action.onClick(action);
				if (result && typeof result.then === 'function') {
					loadingIndex.value = index;
				}

				const response = await result;
				if (!isActive.value) return;

				if (response !== false) {
					close(action);
				} else {
					loadingIndex.value = -1;
				}
			} catch {
				if (!isActive.value) return;

				loadingIndex.value = -1;
			}
		};

		return () => {
			return (
				<div class={COMPONENT_NAME}>
					<MPopup
						modelValue={isActive.value}
						mask={props.mask}
						maskClosable={props.maskClosable && loadingIndex.value === -1}
						placement="bottom"
						theme="none"
						wrapperClass={[props.wrapperClass, 'vcm-action-sheet__wrapper']}
						wrapperStyle={props.wrapperStyle}
						scrollRegExp={props.scrollRegExp}
						onUpdate:modelValue={(v: boolean) => (isActive.value = v)}
						// @ts-ignore
						onPortalFulfilled={handlePopupFulfilled}
					>
						<div class="vcm-action-sheet__container">
							<div class="vcm-action-sheet__group">
								{props.title && renderContent(props.title, 'vcm-action-sheet__title')}
								<div class="vcm-action-sheet__actions vcm-popup-scrollable">
									{
										props.data.map((action, index) => {
											const isLoading = loadingIndex.value === index;

											return (
												<div
													key={index}
													style={action.style}
													class={[
														action.class,
														{
															'is-disabled': action.disabled,
															'is-loading': isLoading
														},
														'vcm-action-sheet__item'
													]}
													onClick={withModifiers(() => handleActionClick(action, index), ['stop'])}
												>
													<Fragment>
														<div class="vcm-action-sheet__item-wrapper">
															{ renderContent(action.content, 'vcm-action-sheet__content', isLoading) }
															{
																isLoading && (
																	<MSpin
																		size={16}
																		class="vcm-action-sheet__loading"
																	/>
																)
															}
														</div>
														{
															action.subContent
															&& renderContent(action.subContent, 'vcm-action-sheet__sub-content', isLoading)
														}
													</Fragment>
												</div>
											);
										})
									}
								</div>
							</div>
							{
								props.cancelText && (
									<Fragment>
										<div class="vcm-action-sheet__gap" />
										<div
											class="vcm-action-sheet__cancel"
											onClick={withModifiers(handleClose, ['stop'])}
										>
											{props.cancelText}
										</div>
									</Fragment>
								)
							}
						</div>
					</MPopup>
				</div>
			);
		};
	}
});
