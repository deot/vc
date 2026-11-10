import { h, defineComponent, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { useScrollContain } from '@deot/vc-hooks';
import type { ScrollContainOptions } from '@deot/vc-hooks';
import { fireMouse, fireTouch } from './fixtures/drag';

// jsdom 不做布局：给滚动区域内容高度与可视高度
const fakeScroll = (el: HTMLElement, scrollHeight: number, clientHeight: number) => {
	Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight });
	Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight });
};

// 一次纵向拖动：返回各次 move 事件
const drag = (el: HTMLElement, from: number, to: number, steps = 2) => {
	fireTouch(el, 'touchstart', { clientX: 0, clientY: from });
	const moves: Event[] = [];
	for (let i = 1; i <= steps; i++) {
		moves.push(fireTouch(el, 'touchmove', { clientX: 0, clientY: from + (to - from) * i / steps }));
	}
	fireTouch(el, 'touchend', { clientX: 0, clientY: to });
	return moves;
};

describe('use-scroll-contain.ts', () => {
	// 根节点：遮罩 + 面板（面板内一个滚动区域 list，list 内一个普通元素 item）
	const mountContain = (options: Partial<ScrollContainOptions> = {}) => {
		const Wrapper = defineComponent(() => {
			const root = ref<HTMLElement>();
			const panel = ref<HTMLElement>();
			const { listeners } = useScrollContain({ root, panel, ...options });
			return () => h('div', { ref: root, class: 'root', ...listeners }, [
				h('div', { class: 'mask' }),
				h('div', { ref: panel, class: 'panel' }, [
					h('div', { class: 'list', style: { overflowY: 'auto' } }, [h('div', { class: 'item' })]),
					h('div', { class: 'marked' }),
					h('input', { class: 'input' })
				])
			]);
		});
		const wrapper = mount(Wrapper, { attachTo: document.body });
		const find = (selector: string) => wrapper.find(selector).element as HTMLElement;
		return { wrapper, find };
	};

	it('面板外（遮罩）与面板内不可滚动处的拖动被阻止', () => {
		const { wrapper, find } = mountContain();
		expect(drag(find('.mask'), 100, 300).every(e => e.defaultPrevented)).toBe(true);
		expect(drag(find('.marked'), 100, 300).every(e => e.defaultPrevented)).toBe(true);
		wrapper.unmount();
	});

	it('滚动区域还能滚时交给滚动，滚到边界后继续拖动被阻止', () => {
		const { wrapper, find } = mountContain();
		const list = find('.list');
		fakeScroll(list, 1000, 300);

		// scrollTop 为 0：手指向上（内容向下滚）可以滚动
		expect(drag(find('.item'), 300, 100).some(e => e.defaultPrevented)).toBe(false);
		// 手指向下：已在顶部，不能滚动，阻止
		expect(drag(find('.item'), 100, 300).every(e => e.defaultPrevented)).toBe(true);

		// 滚动中到达底部：之后的移动被阻止
		list.scrollTop = 690;
		fireTouch(find('.item'), 'touchstart', { clientX: 0, clientY: 300 });
		const first = fireTouch(find('.item'), 'touchmove', { clientX: 0, clientY: 290 });
		expect(first.defaultPrevented).toBe(false);
		list.scrollTop = 700;
		const second = fireTouch(find('.item'), 'touchmove', { clientX: 0, clientY: 280 });
		expect(second.defaultPrevented).toBe(true);
		fireTouch(find('.item'), 'touchend', { clientX: 0, clientY: 280 });
		wrapper.unmount();
	});

	it('scrollRegExp 额外指定滚动区域', () => {
		const { wrapper, find } = mountContain({ scrollRegExp: () => ({ className: /marked/ }) });
		fakeScroll(find('.marked'), 1000, 300);
		expect(drag(find('.marked'), 300, 100).some(e => e.defaultPrevented)).toBe(false);
		wrapper.unmount();
	});

	it('claim：判定时由调用方接管，之后的 move / end 交给调用方', () => {
		const claim = vi.fn(() => true);
		const move = vi.fn();
		const end = vi.fn();
		const { wrapper, find } = mountContain({ claim, move, end });
		fakeScroll(find('.list'), 1000, 300);

		const moves = drag(find('.item'), 300, 100);
		expect(claim).toHaveBeenCalledTimes(1);
		expect(claim).toHaveBeenCalledWith(expect.objectContaining({ axis: 'y', delta: -100, inside: true }));
		// 能滚的方向也被接管：默认滚动被阻止
		expect(moves.every(e => e.defaultPrevented)).toBe(true);
		expect(move).toHaveBeenLastCalledWith(expect.anything(), expect.anything(), { dx: 0, dy: -200, stepX: 0, stepY: -100 });
		expect(end).toHaveBeenCalledTimes(1);

		// canScroll 按路径上的滚动区域判断；面板外 inside 为 false
		claim.mockImplementation(((context: any) => {
			expect(context.canScroll(-1)).toBe(false);
			expect(context.inside).toBe(false);
			return false;
		}) as any);
		drag(find('.mask'), 300, 100);
		expect(end).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('内层组件已处理的手势跳过；enabled 为 false 或 start 返回 false 时不处理', () => {
		const enabled = ref(true);
		const start = vi.fn(() => true);
		const claim = vi.fn(() => false);
		const { wrapper, find } = mountContain({ enabled: () => enabled.value, start, claim });
		const item = find('.item');

		// 内层组件在 touchmove 上 preventDefault
		const handle = (e: Event) => e.preventDefault();
		item.addEventListener('touchmove', handle);
		drag(item, 100, 300);
		expect(claim).not.toHaveBeenCalled();
		item.removeEventListener('touchmove', handle);

		enabled.value = false;
		expect(drag(find('.mask'), 100, 300).some(e => e.defaultPrevented)).toBe(false);

		enabled.value = true;
		start.mockReturnValue(false as any);
		expect(drag(find('.mask'), 100, 300).some(e => e.defaultPrevented)).toBe(false);
		expect(claim).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it('鼠标：超过阈值后交给 claim，接管后不选中文本、松开后的 click 不触发', async () => {
		const claim = vi.fn(() => true);
		const move = vi.fn();
		const end = vi.fn();
		const { wrapper, find } = mountContain({ claim, move, end });
		const marked = find('.marked');
		const onClick = vi.fn();
		marked.addEventListener('click', onClick);

		fireMouse(marked, 'mousedown', { clientX: 0, clientY: 100 });
		// 抖动不判定
		fireMouse(document, 'mousemove', { clientX: 2, clientY: 102 });
		expect(claim).not.toHaveBeenCalled();
		fireMouse(document, 'mousemove', { clientX: 0, clientY: 160 });
		expect(claim).toHaveBeenCalledWith(expect.objectContaining({ axis: 'y', delta: 60, inside: true }));
		expect(move).toHaveBeenLastCalledWith(expect.any(MouseEvent), expect.anything(), { dx: 0, dy: 60, stepX: -2, stepY: 58 });
		const select = new Event('selectstart', { cancelable: true });
		document.dispatchEvent(select);
		expect(select.defaultPrevented).toBe(true);

		fireMouse(document, 'mouseup', { clientX: 0, clientY: 160 });
		expect(end).toHaveBeenCalledTimes(1);
		marked.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(onClick).not.toHaveBeenCalled();
		const after = new Event('selectstart', { cancelable: true });
		document.dispatchEvent(after);
		expect(after.defaultPrevented).toBe(false);

		// 下一次点击不再被吞掉
		await new Promise(resolve => setTimeout(resolve));
		marked.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(onClick).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('鼠标：没有接管、从输入框或已处理的按下开始时不处理', () => {
		const claim = vi.fn(() => false);
		const move = vi.fn();
		const { wrapper, find } = mountContain({ claim, move });
		const mouseDrag = (el: HTMLElement, prevent = false) => {
			const handle = (e: Event) => e.preventDefault();
			prevent && el.addEventListener('mousedown', handle);
			fireMouse(el, 'mousedown', { clientX: 0, clientY: 100 });
			const e = fireMouse(document, 'mousemove', { clientX: 0, clientY: 200 });
			fireMouse(document, 'mouseup', { clientX: 0, clientY: 200 });
			prevent && el.removeEventListener('mousedown', handle);
			return e;
		};

		// 没有接管：不阻止，也不调用 move
		expect(mouseDrag(find('.marked')).defaultPrevented).toBe(false);
		expect(claim).toHaveBeenCalledTimes(1);
		expect(move).not.toHaveBeenCalled();

		mouseDrag(find('.input'));
		mouseDrag(find('.marked'), true);
		expect(claim).toHaveBeenCalledTimes(1);
		wrapper.unmount();

		// 没有 claim 时鼠标不处理（如 MModal）
		const plain = mountContain();
		expect(mouseDrag(plain.find('.mask')).defaultPrevented).toBe(false);
		plain.wrapper.unmount();
	});
});
