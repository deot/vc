/** @jsxImportSource vue */

import { defineComponent, ref, watch, nextTick, onMounted, onBeforeUnmount, Teleport } from 'vue';
import { Resize } from '@deot/helper-resize';
import { props as dropdownProps } from './dropdown-props';
import { useDropdown } from '../use-dropdown';
import { MPopup } from '../../popup/index.m';
import { ScrollerManager } from '../../scroller/core/manager';
import { getPortalElement } from '../../portal/utils';

const COMPONENT_NAME = 'vcm-dropdown';

// 当前打开的 MDropdown：打开另一个时，它立即收起（不播动画），新的蒙层直接显示，不重新淡入
let current: { hide: () => void } | null = null;

/**
 * 移动端下拉菜单：触发区与 Dropdown 相同；弹层为占满视口宽度的面板，从触发区下沿滑出（或上沿向上），其余区域为蒙层
 * 内容仍为 MDropdownMenu + MDropdownItem
 */
export const MDropdown = defineComponent({
	name: COMPONENT_NAME,
	props: dropdownProps,
	emits: ['update:modelValue', 'ready', 'close', 'visible-change', 'click'],
	setup(props, context) {
		const { slots, emit } = context;
		const { isActive, classes, renderTrigger, handleChange } = useDropdown(props, context, { mobile: true });

		const root = ref<HTMLElement>();
		const wrapper = ref<HTMLElement>();
		// 弹层容器是否显示：打开时显示，MPopup 离场动画结束后隐藏（容器覆盖触发区以外的区域，隐藏前会拦截点击）
		const isShown = ref(false);
		// 首次打开后才渲染弹层；面板在渲染后的下一帧再打开，首次打开也有进场动画
		const isRendered = ref(false);
		const isOpen = ref(false);
		// 展开方向：打开时按剩余空间决定，打开期间不变
		const direction = ref<'down' | 'up'>('down');
		// 从另一个 MDropdown 切换过来：蒙层不淡入
		const isSwitched = ref(false);
		const position = ref<Record<string, string>>({});

		/**
		 * 按 placement 的主方向展开；该侧的剩余高度小于另一侧、且不足视口的一半时翻转
		 * @returns 展开方向
		 */
		const getDirection = () => {
			const rect = root.value!.getBoundingClientRect();
			const below = window.innerHeight - rect.bottom;
			const above = rect.top;
			const preferred = /^top/.test(props.placement) ? 'up' : 'down';
			const [space, other] = preferred === 'down' ? [below, above] : [above, below];
			return space < other && space < window.innerHeight / 2
				? (preferred === 'down' ? 'up' : 'down')
				: preferred;
		};

		// 容器的纵向范围：向下时从触发区下沿到视口底部，向上时从视口顶部到触发区上沿；横向始终占满视口
		const setPosition = () => {
			const el = root.value;
			if (!el) return;
			if (!el.isConnected) {
				close();
				return;
			}
			const rect = el.getBoundingClientRect();
			const value = direction.value === 'down'
				? { top: `${rect.bottom}px`, bottom: '0px' }
				: { top: '0px', bottom: `${window.innerHeight - rect.top}px` };
			(value.top !== position.value.top || value.bottom !== position.value.bottom) && (position.value = value);
		};

		/**
		 * 点在面板与触发区以外（含蒙层）时关闭
		 * 点在另一个 MDropdown 的触发区上：交给它打开时处理（立即收起，见 current）；它没有打开（如禁用）时再关闭
		 * 弹层不挂出去时（portal 为 false）在触发区的节点内，先按弹层判断
		 * @param e ~
		 */
		const handleDocumentClick = (e: Event) => {
			const target = e.target as Element;
			const panel = wrapper.value?.querySelector('.vcm-popup__wrapper');
			if (panel?.contains(target)) return;
			if (!wrapper.value?.contains(target) && root.value?.contains(target)) return;

			const other = target.closest?.('.vcm-dropdown');
			if (other && other !== root.value) {
				setTimeout(() => isActive.value && close());
				return;
			}
			close();
		};

		let unbindScrollers = () => {};
		const bind = () => {
			document.addEventListener('click', handleDocumentClick, true);
			document.addEventListener('scroll', setPosition);
			window.addEventListener('resize', setPosition);
			// 触发区所在的滚动容器滚动时跟随（同 Popover），触发区尺寸变化时重新计算
			({ off: unbindScrollers } = ScrollerManager.subscribe(root.value?.parentNode, setPosition));
			Resize.on(root.value as any, setPosition);
		};
		const unbind = () => {
			document.removeEventListener('click', handleDocumentClick, true);
			document.removeEventListener('scroll', setPosition);
			window.removeEventListener('resize', setPosition);
			unbindScrollers();
			unbindScrollers = () => {};
			root.value && Resize.off(root.value as any, setPosition);
		};

		const self = {
			hide: () => {
				isShown.value = false;
				close();
			}
		};

		const close = () => {
			isActive.value && handleChange(false);
		};

		const open = () => {
			handleChange(true);
		};

		// 打开、关闭（含 v-model 从外部改变）：定位、监听与 current
		const handleActiveChange = (v: boolean) => {
			if (v) {
				isSwitched.value = !!current && current !== self;
				current && current !== self && current.hide();
				current = self;
				direction.value = getDirection();
				setPosition();
				isRendered.value = true;
				isShown.value = true;
				nextTick(() => isActive.value && (isOpen.value = true));
				bind();
				emit('ready');
			} else {
				isOpen.value = false;
				isSwitched.value = false;
				current === self && (current = null);
				unbind();
			}
		};

		watch(isActive, handleActiveChange, { flush: 'post' });
		onMounted(() => {
			isActive.value && handleActiveChange(true);
		});

		onBeforeUnmount(() => {
			current === self && (current = null);
			unbind();
		});

		const handleClick = (e: MouseEvent) => {
			// 弹层不挂出去时，弹层内的点击会冒泡到触发区
			if (wrapper.value?.contains(e.target as Node)) return;
			if (props.disabled || props.trigger === 'custom') return;
			isActive.value ? close() : open();
		};

		// MPopup 离场动画结束
		const handleRemove = () => {
			isShown.value = false;
			emit('close');
		};

		const renderPortal = () => {
			const content = slots.content;
			return (
				<div
					ref={wrapper}
					// @ts-ignore
					vShow={isShown.value}
					class={[
						'vcm-dropdown-wrapper',
						`is-${direction.value}`,
						{ 'is-switched': isSwitched.value },
						props.portalClass
					]}
					style={[position.value, props.portalStyle as any]}
				>
					<MPopup
						modelValue={isOpen.value}
						fixed={false}
						placement={direction.value === 'down' ? 'top' : 'bottom'}
						maskClosable={false}
						swipeClosable={false}
						// 内容放在 content：面板分为 header / 内容区 / footer，内容区过长时滚动
						content={content}
						// @ts-ignore
						onClose={handleRemove}
					>
						{{
							header: slots.header,
							footer: slots.footer
						}}
					</MPopup>
				</div>
			);
		};

		return () => {
			const Tag = props.tag as any;
			const disabled = !props.portal && !props.to;
			return (
				<Tag
					ref={root}
					class={[classes.value, { 'is-disabled': props.disabled }]}
					onClick={handleClick}
				>
					{renderTrigger()}
					{
						isRendered.value && (
							<Teleport to={props.to || getPortalElement()} disabled={disabled}>
								{renderPortal()}
							</Teleport>
						)
					}
				</Tag>
			);
		};
	}
});
