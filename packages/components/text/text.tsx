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
		const endIndex = ref(-1);

		const hasSlice = computed(() => props.slice !== void 0 && props.slice !== null);
		// endIndex===0 在带 slice 场景下也代表"已截断 (前缀为空)"
		const truncated = computed(() => {
			return endIndex.value > 0 || (endIndex.value === 0 && hasSlice.value);
		});
		const displayValue = computed(() => {
			const sliceText = hasSlice.value ? props.value.slice(props.slice as number) : '';
			return truncated.value
				? `${props.value.slice(0, endIndex.value)}${props.ellipsis}${sliceText}`
				: props.value;
		});
		const isMeasuring = computed(() => !isActive.value && props.resize !== false);

		const styles = computed(() => {
			return {
				cursor: truncated.value ? 'pointer' : 'unset',
				visibility: isMeasuring.value ? 'hidden' : void 0
			};
		});

		const calcPosition = () => {
			const { ellipsis, slice, line, value, indent } = props;
			if (line === 0) {
				endIndex.value = -1;
				isActive.value = true;
			} else {
				endIndex.value = getFitIndex({
					el: instance.vnode.el,
					line,
					value,
					ellipsis,
					slice,
					indent
				});
				isActive.value = true;
			}
			emit('clip', endIndex.value);
		};

		const handleResize = props.resize === true || props.resize === 0 ? calcPosition : debounce(calcPosition, props.resize || 0);

		let poper;
		const handleMouseOver = (e: any) => {
			if (truncated.value) {
				poper = Popover.open({
					el: document.body,
					name: 'vc-text-popover', // 确保不重复创建
					triggerEl: e.target,
					hover: true,
					theme: props.theme,
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

		['value', 'indent', 'line', 'slice', 'ellipsis'].forEach((key) => {
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
										value={displayValue.value}
										index={endIndex.value}
										// @ts-ignore
										render={props.renderRow}
									/>
								)
							// 首次测量前用隐藏全文撑开 intrinsic width，避免 Flex 父级按空内容收缩
							: (props.resize !== false ? props.value : null)
					}
				</Content>
			);
		};
	}
});
