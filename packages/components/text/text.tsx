/** @jsxImportSource vue */

import { getCurrentInstance, defineComponent, watch, ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Resize } from '@deot/helper-resize';
import { debounce } from 'lodash-es';
import { props as textProps } from './text-props';
import { Customer } from '../customer';
import { Popover } from '../popover';
import { getFitIndex } from './utils';
import { useMeasuring } from '../measuring';
import { useScrollListener, whenScrollIdle } from '../scroller/scroll-idle';

const COMPONENT_NAME = 'vc-text';

const ELLIPSIS = textProps.ellipsis.default;
const RENDER_ROW = textProps.renderRow.default;

export const Text = defineComponent({
	name: COMPONENT_NAME,
	props: textProps,
	emits: ['clip', 'update:expanded', 'expand-change'],
	setup(props, { emit, slots }) {
		const instance = getCurrentInstance()!;

		const isActive = ref(false);
		const endIndex = ref(-1);

		const hasSlice = computed(() => props.slice !== void 0 && props.slice !== null);

		// clip 要给出截断下标，只有实际测量才算得出；是否监听在初始化时确定
		const hasClipListener = !!instance.vnode.props?.onClip;
		// 在虚拟列表的隐藏测量池里（那份渲染只用来量尺寸，不会展示）
		const measuring = useMeasuring();
		// 提供 expand 插槽即开启展开 / 收起，初始化时确定
		const hasExpand = !!slots.expand;
		const isExpanded = ref(hasExpand && props.expanded);
		const expand = ref<HTMLElement>();
		/**
		 * 能否交给 CSS 截断：默认省略符，没有 slice / renderRow / 尾部缩进，也没有监听 clip。
		 * 此时不测量、不监听尺寸，挂载成本只有一个元素；是否截断到鼠标移入时才判断。
		 * 测量池里一律用 CSS 截断：高度与测量后的结果一致，不必真的去量（展开时显示全文，不截断）
		 * 有 expand 插槽时要给入口留出宽度，只能 JS 测量
		 */
		const isClamp = computed(() => {
			return props.line > 0 && !isExpanded.value && (measuring || (
				props.ellipsis === ELLIPSIS
				&& props.renderRow === RENDER_ROW
				&& !hasSlice.value
				&& !props.indent
				&& !hasClipListener
				&& !hasExpand
			));
		});
		// CSS 截断时，鼠标移入那一刻内容是否被截断
		const isClamped = ref(false);
		// 内容超出 line 行；endIndex===0 在带 slice 场景下也代表"已截断 (前缀为空)"
		const overflow = computed(() => {
			return isClamp.value
				? isClamped.value
				: endIndex.value > 0 || (endIndex.value === 0 && hasSlice.value);
		});
		// 展开时超出也显示全文
		const truncated = computed(() => overflow.value && !isExpanded.value);
		const displayValue = computed(() => {
			const sliceText = hasSlice.value ? props.value.slice(props.slice as number) : '';
			return truncated.value
				? `${props.value.slice(0, endIndex.value)}${props.ellipsis}${sliceText}`
				: props.value;
		});
		const isMeasuring = computed(() => !isClamp.value && !isActive.value && props.resize !== false);

		const styles = computed(() => {
			return {
				// 有展开入口时不弹全文
				cursor: truncated.value && !hasExpand ? 'pointer' : 'unset',
				visibility: isMeasuring.value ? 'hidden' : void 0,
				flexShrink: props.shrink === void 0 ? void 0 : Number(props.shrink)
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
					indent,
					// 入口跟在省略符后，按整体宽度预留
					suffixWidth: hasExpand ? Math.ceil(expand.value?.getBoundingClientRect().width || 0) : 0
				});
				isActive.value = true;
			}
			emit('clip', endIndex.value);
		};

		const handleResize = props.resize === true || props.resize === 0
			? calcPosition
			: debounce(calcPosition, props.resize || 0, { leading: true, trailing: true });

		let poper;
		// 用 mouseenter 与根节点：renderRow 返回元素时，mouseover 在子元素间移动会反复触发，e.target 也会落到子元素上
		// 滚动期间内容从静止的鼠标下经过也会触发移入：等滚动停下、鼠标仍在上面才算悬停
		measuring || hasExpand || useScrollListener();
		const handleMouseEnter = (e: any) => {
			const el = e.currentTarget;
			whenScrollIdle(el, () => {
				// line-clamp 截断时，内容高度超出可见高度
				isClamp.value && (isClamped.value = el.scrollHeight > el.clientHeight);
				if (!truncated.value) return;
				const leaf = Popover.open({
					element: document.body,
					name: 'vc-text-popover', // 确保不重复创建
					triggerElement: el,
					hover: true,
					theme: props.theme,
					placement: props.placement,
					portalClass: props.portalClass,
					portalStyle: [props.portalStyle || `width: ${el.clientWidth}px`, 'word-break: break-all'],
					content: props.value,
					// 弹层销毁（自行关闭、被其它 Text 的提示替换）后不再引用它
					onDestroyed: () => poper === leaf && (poper = null)
				});
				poper = leaf;
			});
		};

		watch(
			() => [props.value, props.indent, props.line, props.slice, props.ellipsis],
			() => isClamp.value || calcPosition()
		);

		const toggle = () => {
			isExpanded.value = !isExpanded.value;
			emit('update:expanded', isExpanded.value);
			emit('expand-change', isExpanded.value);
		};

		watch(() => props.expanded, v => (isExpanded.value = hasExpand && v));
		// 入口文案随状态变化，宽度可能不同：渲染后重新测量
		watch(isExpanded, () => isClamp.value || calcPosition(), { flush: 'post' });

		// 未超出时不占位，但仍渲染以便测量宽度
		const renderExpand = (hidden: boolean) => {
			if (!hasExpand) return null;
			return (
				<span
					ref={expand}
					class={['vc-text__expand', { 'is-hidden': hidden }]}
					onClick={toggle}
				>
					{ slots.expand!({ expanded: isExpanded.value }) }
				</span>
			);
		};

		// 只有 JS 测量要监听尺寸（测量池里 line=0 的那份也不必：不截断）
		const bindResize = () => {
			if (measuring || props.resize === false) return;
			Resize.on(instance.vnode.el as any, handleResize); // 首次会执行一次
		};
		// 未绑定时是空操作
		const unbindResize = () => Resize.off(instance.vnode.el as any, handleResize);

		// 截断方式随属性切换：回到 JS 测量时重新绑定（resize=false 不监听，直接算一次）
		watch(
			isClamp,
			(v) => {
				if (v) return unbindResize();
				bindResize();
				props.resize === false && calcPosition();
			},
			{ flush: 'post' }
		);

		onMounted(() => {
			isClamp.value || bindResize();
		});

		onBeforeUnmount(() => {
			unbindResize();
			// 防抖的尾调用不该在卸载后再量一次
			(handleResize as { cancel?: () => void }).cancel?.();
			poper?.destroy?.();
		});

		const Content = props.tag;
		return () => {
			if (isClamp.value) {
				return (
					<Content
						// @ts-ignore
						class="vc-text is-clamp"
						style={[styles.value, { '--vc-text-line': props.line }]}
						onMouseenter={hasExpand ? void 0 : handleMouseEnter}
					>
						{ props.value }
					</Content>
				);
			}
			return (
				<Content
					// @ts-ignore
					class="vc-text"
					style={styles.value}
					onMouseenter={hasExpand ? void 0 : handleMouseEnter}
				>
					{
						isActive.value
							? (
									<Customer render={props.renderRow} value={displayValue.value} index={endIndex.value} />
								)
							// 首次测量前用隐藏全文撑开 intrinsic width，避免 Flex 父级按空内容收缩
							: (props.resize !== false ? props.value : null)
					}
					{ renderExpand(isActive.value && !overflow.value) }
				</Content>
			);
		};
	}
});
