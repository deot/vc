/** @jsxImportSource vue */

import { defineComponent, watch, computed, ref, getCurrentInstance } from 'vue';
import { Popover } from '../popover/index';
import { Button } from '../button/index';
import { Icon } from '../icon/index';
import { Customer } from '../customer/index';
import { useAttrs } from '@deot/vc-hooks';
import { props as popconfirmProps } from './popconfirm-props';

const COMPONENT_NAME = 'vc-popconfirm';

export const Popconfirm = defineComponent({
	name: COMPONENT_NAME,
	props: popconfirmProps,
	inheritAttrs: false,
	emits: ['update:modelValue', 'visible-change', 'ready', 'close', 'cancel', 'ok'],
	setup(props, { slots, emit }) {
		const instance = getCurrentInstance()!;
		const its = useAttrs({ merge: false });
		const isActive = ref(false);

		const contentStyle = computed(() => {
			return props.content || !!slots.content
				? { marginBottom: '15px' }
				: {};
		});

		const inherit = computed(() => {
			return {
				style: its.value.style,
				class: its.value.class,
			};
		});

		const attrs = computed(() => {
			return its.value.attrs;
		});

		watch(
			() => props.modelValue,
			(v) => {
				isActive.value = v;
			},
			{ immediate: true }
		);

		/**
		 * v-model 同步, 外部的数据改变时不会触发
		 */
		const sync = () => {
			emit('update:modelValue', isActive.value);
			emit('visible-change', isActive.value);
		};
		const handleBefore = (e: any, hook: any) => {
			e.stopPropagation();
			e.preventDefault();
			if (!isActive.value) return;

			const fn = hook && hook(e);
			if (fn && fn.then) {
				return fn
					.then((res: any) => {
						isActive.value = false;
						sync();
						return res;
					});
			} else if (!fn || fn === true) {
				isActive.value = false;
				sync();
			}
		};

		const handleOk = (...rest: any[]) => {
			const ok = instance.vnode.props?.onOk || (() => {});

			return ok(...rest);
		};

		const handleCancel = (...rest: any[]) => {
			const cancel = instance.vnode.props?.onCancel || (() => {});

			return cancel(...rest);
		};

		const handleChange = (v: any) => {
			isActive.value = v;

			sync();
		};

		return () => {
			return (
				<Popover
					{
						...attrs.value
					}
					modelValue={isActive.value}
					placement={props.placement}
					trigger={props.trigger}
					portalClass={['is-padding-none', 'vc-popconfirm-wrapper', props.portalClass]}
					class={['vc-popconfirm', inherit.value.class]}
					style={inherit.value.style}
					onReady={() => emit('ready')}
					onClose={() => emit('close')}
					// @ts-ignore
					onVisibleChange={handleChange}
				>
					{{
						default: () => slots?.default?.(),
						content: () => {
							return (
								<div
									style={[{ width: `${props.width}px` }]}
									class="vc-popconfirm__wrapper"
								>
									<div class="vc-popconfirm__title">
										{
											slots.icon
												? slots.icon()
												: (<Icon type={props.type} class={[`is-${props.type}`, 'vc-popconfirm__icon']} />)
										}
										<div>
											{
												slots.title
													? slots.title()
													: typeof props.title === 'string'
														? (<div innerHTML={props.title} />)
														: typeof props.title === 'function'
															? (<Customer render={props.title} />)
															: null
											}
										</div>
									</div>
									<div style={contentStyle.value} class="vc-popconfirm__content">
										{
											slots.content
												? slots.content()
												: typeof props.content === 'string'
													? (<div innerHTML={props.content} />)
													: typeof props.content === 'function'
														? (<Customer render={props.content} />)
														: null
										}
									</div>
									<div class="vc-popconfirm__footer">
										<Button
											type={props.cancelType as any}
											style="margin-right: 8px;"
											size="small"
											onClick={(e: any) => handleBefore(e, handleCancel)}
										>
											{props.cancelText}
										</Button>
										<Button
											type={props.okType as any}
											size="small"
											onClick={(e: any) => handleBefore(e, handleOk)}
										>
											{props.okText}
										</Button>
									</div>
								</div>
							);
						}
					}}
				</Popover>
			);
		};
	}
});
