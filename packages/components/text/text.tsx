/** @jsxImportSource vue */

import { getCurrentInstance, defineComponent, watch, ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Resize } from '@deot/helper-resize';
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

		let timer: any;
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

		const handleResize = () => {
			timer && clearTimeout(timer);
			timer = setTimeout(calcPosition, 50);
		};

		const handleMouseOver = (e: any) => {
			if (endIndex.value > 0) {
				Popover.open({
					el: document.body,
					name: 'vc-text-popover', // 确保不重复创建
					triggerEl: e.target,
					hover: true,
					theme: 'dark',
					placement: props.placement,
					portalClassName: props.portalClassName,
					portalStyle: props.portalStyle,
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
			setTimeout(calcPosition, 0);

			Resize.on(instance.vnode.el as any, handleResize);
		});

		onBeforeUnmount(() => {
			Resize.off(instance.vnode.el as any, handleResize);
			timer && clearTimeout(timer);
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
