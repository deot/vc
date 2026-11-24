// @vitest-environment jsdom

import { BackTop, MBackTop, Scroller } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { KeepAlive, defineComponent, h, nextTick, ref } from 'vue';
import { vi } from 'vitest';
import { ScrollerManager } from '../../scroller/core/manager';

const root = document.documentElement;

const getButton = () => document.body.querySelector<HTMLButtonElement>('.vc-back-top');

// jsdom 会记住写入的 scrollTop：写入后派发 scroll
const scrollWindow = async (value: number) => {
	root.scrollTop = value;
	window.dispatchEvent(new Event('scroll'));
	await nextTick();
};

const scrollElement = async (el: HTMLElement, value: number) => {
	el.scrollTop = value;
	el.dispatchEvent(new Event('scroll'));
	await nextTick();
};

// jsdom 没有布局：给滚动容器一个在视口内的尺寸
const mockLayout = (el: HTMLElement, rect = { top: 0, left: 0, right: 300, bottom: 100, width: 300, height: 100 }) => {
	vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(1000);
	vi.spyOn(root, 'clientHeight', 'get').mockReturnValue(800);
	vi.spyOn(el, 'clientWidth', 'get').mockReturnValue(rect.width);
	vi.spyOn(el, 'clientHeight', 'get').mockReturnValue(rect.height);
	return vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect as DOMRect);
};

const wrappers: Array<{ unmount: () => void }> = [];
const attach = <T extends { unmount: () => void }>(wrapper: T) => {
	wrappers.push(wrapper);
	return wrapper;
};

beforeEach(() => {
	root.scrollTop = 0;
});

afterEach(() => {
	wrappers.splice(0).forEach(wrapper => wrapper.unmount());
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof BackTop).toBe('object');
		expect(typeof MBackTop).toBe('object');
	});

	it('默认挂到 body，原处留下占位节点；未滚动时隐藏', async () => {
		const wrapper = attach(mount(BackTop, { attachTo: document.body, props: { class: 'custom' } }));
		await nextTick();

		expect(wrapper.find('.vc-back-top__placeholder').exists()).toBe(true);
		const button = getButton()!;
		expect(button.parentElement).toBe(document.body);
		expect(button.tagName).toBe('BUTTON');
		expect(button.getAttribute('type')).toBe('button');
		expect(button.classList.contains('custom')).toBe(true);
		expect(button.classList.contains('is-visible')).toBe(false);
		expect(button.getAttribute('aria-hidden')).toBe('true');
		expect(button.getAttribute('tabindex')).toBe('-1');
		expect(button.getAttribute('aria-label')).toBe('回到顶部');
		expect(button.querySelector('.vc-back-top__icon')).not.toBeNull();
	});

	it('页面滚动超过 visibilityHeight 后显示，v-model 同步', async () => {
		const visible = ref(false);
		attach(mount(() => (
			<BackTop v-model={visible.value} />
		), { attachTo: document.body }));
		await nextTick();

		await scrollWindow(199);
		expect(visible.value).toBe(false);

		await scrollWindow(200);
		expect(visible.value).toBe(true);
		const button = getButton()!;
		expect(button.classList.contains('is-visible')).toBe(true);
		expect(button.hasAttribute('aria-hidden')).toBe(false);
		expect(button.hasAttribute('tabindex')).toBe(false);

		await scrollWindow(0);
		expect(visible.value).toBe(false);
	});

	it('挂载时已滚动则直接显示；visibilityHeight 变化后重新判断', async () => {
		root.scrollTop = 120;
		const wrapper = attach(mount(BackTop, { attachTo: document.body, props: { visibilityHeight: 100 } }));
		await nextTick();
		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);

		await wrapper.setProps({ visibilityHeight: 150 });
		expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([false]);
	});

	it('showProgress：进度写在按钮的 --vc-back-top-progress 上（已滚动 / 可滚动）', async () => {
		vi.spyOn(root, 'scrollHeight', 'get').mockReturnValue(1800);
		vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
		const wrapper = attach(mount(BackTop, { attachTo: document.body }));
		await nextTick();
		const button = getButton()!;
		await scrollWindow(250);
		expect(button.classList.contains('is-progress')).toBe(false);
		expect(button.style.getPropertyValue('--vc-back-top-progress')).toBe('');

		await wrapper.setProps({ showProgress: true });
		expect(button.classList.contains('is-progress')).toBe(true);
		expect(button.style.getPropertyValue('--vc-back-top-progress')).toBe('0.2500');

		await scrollWindow(1000);
		expect(button.style.getPropertyValue('--vc-back-top-progress')).toBe('1.0000');
	});

	it('MBackTop：标记类，数字长度为 750 稿', async () => {
		attach(mount(MBackTop, { attachTo: document.body, props: { right: 32, bottom: '10vh' } }));
		await nextTick();
		const button = getButton()!;
		expect(button.classList.contains('vcm-back-top')).toBe(true);
		expect(button.style.getPropertyValue('--vc-back-top-right')).toBe('calc(var(--vc-rem) * 32)');
		expect(button.style.getPropertyValue('--vc-back-top-bottom')).toBe('10vh');

		// 默认 400（750 稿），--vc-rem 未量到时按 375 宽（1 单位 0.5px）：200px
		await scrollWindow(199);
		expect(button.classList.contains('is-visible')).toBe(false);
		await scrollWindow(200);
		expect(button.classList.contains('is-visible')).toBe(true);
	});

	it('right / bottom / zIndex 写在按钮上；不传时不写，取样式默认值', async () => {
		const wrapper = attach(mount(BackTop, { attachTo: document.body }));
		await nextTick();
		const button = getButton()!;
		expect(button.style.getPropertyValue('--vc-back-top-right')).toBe('');
		expect(button.style.zIndex).toBe('');

		await wrapper.setProps({ right: 24, bottom: 48, zIndex: 9 });
		expect(button.style.getPropertyValue('--vc-back-top-right')).toBe('24px');
		expect(button.style.getPropertyValue('--vc-back-top-bottom')).toBe('48px');
		expect(button.style.zIndex).toBe('9');
	});

	it('点击：发出 click，duration 为 0 时瞬间回到顶部', async () => {
		const wrapper = attach(mount(BackTop, { attachTo: document.body, props: { duration: 0 } }));
		await nextTick();
		await scrollWindow(500);

		getButton()!.click();
		expect(wrapper.emitted('click')).toHaveLength(1);
		expect(root.scrollTop).toBe(0);
	});

	it('点击：平滑滚动到顶部，用户滚动滚轮时停止', async () => {
		// 页面滚动由 scrollIntoView(window) 调用 window.scrollTo，jsdom 未实现：写到根元素上
		vi.spyOn(window, 'scrollTo').mockImplementation(((_x: number, y: number) => {
			root.scrollTop = y;
		}) as typeof window.scrollTo);
		const frames = new Map<number, FrameRequestCallback>();
		let id = 0;
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation((fn) => {
			frames.set(++id, fn);
			return id;
		});
		vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(key => frames.delete(key));
		const flush = (count: number) => {
			for (let i = 0; i < count; i++) {
				const [key, fn] = frames.entries().next().value || [];
				if (!fn) return;
				frames.delete(key!);
				fn(0);
			}
		};

		attach(mount(BackTop, { attachTo: document.body, props: { duration: 300 } }));
		await nextTick();
		await scrollWindow(3000);

		getButton()!.click();
		// 第一步同步写入，之后逐帧
		expect(root.scrollTop).toBeLessThan(3000);
		flush(2);
		const current = root.scrollTop;
		expect(current).toBeGreaterThan(0);

		window.dispatchEvent(new Event('wheel'));
		flush(10);
		expect(root.scrollTop).toBe(current);
	});

	it('系统开启减弱动态效果时瞬间回到顶部', async () => {
		vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
		attach(mount(BackTop, { attachTo: document.body, props: { duration: 300 } }));
		await nextTick();
		await scrollWindow(500);

		getButton()!.click();
		expect(root.scrollTop).toBe(0);
		vi.unstubAllGlobals();
	});

	it('滚动元素：监听元素的滚动，按钮相对其可视区定位', async () => {
		const wrapper = attach(mount(() => (
			<div class="box" style="overflow: auto; height: 100px">
				<div style="height: 1000px" />
				<BackTop visibilityHeight={50} />
			</div>
		), { attachTo: document.body }));
		await nextTick();
		const box = wrapper.find('.box').element as HTMLElement;
		mockLayout(box, { top: 20, left: 10, right: 310, bottom: 120, width: 300, height: 100 });
		// 纵向滚动条占 10px：clientWidth 290
		vi.spyOn(box, 'clientWidth', 'get').mockReturnValue(290);
		vi.spyOn(box, 'offsetWidth', 'get').mockReturnValue(300);
		vi.spyOn(box, 'offsetHeight', 'get').mockReturnValue(100);

		// 页面滚动不影响
		await scrollWindow(500);
		expect(getButton()!.classList.contains('is-visible')).toBe(false);

		await scrollElement(box, 60);
		const button = getButton()!;
		expect(button.classList.contains('is-visible')).toBe(true);
		// 右边：1000 - (10 + 290)；下边：800 - (20 + 100)
		expect(button.style.getPropertyValue('--vc-back-top-inset-right')).toBe('700px');
		expect(button.style.getPropertyValue('--vc-back-top-inset-bottom')).toBe('680px');

		getButton()!.click();
		await nextTick();
		expect(root.scrollTop).toBe(500);
	});

	it('滚动元素离开视口后隐藏', async () => {
		const wrapper = attach(mount(() => (
			<div class="box" style="overflow: auto; height: 100px">
				<BackTop visibilityHeight={10} />
			</div>
		), { attachTo: document.body }));
		await nextTick();
		const box = wrapper.find('.box').element as HTMLElement;
		const rect = mockLayout(box, { top: 20, left: 0, right: 300, bottom: 120, width: 300, height: 100 });

		await scrollElement(box, 20);
		expect(getButton()!.classList.contains('is-visible')).toBe(true);

		// 页面滚动把容器移出视口上方
		rect.mockReturnValue({ top: -200, left: 0, right: 300, bottom: -100, width: 300, height: 100 } as DOMRect);
		await scrollWindow(400);
		expect(getButton()!.classList.contains('is-visible')).toBe(false);
	});

	it('vc Scroller：交给实例的 scrollTo（带 duration），同步自绘滚动条', async () => {
		const wrapper = attach(mount(() => (
			<Scroller height="100px">
				<div style="height: 1000px" />
				<BackTop visibilityHeight={50} />
			</Scroller>
		), { attachTo: document.body }));
		await nextTick();
		const el = wrapper.find('.vc-scroller').element as HTMLElement;
		const instance = ScrollerManager.get(el)!;
		expect(instance).toBeTruthy();
		const scrollTo = vi.spyOn(instance, 'scrollTo');
		mockLayout(el);

		await scrollElement(el, 80);
		expect(getButton()!.classList.contains('is-visible')).toBe(true);

		getButton()!.click();
		expect(scrollTo).toHaveBeenCalledWith({ y: 0, duration: 300 });
	});

	it('portal 为 false：渲染在原处', async () => {
		const wrapper = attach(mount(() => (
			<div class="box">
				<BackTop portal={false} />
			</div>
		), { attachTo: document.body }));
		await nextTick();
		expect(wrapper.find('.box > .vc-back-top').exists()).toBe(true);
		expect(wrapper.find('.vc-back-top__placeholder').exists()).toBe(false);

		await scrollWindow(300);
		expect(wrapper.find('.vc-back-top').classes()).toContain('is-visible');
	});

	it('默认插槽：参数 { visible }', async () => {
		attach(mount(() => (
			<BackTop v-slots={{ default: ({ visible }: { visible: boolean }) => <span class="content">{visible ? 'on' : 'off'}</span> }} />
		), { attachTo: document.body }));
		await nextTick();
		expect(getButton()!.querySelector('.content')!.textContent).toBe('off');
		expect(getButton()!.querySelector('.vc-back-top__icon')).toBeNull();

		await scrollWindow(300);
		expect(getButton()!.querySelector('.content')!.textContent).toBe('on');
	});

	it('KeepAlive 失活时隐藏并停止监听，激活后重新判断', async () => {
		const Page = defineComponent({
			name: 'page',
			setup: () => () => h(BackTop)
		});
		const Other = defineComponent({
			name: 'other',
			setup: () => () => h('div')
		});
		const current = ref<any>(Page);
		attach(mount(() => <KeepAlive>{h(current.value)}</KeepAlive>, { attachTo: document.body }));
		await nextTick();
		await scrollWindow(300);
		expect(getButton()!.classList.contains('is-visible')).toBe(true);

		current.value = Other;
		await nextTick();
		await nextTick();
		expect(getButton()!.classList.contains('is-visible')).toBe(false);
		await scrollWindow(400);
		expect(getButton()!.classList.contains('is-visible')).toBe(false);

		current.value = Page;
		await nextTick();
		await nextTick();
		expect(getButton()!.classList.contains('is-visible')).toBe(true);
	});

	it('refresh：重新查找滚动容器', async () => {
		const wrapper = attach(mount(BackTop, { attachTo: document.body }));
		await nextTick();
		root.scrollTop = 300;
		expect(getButton()!.classList.contains('is-visible')).toBe(false);
		(wrapper.vm as any).refresh();
		await nextTick();
		expect(getButton()!.classList.contains('is-visible')).toBe(true);
	});
});
