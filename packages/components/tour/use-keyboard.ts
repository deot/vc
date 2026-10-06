import { watch, nextTick, onBeforeUnmount } from 'vue';
import type { Ref } from 'vue';
import { findLastIndex } from 'lodash-es';
import { Keyboard } from '@deot/vc-shared';
import { isInArea, getAreaNode } from '../popover/utils';
import type { useTour } from './use-tour';

const focusSelector = [
	'button:not(:disabled)', 'a[href]', 'input:not(:disabled)', 'select:not(:disabled)',
	'textarea:not(:disabled)', '[tabindex]:not([tabindex="-1"])'
].join(', ');

// node 不晚于 target 的子树：在 target 内（含自身），或在文档顺序上位于 target 之前（含其祖先）
const isAtOrBefore = (node: Node, target: Node) => {
	return target.contains(node) || !!(node.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING);
};

const isFocusable = (node: Element): node is HTMLElement => {
	return node.matches(focusSelector) && !node.matches(':disabled') && !node.closest('[inert]') && node.getClientRects().length > 0;
};

export const useKeyboard = (tour: ReturnType<typeof useTour>, card: Ref<HTMLElement | undefined>) => {
	const focusCard = () => card.value?.focus({ preventScroll: true });
	const getFocusable = (area: Element) => [area, ...area.querySelectorAll(focusSelector)].filter(isFocusable);
	// 焦点在卡片或目标打开的子弹层（挂 body，如 Select 下拉的搜索框）内时，返回其在卡片/目标内的触发节点
	const getPopupOrigin = (node: Node) => {
		for (const area of [card.value, tour.element.value]) {
			const origin = area && getAreaNode(node, area);
			if (origin) return origin === node ? null : origin;
		}
		return null;
	};
	// 回到触发控件：触发节点本身不可聚焦时取其内第一个可聚焦节点
	const focusOrigin = (origin: Node) => {
		const control = origin instanceof Element ? getFocusable(origin)[0] : undefined;
		control ? control.focus({ preventScroll: true }) : focusCard();
	};
	const trapFocus = (event: KeyboardEvent) => {
		if (!tour.options.value.mask) return false;
		const areas = [card.value, ...(tour.options.value.disableActiveInteraction ? [] : [tour.element.value])]
			.filter((area): area is HTMLElement => !!area);
		const groups = areas.map(getFocusable);
		const focusable = groups.flat();
		if (!focusable.length) {
			focusCard();
			return true;
		}
		const active = document.activeElement as HTMLElement;
		let index = focusable.indexOf(active);
		let isInPopup = false;
		// 焦点在子弹层内：从包含或位于触发节点之前的最后一个可聚焦节点继续，如同子弹层内联在触发节点处
		for (let i = 0, offset = 0; index === -1 && i < areas.length; offset += groups[i].length, i++) {
			const origin = getAreaNode(active, areas[i]);
			if (!origin) continue;
			isInPopup = true;
			index = offset + findLastIndex(groups[i], node => isAtOrBefore(node, origin));
		}
		const next = event.shiftKey ? (isInPopup ? index : index - 1) : index + 1;
		focusable[next < 0 ? focusable.length - 1 : next % focusable.length].focus({ preventScroll: true });
		return true;
	};
	const handleKeyboard = (event: KeyboardEvent) => {
		if (!tour.isActive.value || event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return false;
		if (event.key === 'Tab') return trapFocus(event);
		const origin = event.target instanceof Node ? getPopupOrigin(event.target) : null;
		if (event.key === 'Escape') {
			// 焦点在子弹层内时先回到触发控件，不关闭引导
			if (origin) focusOrigin(origin);
			else if (!event.repeat && tour.options.value.escClosable) void tour.handleClose('esc');
			return true;
		}
		const input = event.target instanceof Element
			&& event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])');
		// 输入区与子弹层内的方向键交给其自身处理
		if (!tour.options.value.keyboard || input || origin || event.shiftKey) return false;
		if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
			if (!event.repeat) void tour.handleAction(event.key === 'ArrowRight' ? 'next' : 'previous', 'keyboard', event);
			return true;
		}
		return false;
	};
	// 触发节点在卡片或目标内的子弹层（挂 body，如 Select 下拉的搜索框）视为在其内，见 isInArea
	const handleFocus = (event: FocusEvent) => {
		const isInsideCard = !!card.value && isInArea(event, card.value);
		const isInsideElement = !!tour.element.value && isInArea(event, tour.element.value);
		if (isInsideCard) return;
		if ((tour.options.value.disableActiveInteraction && isInsideElement) || (tour.options.value.mask && !isInsideElement)) focusCard();
	};
	let unsubscribe = () => {};
	const detach = () => {
		unsubscribe();
		document.removeEventListener('focusin', handleFocus, true);
	};
	watch(
		() => tour.isActive.value,
		(isActive) => {
			detach();
			if (!isActive) return;
			unsubscribe = Keyboard.on(handleKeyboard);
			document.addEventListener('focusin', handleFocus, true);
		},
		{ flush: 'post' }
	);

	// 打开、切步与目标交互变化后，焦点回到卡片
	watch(
		[() => tour.isActive.value, () => tour.current.value, () => tour.element.value, () => tour.options.value.disableActiveInteraction],
		async () => {
			await nextTick();
			tour.isActive.value && focusCard();
		},
		{ flush: 'post' }
	);

	onBeforeUnmount(detach);
};
