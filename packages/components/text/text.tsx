/** @jsxImportSource vue */

import { getCurrentInstance, defineComponent, watch, ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Resize } from '@deot/helper-resize';
import { debounce } from 'lodash-es';
import { props as textProps } from './text-props';
import { Customer } from '../customer';
import { Popover } from '../popover';
import { getFitIndex } from './utils';

const COMPONENT_NAME = 'vc-text';

export const Text = defineComponent({
	name: COMPONENT_NAME,
	props: textProps,
	setup(props, { emit }) {
		const instance = getCurrentInstance()!;

		const isActive = ref(false);
		const endIndex = ref(0);

		const styles = computed(() => {
			return { cursor: endIndex.value === 0 ? 'unset' : 'pointer' };
		});

		const calcPosition = () => {
			const { suffix, line, value, indent } = props;
			if (line === 0) {
				endIndex.value = 0;
				isActive.value = true;
			} else {
				endIndex.value = getFitIndex({
					el: instance.vnode.el,
					line,
					value,
					suffix,
					indent
				});
				isActive.value = true;
			}
			emit('clip', endIndex.value);
		};

		const handleResize = props.resize === true || props.resize === 0 ? calcPosition : debounce(calcPosition, props.resize || 0);

		let poper;
		const handleMouseOver = (e: any) => {
			if (endIndex.value > 0) {
				poper = Popover.open({
					el: document.body,
					name: 'vc-text-popover', // 确保不重复创建
					triggerEl: e.target,
					hover: true,
					theme: 'dark',
					placement: props.placement,
					portalClass: props.portalClass,
					portalStyle: [props.portalStyle || `width: ${e.target.clientWidth}px`, 'word-break: break-all'],
					content: props.value,
				});
			}
		};

		const handleMouseOut = () => {
			// Do.
		};

		['value', 'indent', 'line'].forEach((key) => {
			watch(
				() => props[key],
				calcPosition
			);
		});

		onMounted(() => {
			props.resize !== false && Resize.on(instance.vnode.el as any, handleResize); // 首次会执行一次
		});

		onBeforeUnmount(() => {
			props.resize !== false && Resize.off(instance.vnode.el as any, handleResize);
			poper?.destroy?.();
		});

		const Content = props.tag;
		return () => {
			return (
				<Content
					// @ts-ignore
					class="vc-text"
					style={styles.value}
					onMouseover={handleMouseOver}
					onMouseout={handleMouseOut}
				>
					{
						isActive.value
							? (
									<Customer
										value={endIndex.value > 0 ? `${props.value.slice(0, endIndex.value)}${props.suffix}` : props.value}
										index={endIndex.value}
										// @ts-ignore
										render={props.renderRow}
									/>
								)
							: null
					}
				</Content>
			);
		};
	}
});
