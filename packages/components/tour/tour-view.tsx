/** @jsxImportSource vue */

import { defineComponent, computed, shallowRef, watch, nextTick, onBeforeUnmount, normalizeStyle, Fragment } from 'vue';
import { omit } from 'lodash-es';
import { getUid } from '@deot/helper-utils';
import { Button } from '../button';
import { Icon } from '../icon';
import { Customer } from '../customer';
import { Scroller } from '../scroller';
import { TransitionFade } from '../transition';
import { Portal } from '../portal';
import { PopoverView } from '../popover';
import { useLocale } from '../locale';
import { props as tourProps, emits as tourEmits } from './tour-props';
import { useTour } from './use-tour';
import { usePosition } from './use-position';
import { useKeyboard } from './use-keyboard';
import { TourMask } from './mask';
import type { TourAction } from './types';

const COMPONENT_NAME = 'vc-tour-view';

export const TourView = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	// 断言为内置 Omit：lodash 返回的自有 Omit 类型无法写入声明文件（构建 dts 报 TS2883）
	props: omit(tourProps, ['modelValue']) as Omit<typeof tourProps, 'modelValue'>,
	emits: [...tourEmits, 'portal-fulfilled'],
	setup(props, { slots, emit, expose, attrs }) {
		const { t } = useLocale();
		const titleId = getUid('vc-tour-title');
		const tour = useTour(props, emit, async () => {
			await nextTick();
			position.update(true);
		});
		// 有目标时卡片即 Popover 气泡（以锚点为触发节点，显隐由引导控制），否则居中渲染在根节点内
		const popover = shallowRef<{ update: () => void; $el: HTMLElement }>();
		const position = usePosition(tour.isActive, tour.element, tour.options, tour.refresh, () => popover.value?.update());
		const centerCard = shallowRef<HTMLElement>();
		const card = computed(() => (tour.element.value ? popover.value?.$el : centerCard.value));
		useKeyboard(tour, card);
		expose({
			...tour.api,
			close: tour.handleClose,
			refresh: tour.refresh
		});

		const getSlotProps = () => ({
			...tour.getContext(),
			...tour.api,
			close: tour.close
		});
		const renderSlot = (name: string) => {
			const stepSlots = tour.record.value?.slots;
			const slot = stepSlots?.[name] || (name === 'content' ? stepSlots?.default : undefined) || slots[name];
			return slot?.(getSlotProps());
		};
		const renderValue = (value: any) => typeof value === 'function'
			? <Customer {...tour.getContext()} render={value} />
			: <span innerHTML={value || ''} />;
		const getText = (action: TourAction) => {
			return tour.options.value[`${action}Text`] ?? t(`vc.Tour.${action}Text`);
		};
		const renderButton = (action: TourAction) => {
			const text = getText(action);
			if (text === false) return null;
			const options = tour.options.value[`${action}ButtonOptions`];
			const buttonProps = omit(options, ['onClick']);
			return (
				<Button
					key={action}
					type={action === 'next' || action === 'finish' ? 'primary' : 'default'}
					size="small"
					{...buttonProps}
					disabled={tour.isLoading.value || options?.disabled}
					onClick={(event: Event) => tour.handleAction(action, 'button', event)}
				>
					{text}
				</Button>
			);
		};
		const renderProgress = () => {
			const options = tour.options.value;
			if (!options.showProgress) return null;
			const custom = renderSlot('progress');
			if (custom) return custom;
			const current = tour.current.value + 1;
			const total = tour.steps.value.length;
			return (
				<div class="vc-tour__progress" aria-label={t('vc.Tour.progress', { current, total })}>
					{
						options.progressType === 'dot'
							? tour.steps.value.map((_, index) => <span class={['vc-tour__dot', { 'is-active': index === tour.current.value }]} />)
							: options.progressFormatter?.({ current, total }) ?? `(${current}/${total})`
					}
				</div>
			);
		};

		const handleElementClick = (event: MouseEvent) => {
			// 仅按 DOM 包含判断（不用 isInArea）：目标打开的子弹层（如下拉选项）内的点击不视为点击目标，不推进
			const isTarget = tour.element.value?.contains(event.target as Node);
			if (tour.options.value.advanceOnClick && !tour.options.value.disableActiveInteraction && isTarget) {
				queueMicrotask(() => void tour.handleAction('next', 'element', event));
			}
		};
		const detach = () => {
			document.removeEventListener('click', handleElementClick, true);
		};
		watch(
			() => tour.isActive.value,
			(isActive) => {
				detach();
				if (!isActive) return;
				document.addEventListener('click', handleElementClick, true);
			},
			{ flush: 'post' }
		);

		onBeforeUnmount(detach);

		const handleMaskClick = (event: MouseEvent) => {
			const options = tour.options.value;
			if (options.maskClickBehavior === 'next') void tour.handleAction('next', 'mask', event);
			if (options.maskClickBehavior === 'close' && options.maskClosable) void tour.handleClose('mask');
		};

		const cardWidth = computed(() => {
			const { width: value } = tour.options.value;
			return typeof value === 'number' ? `${value}px` : value;
		});
		// 卡片的三段：标题（含关闭按钮）与底部固定，正文滚动
		// 有目标时作为气泡（Popover）的 header / content / footer，由其内置的 Scroller 滚动；居中时由 renderCenter 组装
		const renderHeader = () => {
			const options = tour.options.value;
			return (
				<div class="vc-tour__header">
					{
						options.closable && (
							<button
								type="button"
								class="vc-tour__close"
								disabled={tour.isLoading.value}
								aria-label={t('vc.Tour.close')}
								onClick={() => tour.handleClose('button')}
							>
								<Icon type="close" />
							</button>
						)
					}
					<div id={titleId}>
						{
							renderSlot('header') ?? (
								<div class="vc-tour__title">{renderSlot('title') ?? renderValue(options.title)}</div>
							)
						}
					</div>
				</div>
			);
		};
		// 没有底部时，卡片底部的留白落在正文上
		const renderContent = () => {
			return (
				<div class={['vc-tour__content', { 'is-end': !tour.options.value.footer }]}>
					{renderSlot('content') ?? renderValue(tour.options.value.content)}
				</div>
			);
		};
		const renderFooter = () => {
			return (
				<div class="vc-tour__footer">
					{
						renderSlot('footer') ?? (
							<Fragment>
								{renderProgress()}
								<div class="vc-tour__buttons">
									{tour.current.value > 0 && renderButton('previous')}
									{renderButton('skip')}
									{renderButton(tour.isLast.value ? 'finish' : 'next')}
								</div>
							</Fragment>
						)
					}
				</div>
			);
		};
		// 卡片（气泡或居中）的对话框语义
		const getDialogAttrs = () => ({
			'role': 'dialog',
			'aria-modal': tour.options.value.mask ? 'true' as const : undefined,
			'aria-labelledby': titleId,
			'aria-busy': tour.isLoading.value,
			'tabindex': -1
		});
		const renderCenter = () => {
			const options = tour.options.value;
			return (
				<div
					ref={centerCard}
					class={['vc-tour__card', 'is-center', options.contentClass]}
					style={[{ width: cardWidth.value }, options.contentStyle]}
					{...getDialogAttrs()}
				>
					{renderHeader()}
					<Scroller wrapperClass="vc-tour__content-container">
						{renderContent()}
					</Scroller>
					{options.footer && renderFooter()}
				</div>
			);
		};

		return () => {
			const options = tour.options.value;
			return tour.isActive.value && (
				<TransitionFade
					// @ts-ignore
					appear
					duration={options.animated ? options.duration : 0}
					onAfterLeave={tour.handleAfterLeave}
				>
					<div
						v-show={!tour.isLeaving.value}
						ref={position.root}
						class={['vc-tour', props.wrapperClass, attrs.class]}
						style={[
							{
								zIndex: props.zIndex ?? position.layer.value
							},
							props.wrapperStyle
						]}
					>
						<TourMask position={position} options={options} onShadeClick={handleMaskClick} />
						{
							tour.element.value
								? (
										<PopoverView
											ref={popover}
											triggerElement={position.anchor}
											getPopupContainer={() => position.root.value}
											alone={false}
											theme="light"
											animation="none"
											placement={options.placement}
											arrow={options.arrow}
											portalClass={['vc-tour__popover', 'vc-tour__card', 'is-padding-none', options.contentClass]}
											portalStyle={normalizeStyle([{ width: cardWidth.value }, options.contentStyle]) as any}
											{...getDialogAttrs()}
										>
											{{
												header: renderHeader,
												content: renderContent,
												footer: options.footer ? renderFooter : undefined
											}}
										</PopoverView>
									)
								: renderCenter()
						}
					</div>
				</TransitionFade>
			);
		};
	}
});

export const TourPortal = new Portal(TourView, {
	multiple: true,
	leaveDelay: 0
});
