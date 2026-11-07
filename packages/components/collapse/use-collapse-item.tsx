/** @jsxImportSource vue */

import type { SetupContext } from 'vue';
import { ref, inject, computed, getCurrentInstance, onBeforeMount, onBeforeUnmount } from 'vue';
import type { Props } from './collapse-item-props';
import { Icon } from '../icon';
import { Expand } from '../expand';
import { Customer } from '../customer';
import { hasCustomerValue } from '../customer/utils';

/**
 * CollapseItem 与 MCollapseItem 共用
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param context.expose ~
 * @param options ~
 * @param options.mobile 移动端（MCollapseItem）：根节点加标记类 vcm-collapse-item，尺寸由 mobile/style.scss 覆盖局部变量；箭头在右侧时与 MListItem 一致
 * @returns render
 */
export const useCollapseItem = (
	props: Props,
	{ slots, expose }: SetupContext,
	options: { mobile?: boolean } = {}
) => {
	const name = options.mobile ? 'vc-collapse-item vcm-collapse-item' : 'vc-collapse-item';
	// 内置箭头的图标：左侧为三角；右侧桌面端为三角，移动端与 MListItem 一致
	const arrowIcon = { left: 'triangle-up', right: options.mobile ? 'right' : 'triangle-up' };
	const Content = props.tag;
	// 向 Collapse 注册实例：Collapse 通过 exposed.toggle 设置展开状态
	const instance = getCurrentInstance();
	const isActive = ref(false);
	const current = ref();

	const collapse = inject('vc-collapse') as any;

	const alive = computed(() => {
		return typeof props.alive === 'boolean' ? props.alive : collapse.props.alive;
	});

	const styleless = computed(() => {
		return collapse.props.styleless;
	});

	const isDisabled = computed(() => {
		return props.disabled || collapse.props.disabled;
	});

	// 箭头位置，false 时不显示
	const arrow = computed(() => {
		return typeof props.arrow === 'undefined' ? collapse.props.arrow : props.arrow;
	});

	const collapsible = computed(() => {
		return typeof props.collapsible === 'boolean' ? props.collapsible : collapse.props.collapsible;
	});

	// 已展开且不能收起
	const isLocked = computed(() => {
		return isActive.value && !collapsible.value;
	});

	const isTriggerArrow = computed(() => {
		return collapse.props.triggerRegion === 'arrow';
	});

	const extraRef = ref<HTMLElement>();

	const handleToggle = (e?: MouseEvent) => {
		if (isDisabled.value || isLocked.value) return;
		// 拖选文字后松开同样会触发 click：选区在当前区域内时视为复制文字，不切换
		const selection = window.getSelection();
		const target = e?.currentTarget as Node | undefined;
		if (target && selection && !selection.isCollapsed && target.contains(selection.anchorNode)) return;
		collapse.toggle({
			value: typeof props.value !== 'undefined' ? props.value : current.value,
			visible: !isActive.value
		});
	};

	// 连续点击（双击、三击）时不选中文字；附加内容不切换，保留浏览器默认行为
	const handleMouseDown = (e: MouseEvent) => {
		if (e.detail < 2 || extraRef.value?.contains(e.target as Node)) return;
		e.preventDefault();
	};

	// 与 Collapse 合并：类名叠加，样式同名时以自身为准（同 Form / FormItem）
	const headerStyle = computed(() => [collapse.props.headerStyle, props.headerStyle]);
	const headerClass = computed(() => [collapse.props.headerClass, props.headerClass]);
	const contentStyle = computed(() => [collapse.props.contentStyle, props.contentStyle]);
	const contentClass = computed(() => [collapse.props.contentClass, props.contentClass]);

	const setValue = (v: number) => current.value = v;

	onBeforeMount(() => {
		collapse.add?.(instance, setValue);
	});

	onBeforeUnmount(() => {
		collapse.remove?.(instance, setValue);
	});

	expose({
		isActive,
		toggle: (v: boolean) => isActive.value = v
	});

	// styleless 时不提供内置箭头，仅渲染 arrow 插槽
	const renderArrow = () => {
		if (!arrow.value || (styleless.value && !slots.arrow)) return;
		return (
			<div
				class={[{ 'vc-collapse-item__arrow': !styleless.value }]}
				// @ts-ignore
				onClick={isTriggerArrow.value ? handleToggle : undefined}
				onMousedown={isTriggerArrow.value ? handleMouseDown : undefined}
			>
				{
					slots.arrow
						? slots.arrow({ visible: isActive.value })
						: (<Icon type={arrowIcon[arrow.value as 'left' | 'right']} class="vc-collapse-item__icon" />)
				}
			</div>
		);
	};

	return () => {
		const extra = slots.extra || props.extra;
		const arrowNode = renderArrow();
		return (
			<Content
				// @ts-ignore
				class={[{
					[name]: !styleless.value,
					'is-active': !styleless.value && isActive.value,
					'is-disabled': !styleless.value && isDisabled.value,
					'is-locked': !styleless.value && isLocked.value
				}]}
			>
				<div
					class={[
						!styleless.value && [
							'vc-collapse-item__header',
							`is-arrow-${arrow.value || 'none'}`,
							{ 'is-trigger-arrow': isTriggerArrow.value }
						],
						...headerClass.value
					]}
					style={headerStyle.value}
					onClick={isTriggerArrow.value ? undefined : handleToggle}
					onMousedown={isTriggerArrow.value ? undefined : handleMouseDown}
				>
					{ arrow.value === 'left' && arrowNode }
					<div class={[{ 'vc-collapse-item__title': !styleless.value }]}>
						<Customer tag="span" render={slots.default || props.title} visible={isActive.value} />
					</div>
					{
						hasCustomerValue(extra) && (
							<div
								ref={extraRef}
								class={[{ 'vc-collapse-item__extra': !styleless.value }]}
								// @ts-ignore
								onClick={(e: Event) => e.stopPropagation()}
							>
								<Customer tag="span" render={extra} visible={isActive.value} />
							</div>
						)
					}
					{ arrow.value === 'right' && arrowNode }
				</div>
				<Expand
					modelValue={isActive.value}
					alive={alive.value}
					// @ts-ignore
					onChange={(v: boolean) => isActive.value = v}
				>
					<div
						class={[{ 'vc-collapse-item__content': !styleless.value }, ...contentClass.value]}
						style={contentStyle.value}
					>
						<Customer tag="span" render={slots.content || props.content} visible={isActive.value} />
					</div>
				</Expand>
			</Content>
		);
	};
};
