/** @jsxImportSource vue */

import { defineComponent, ref, computed, watch } from 'vue';
import { toRem } from '@deot/vc-shared';
import { MButton } from '../../button/index.m';
import { MPopup } from '../../popup/index.m';
import { useDrawer } from '../use-drawer';
import { props as drawerProps } from './drawer-view-props';

const COMPONENT_NAME = 'vcm-drawer';

export const MDrawerView = defineComponent({
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
			shouldClose,
			handleRemove
		} = useDrawer(props, context);

		/**
		 * 传给 MPopup 的显示状态
		 * MPopup 自己发起的关闭（遮罩、关闭按钮、滑动）已在离场：isActive 立即变为 false（离场中按钮、Esc 不再生效），但不再经 modelValue 通知它，
		 * 否则滑动关闭的滑出会被离场动画打断；离场结束（close）后再同步
		 */
		const visible = ref(isActive.value);
		let closedByPopup = false;
		watch(isActive, (v) => {
			if (closedByPopup) {
				closedByPopup = false;
				return;
			}
			visible.value = v;
		});

		const allow = (v: boolean) => {
			if (v && isActive.value) {
				closedByPopup = true;
				isActive.value = false;
			}
			return v;
		};
		const beforeClose = () => {
			const result = shouldClose();
			return typeof result === 'boolean' ? allow(result) : result.then(allow);
		};

		const handleClose = () => {
			visible.value = false;
			handleRemove();
		};

		const style = computed(() => {
			const vertical = props.placement === 'top' || props.placement === 'bottom';
			if (!vertical) return { width: toRem(props.width) };
			return props.height === undefined ? undefined : { height: toRem(props.height) };
		});

		// 作为 MPopup 的 footer 插槽：在 MCustomer 中渲染，文案、禁用状态变化只更新底部
		const renderFooter = () => {
			return (
				<div class="vcm-drawer__footer">
					{ slots['footer-extra']?.() }
					{
						slots.footer
							? slots.footer()
							: [
									cancelText.value && (
										<MButton
											size="large"
											class="vcm-drawer__button vcm-drawer__cancel"
											disabled={props.cancelDisabled}
											onClick={(e: Event) => handleBefore(e, handleCancel)}
										>
											{ cancelText.value }
										</MButton>
									),
									okText.value && (
										<MButton
											size="large"
											type="primary"
											class="vcm-drawer__button vcm-drawer__ok"
											disabled={props.okDisabled}
											onClick={(e: Event) => handleBefore(e, handleOk)}
										>
											{ okText.value }
										</MButton>
									)
								]
					}
				</div>
			);
		};

		return () => {
			return (
				<MPopup
					class="vcm-drawer"
					modelValue={visible.value}
					placement={props.placement as any}
					mask={props.mask}
					maskClosable={props.maskClosable}
					maskStyle={props.maskStyle}
					swipeClosable={props.swipeClosable}
					title={props.title}
					closable={props.closable}
					content={props.content}
					scrollable={props.scrollable}
					contentClass={props.contentClass}
					contentStyle={props.contentStyle}
					wrapperClass={props.wrapperClass}
					wrapperStyle={[style.value, props.wrapperStyle] as any}
					beforeClose={beforeClose}
					onClose={handleClose}
				>
					{{
						default: slots.default,
						header: slots.header,
						footer: hasFooter.value ? renderFooter : undefined
					}}
				</MPopup>
			);
		};
	}
});
