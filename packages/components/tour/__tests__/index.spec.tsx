// @vitest-environment jsdom

import { h, nextTick, ref, inject, defineComponent } from 'vue';
import { mount, flushPromises, config } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';
import { Tour, TourStep, MTour, MTourStep, Popover, VcInstance, ModalView, DrawerView } from '@deot/vc-components';
import { zhCN, enUS } from '@deot/vc-locale';
import { useTour } from '../use-tour';
import { props as tourProps } from '../tour-props';
import { TourView, TourPortal } from '../tour-view';

config.global.stubs.transition = false;
config.global.stubs['transition-group'] = false;

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Tour).toBe('object');
		expect(typeof TourStep).toBe('object');
		expect(typeof Tour.open).toBe('function');
		expect(typeof Tour.destroy).toBe('function');
		expect(MTour).toBe(Tour);
		expect(MTourStep).toBe(TourStep);
	});
});

describe('Tour', () => {
	const wrappers: VueWrapper[] = [];
	const originalConfig = VcInstance.options.Tour;
	const originalLocale = VcInstance.options.locale;
	const settle = async () => { await flushPromises(); await Utils.sleep(10); await nextTick(); };
	const create = (options: Parameters<typeof Tour.open>[0] = {}, slots = {}) => {
		const wrapper = mount(Tour, {
			attachTo: document.body, slots,
			props: {
				modelValue: true, animated: false,
				steps: [{ title: '第一步', content: '内容一' }, { title: '第二步', content: '内容二' }], ...options
			}
		});
		wrappers.push(wrapper);
		return wrapper;
	};
	const instance = (wrapper: VueWrapper) => wrapper.vm as any;
	const target = (id = 'tour-target') => {
		const element = document.createElement('button');
		element.id = id;
		element.textContent = '目标';
		element.getBoundingClientRect = () => new DOMRect(100, 100, 100, 40);
		document.body.appendChild(element);
		return element;
	};
	beforeEach(() => VcInstance.configure({ Tour: {}, locale: zhCN }));
	afterEach(async () => {
		Tour.destroy();
		wrappers.splice(0).forEach(wrapper => wrapper.unmount());
		await settle();
		document.body.innerHTML = '';
		VcInstance.configure({ Tour: originalConfig, locale: originalLocale });
	});

	it('静态调用直接创建 TourView，无需 Tour 或 TourStep 收集参数', async () => {
		expect(TourPortal.wrapper).toBe(TourView);
		const leaf = Tour.open({ animated: false, steps: [{ title: '独立弹层' }] });
		await settle();
		expect(leaf.wrapper?.$options.name).toBe('vc-tour-view');
		expect(leaf.wrapper?.$props).not.toHaveProperty('modelValue');
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('独立弹层');
		await leaf.wrapper!.finish();
		expect(await leaf).toEqual({ type: 'finish', current: 0 });
	});

	it.each(['selector', 'element'])('静态调用通过 %s 指定 Portal 容器并完整清理', async (key) => {
		const container = document.createElement('section');
		container.id = 'tour-popup-container';
		document.body.appendChild(container);
		const leaf = Tour.open({
			element: key === 'selector' ? '#tour-popup-container' : container,
			animated: false,
			steps: [{}]
		});
		await settle();
		const root = container.querySelector('.vc-tour');
		expect(root).not.toBeNull();
		expect(leaf.container?.parentElement).toBe(container);
		expect(leaf.container?.contains(root)).toBe(true);
		expect(root?.querySelector('.vc-tour__mask')).not.toBeNull();
		expect(root?.querySelector('.vc-tour__card')).not.toBeNull();
		await leaf.wrapper!.finish();
		expect(await leaf).toEqual({ type: 'finish', current: 0 });
		expect(container.childElementCount).toBe(0);
	});

	it('声明式入口将 getPopupContainer 交给 Portal，卸载时清理整个实例', async () => {
		const container = document.createElement('section');
		document.body.appendChild(container);
		const wrapper = create({ getPopupContainer: () => container });
		await settle();
		expect(container.querySelector('.vc-tour__card')).not.toBeNull();
		expect(container.querySelector('.vc-tour__mask')).not.toBeNull();
		wrapper.unmount();
		wrappers.splice(wrappers.indexOf(wrapper), 1);
		expect(container.childElementCount).toBe(0);
		expect(document.body.style.overflow).toBe('');
	});

	it('声明式入口仅收集参数，modelValue 打开时调用 TourPortal.popup', async () => {
		const popup = vi.spyOn(TourPortal, 'popup');
		const open = vi.spyOn(Tour, 'open');
		try {
			const wrapper = create({ modelValue: false, stagePadding: 20 }, {
				default: () => h(TourStep, { title: '收集的步骤', stagePadding: 0 })
			});
			await settle();
			expect(popup).not.toHaveBeenCalled();
			expect(document.querySelector('.vc-tour')).toBeNull();
			expect(document.body.style.overflow).toBe('');
			expect(await instance(wrapper).next()).toBe(false);
			await wrapper.setProps({ modelValue: true });
			await settle();
			expect(open).not.toHaveBeenCalled();
			expect(popup).toHaveBeenCalledOnce();
			expect(popup.mock.calls[0][0]).toMatchObject({ steps: [{ title: '收集的步骤', stagePadding: 0 }] });
			expect(popup.mock.calls[0][0]).not.toHaveProperty('modelValue');
			expect(popup.mock.results[0].value.wrapper.$options.name).toBe('vc-tour-view');
			expect(wrapper.findComponent(TourView).exists()).toBe(false);
			expect(document.querySelector('.vc-tour__title')?.textContent).toBe('收集的步骤');
			await wrapper.setProps({ modelValue: false });
			await settle();
			expect(wrapper.emitted('close')?.[0][0]).toMatchObject({ source: 'model' });
			expect(popup.mock.results[0].value.wrapper).toBeUndefined();
		} finally {
			popup.mockRestore();
			open.mockRestore();
		}
	});

	it('声明参数和插槽在打开后同步到弹层，不重复创建 Portal', async () => {
		const title = ref('初始标题');
		const text = ref('初始内容');
		const isCustomHeader = ref(true);
		const popup = vi.spyOn(TourPortal, 'popup');
		try {
			const root = mount(defineComponent(() => () => (
				<Tour modelValue animated={false}>
					{{
						default: () => <TourStep title={title.value}><p>{text.value}</p></TourStep>,
						...(isCustomHeader.value ? { header: () => <h3>自定义标题</h3> } : {})
					}}
				</Tour>
			)), { attachTo: document.body });
			wrappers.push(root);
			await settle();
			expect(document.querySelector('.vc-tour__header')?.textContent).toBe('自定义标题');
			expect(document.querySelector('.vc-tour__content')?.textContent).toBe('初始内容');
			title.value = '更新标题';
			text.value = '更新内容';
			isCustomHeader.value = false;
			await settle();
			expect(document.querySelector('.vc-tour__title')?.textContent).toBe('更新标题');
			expect(document.querySelector('.vc-tour__content')?.textContent).toBe('更新内容');
			expect(popup).toHaveBeenCalledOnce();
			await popup.mock.results[0].value.wrapper.close();
		} finally {
			popup.mockRestore();
		}
	});

	it('取消声明式打开检查时销毁 Portal，迟到结果不展示或结算', async () => {
		let release!: () => void;
		const popup = vi.spyOn(TourPortal, 'popup');
		try {
			const wrapper = create({ onOpen: () => new Promise<void>(resolve => release = resolve) });
			await flushPromises();
			const leaf = popup.mock.results[0].value;
			const fulfilled = vi.fn();
			leaf.then(fulfilled);
			await wrapper.setProps({ modelValue: false });
			expect(leaf.wrapper).toBeUndefined();
			release();
			await settle();
			expect(document.querySelector('.vc-tour')).toBeNull();
			expect(wrapper.emitted('ready')).toBeUndefined();
			expect(fulfilled).not.toHaveBeenCalled();
		} finally {
			popup.mockRestore();
		}
	});

	it('静态调用替换声明式引导时，通知原组件并释放其 Portal', async () => {
		const wrapper = create({ steps: [{ title: '声明式引导' }] });
		await settle();
		const leaf = Tour.open({ animated: false, steps: [{ title: '静态引导' }] });
		await settle();
		expect(wrapper.emitted('close')?.[0][0]).toMatchObject({ source: 'replace' });
		expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe(false);
		expect(await instance(wrapper).next()).toBe(false);
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('静态引导');
		await leaf.wrapper!.finish();
		expect(await leaf).toEqual({ type: 'finish', current: 0 });
	});

	it('展示卡片、数字进度和镂空，ready 仅首次，change 仅切步', async () => {
		target();
		const wrapper = create({ steps: [{ element: '#tour-target', title: '第一步' }, { title: '第二步' }] });
		await settle();
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('第一步');
		expect(document.querySelector('.vc-tour__progress')?.textContent).toBe('(1/2)');
		expect(document.querySelector('.vc-tour__shade')?.getAttribute('d')).toContain('Q');
		expect(wrapper.emitted('ready')).toHaveLength(1);
		expect(wrapper.emitted('change')).toBeUndefined();
		expect(await instance(wrapper).next()).toBe(true);
		expect(wrapper.emitted('change')?.[0][0]).toBe(1);
		expect(await instance(wrapper).finish()).toBe(true);
		expect(wrapper.emitted('finish')).toHaveLength(1);
		expect(wrapper.emitted('close')).toHaveLength(1);
		expect(document.body.style.overflow).toBe('');
	});

	it('正文使用 Scroller，标题和自定义页脚在滚动容器外', async () => {
		create({}, {
			header: () => h('strong', '固定标题'),
			content: () => h('p', '长内容'.repeat(200)),
			footer: () => h('button', '固定操作')
		});
		await settle();
		const scroller = document.querySelector<HTMLElement>('.vc-tour__content-container')!;
		const card = document.querySelector<HTMLElement>('.vc-tour__card')!;
		expect(scroller.matches('.vc-scroller.is-hidden')).toBe(true);
		expect(scroller.parentElement).toBe(card);
		expect(scroller.querySelector('.vc-tour__content')?.textContent).toBe('长内容'.repeat(200));
		expect(scroller.querySelector('.vc-tour__header')).toBeNull();
		expect(scroller.querySelector('.vc-tour__footer')).toBeNull();
		expect(card.querySelector('.vc-tour__header')?.textContent).toBe('固定标题');
		expect(card.querySelector('.vc-tour__footer')?.textContent).toBe('固定操作');
		// 无目标时居中，最大宽高由样式限制
		expect(card.classList.contains('is-center')).toBe(true);
		expect(card.style.overflow).not.toBe('auto');
	});

	it('目标步骤限高后仍由正文滚动，切换居中步骤不启用整卡滚动', async () => {
		const element = target();
		const wrapper = create({
			steps: [{ element, content: '长内容'.repeat(200) }, { content: '居中长内容'.repeat(200) }]
		});
		await settle();
		const card = document.querySelector<HTMLElement>('.vc-tour__card')!;
		const container = card.parentElement!;
		// 气泡容器承担 Popover 写入的最大宽高，卡片在其中收缩，由正文 Scroller 滚动
		expect(container.matches('.vc-tour__popover > .vc-popover-wrapper__container')).toBe(true);
		Object.defineProperty(container, 'offsetHeight', { configurable: true, get: () => 1000 });
		await instance(wrapper).refresh();
		expect(container.style.maxHeight).not.toBe('');
		expect(card.style.maxHeight).toBe('');
		expect(card.style.overflow).not.toBe('auto');
		expect(await instance(wrapper).next()).toBe(true);
		const center = document.querySelector<HTMLElement>('.vc-tour__card')!;
		expect(center.classList.contains('is-center')).toBe(true);
		expect(center.querySelector('.vc-tour__content')?.textContent).toBe('居中长内容'.repeat(200));
		expect(center.style.overflow).not.toBe('auto');
		expect(document.querySelector('.vc-popover-wrapper')).toBeNull();
	});

	it('有目标时卡片在根节点内的 Popover 气泡中，方向与箭头透传，显隐由引导控制', async () => {
		const element = target();
		const wrapper = create({ placement: 'right', maskClickBehavior: 'none', steps: [{ element, title: '气泡' }] });
		await settle();
		const root = document.querySelector<HTMLElement>('.vc-tour')!;
		const bubble = root.querySelector<HTMLElement>('.vc-popover-wrapper.vc-tour__popover')!;
		expect(bubble.parentElement).toBe(root);
		expect(bubble.classList.contains('is-right')).toBe(true);
		expect(bubble.querySelector('.vc-tour__card .vc-tour__title')?.textContent).toBe('气泡');
		expect(bubble.querySelector('.vc-popover-wrapper__arrow')).not.toBeNull();

		// 点击蒙层、页面和目标都不关闭气泡
		for (const node of [root.querySelector('.vc-tour__shade')!, document.body, element]) {
			node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			await settle();
		}
		expect(root.querySelector('.vc-tour__popover')).toBe(bubble);
		expect(bubble.style.display).not.toBe('none');

		await wrapper.setProps({ arrow: false });
		await settle();
		expect(root.querySelector('.vc-tour__popover')).toBe(bubble);
		expect(bubble.querySelector('.vc-popover-wrapper__arrow')).toBeNull();
	});

	it('其他 Popover.open 不会替换引导气泡', async () => {
		create({ steps: [{ element: target() }] });
		await settle();
		const other = document.createElement('button');
		document.body.appendChild(other);
		const leaf = Popover.open({ triggerElement: other, content: '其他浮层' });
		await settle();
		expect(document.querySelectorAll('.vc-tour__popover')).toHaveLength(1);
		expect(document.querySelectorAll('.vc-popover-wrapper')).toHaveLength(2);
		leaf.destroy();
	});

	it('切到居中步骤时销毁气泡，切回后重建，焦点始终在卡片', async () => {
		const wrapper = create({ steps: [{ element: target(), title: '目标' }, { title: '居中' }] });
		await settle();
		expect(document.querySelectorAll('.vc-tour__popover')).toHaveLength(1);
		expect(document.activeElement).toBe(document.querySelector('.vc-tour__popover .vc-tour__card'));
		await instance(wrapper).next();
		await settle();
		expect(document.querySelector('.vc-popover-wrapper')).toBeNull();
		expect(document.querySelector('.vc-tour__card.is-center .vc-tour__title')?.textContent).toBe('居中');
		expect(document.activeElement).toBe(document.querySelector('.vc-tour__card.is-center'));
		await instance(wrapper).previous();
		await settle();
		expect(document.querySelector('.vc-tour__card.is-center')).toBeNull();
		expect(document.querySelector('.vc-tour__popover .vc-tour__title')?.textContent).toBe('目标');
		expect(document.activeElement).toBe(document.querySelector('.vc-tour__popover .vc-tour__card'));
	});

	it('结束和强制销毁后不残留气泡', async () => {
		const element = target();
		const wrapper = create({ steps: [{ element }] });
		await settle();
		await instance(wrapper).finish();
		await settle();
		expect(document.querySelector('.vc-popover-wrapper')).toBeNull();
		Tour.open({ animated: false, steps: [{ element }] });
		await settle();
		expect(document.querySelector('.vc-tour__popover')).not.toBeNull();
		Tour.destroy();
		await settle();
		expect(document.querySelector('.vc-popover-wrapper')).toBeNull();
	});

	it('气泡内容与引导在同一 app，可使用 Tour.open 的 install 注入', async () => {
		const Probe = defineComponent(() => {
			const value = inject('tour-probe', '未注入');
			return () => h('span', { class: 'tour-probe' }, value);
		});
		const leaf = Tour.open({
			animated: false,
			install: (app: any) => app.provide('tour-probe', '已注入'),
			steps: [{ element: target(), content: () => h(Probe) }]
		});
		await settle();
		expect(document.querySelector('.vc-tour__popover .tour-probe')?.textContent).toBe('已注入');
		await leaf.wrapper!.close();
	});

	it('气泡与根节点一起挂载，锚点由定位逻辑插入根节点', async () => {
		const added: string[] = [];
		const observer = new MutationObserver(records => records.forEach((record) => {
			if (!(record.target as Element).classList?.contains('vc-tour')) return;
			added.push(...[...record.addedNodes].map(node => (node as Element).className));
		}));
		observer.observe(document.body, { childList: true, subtree: true });
		create({ steps: [{ element: target() }] });
		await settle();
		observer.disconnect();
		const children = [...document.querySelector('.vc-tour')!.children];
		expect(children.some(node => node.classList.contains('vc-tour__anchor'))).toBe(true);
		expect(children.some(node => node.classList.contains('vc-tour__popover'))).toBe(true);
		// 根节点插入文档后只追加了锚点：气泡在首次渲染中挂载，不必等锚点就绪后再渲染一次
		expect(added).toEqual(['vc-tour__anchor']);
	});

	it('高亮切换动画期间只逐帧重绘蒙层，卡片不随之重新渲染', async () => {
		let renders = 0;
		const second = target('second');
		second.getBoundingClientRect = () => new DOMRect(300, 300, 100, 40);
		const wrapper = create({ animated: true, duration: 150, steps: [{ element: target() }, { element: second }] }, {
			content: () => {
				renders++;
				return h('p', '内容');
			}
		});
		await Utils.sleep(400);
		const paths = new Set<string>();
		const observer = new MutationObserver(() => paths.add(document.querySelector('.vc-tour__shade')!.getAttribute('d')!));
		observer.observe(document.querySelector('.vc-tour__mask')!, { attributes: true, subtree: true });
		const before = renders;
		expect(await instance(wrapper).next()).toBe(true);
		await Utils.sleep(300);
		observer.disconnect();
		expect(paths.size).toBeGreaterThan(3);
		expect(renders - before).toBeLessThanOrEqual(3);
	});

	it('引导打开后出现的浮层参与层级计算，传入 zIndex 时不计算', async () => {
		const modal = document.createElement('div');
		modal.className = 'vc-modal';
		modal.style.zIndex = '3000';
		create({ steps: [{ element: target() }] });
		await settle();
		const root = document.querySelector<HTMLElement>('.vc-tour')!;
		expect(root.style.zIndex).toBe('1002');
		document.body.appendChild(modal);
		await Utils.sleep(40);
		expect(root.style.zIndex).toBe('3002');
		modal.remove();
		await Utils.sleep(40);
		expect(root.style.zIndex).toBe('1002');

		Tour.destroy();
		wrappers.splice(0).forEach(wrapper => wrapper.unmount());
		await settle();
		const spy = vi.spyOn(window, 'getComputedStyle');
		try {
			create({ zIndex: 3000, steps: [{ element: target('fixed-layer') }] });
			await settle();
			document.body.appendChild(modal);
			await Utils.sleep(40);
			expect(document.querySelector<HTMLElement>('.vc-tour')!.style.zIndex).toBe('3000');
			expect(spy.mock.calls.some(([node]) => node === modal)).toBe(false);
		} finally {
			spy.mockRestore();
		}
	});

	it('目标滚动后锚点与气泡在同一次更新中跟随', async () => {
		let top = 100;
		const element = target();
		element.getBoundingClientRect = () => new DOMRect(100, top, 100, 40);
		const wrapper = create({ steps: [{ element }] });
		await settle();
		const anchor = document.querySelector<HTMLElement>('.vc-tour__anchor')!;
		const px = (value: string) => parseFloat(value) || 0;
		const { style } = anchor;
		anchor.getBoundingClientRect = () => new DOMRect(px(style.left), px(style.top), px(style.width), px(style.height));
		await instance(wrapper).refresh();
		const bubble = document.querySelector<HTMLElement>('.vc-tour__popover')!;
		expect(anchor.style.top).toBe('90px');
		expect(bubble.style.top).toBe('154px'); // 90 + 60 + 4
		top = 40;
		window.dispatchEvent(new Event('scroll'));
		await Utils.sleep(40);
		expect(anchor.style.top).toBe('30px');
		expect(bubble.style.top).toBe('94px');
	});

	it('父组件内联目标函数与双向模型不会导致声明式步骤递归更新', async () => {
		const active = ref(false);
		const element = ref<HTMLElement>();
		const tour = ref<any>();
		const root = mount(defineComponent(() => () => (
			<div>
				<button ref={element} onClick={() => active.value = true}>打开</button>
				<Tour ref={tour} modelValue={active.value} onUpdate:modelValue={value => active.value = value} animated={false}>
					<TourStep element={() => element.value} title="内联目标" />
				</Tour>
			</div>
		)), { attachTo: document.body });
		wrappers.push(root);
		await root.find('button').trigger('click');
		await settle();
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('内联目标');
		await tour.value!.finish();
		expect(active.value).toBe(false);
	});

	it('TransitionFade 退出完成后才释放滚动锁、恢复焦点并结算 Portal', async () => {
		const opener = target();
		opener.focus();
		const onClose = vi.fn();
		const fulfilled = vi.fn();
		const leaf = Tour.open({ animated: true, duration: 60, steps: [{ title: '淡出引导' }], onClose });
		leaf.then(fulfilled);
		await settle();
		const closing = leaf.wrapper!.close();
		await flushPromises();
		const root = document.querySelector('.vc-tour')!;
		expect(root.classList.contains('vc-transition-fade')).toBe(true);
		expect(root.classList.contains('is-out')).toBe(true);
		expect(document.body.style.overflow).toBe('hidden');
		expect(document.activeElement).not.toBe(opener);
		expect(onClose).not.toHaveBeenCalled();
		expect(fulfilled).not.toHaveBeenCalled();
		expect(await closing).toBe(true);
		expect(await leaf).toEqual({ type: 'close', current: 0 });
		expect(document.querySelector('.vc-tour')).toBeNull();
		expect(document.body.style.overflow).toBe('');
		expect(document.activeElement).toBe(opener);
		expect(onClose).toHaveBeenCalledOnce();
	});

	it.each([[false, 1000], [true, 0]])('animated=%s、duration=%s 时不等待动画', async (animated, duration) => {
		const wrapper = create({ animated, duration });
		await settle();
		const completed = vi.fn();
		const closing = instance(wrapper).close().then(completed);
		await settle();
		expect(completed).toHaveBeenCalledWith(true);
		await closing;
		expect(document.querySelector('.vc-tour')).toBeNull();
	});

	it('退出动画期间强制销毁，取消关闭等待且不结算 Portal', async () => {
		const onClose = vi.fn();
		const fulfilled = vi.fn();
		const leaf = Tour.open({ animated: true, duration: 30, steps: [{}], onClose });
		leaf.then(fulfilled);
		await settle();
		const closing = leaf.wrapper!.close();
		await flushPromises();
		leaf.destroy();
		expect(await closing).toBe(false);
		await Utils.sleep(40);
		expect(onClose).not.toHaveBeenCalled();
		expect(fulfilled).not.toHaveBeenCalled();
		expect(document.querySelector('.vc-tour')).toBeNull();
		expect(document.body.style.overflow).toBe('');
	});

	it('已在退出的引导被替换时，复用退出完成通知并只结束一次', async () => {
		const onClose = vi.fn();
		const first = Tour.open({ animated: true, duration: 60, steps: [{ title: '旧引导' }], onClose });
		await settle();
		const closing = first.wrapper!.close();
		await flushPromises();
		const newer = Tour.open({ animated: false, steps: [{ title: '新引导' }] });
		expect(await closing).toBe(false);
		expect(await first).toEqual({ type: 'close', current: 0 });
		await settle();
		expect(onClose).toHaveBeenCalledOnce();
		expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ source: 'replace' }));
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('新引导');
		await newer.wrapper!.close();
	});

	it('静态单对象支持 Portal 注入、插槽、事件和结果', async () => {
		const install = vi.fn();
		const close = vi.fn();
		const destroyed = vi.fn();
		const leaf = Tour.open({
			modelValue: false, animated: false, steps: [{ title: '静态' }], install, onClose: close, onDestroyed: destroyed,
			slots: { content: () => h('strong', '静态插槽') }
		});
		await settle();
		expect(install).toHaveBeenCalledOnce();
		expect(document.querySelector('strong')?.textContent).toBe('静态插槽');
		await leaf.wrapper!.finish();
		expect(await leaf).toEqual({ type: 'finish', current: 0 });
		expect(close).toHaveBeenCalledOnce();
		await settle();
		expect(destroyed).toHaveBeenCalledOnce();
	});

	it('声明式步骤优先，继承假值和插槽，关闭只通知当前步骤', async () => {
		const firstClose = vi.fn();
		const secondClose = vi.fn();
		const wrapper = create({ closable: false, mask: false, previousText: false, nextText: '' }, {
			default: () => [
				h(TourStep, { title: '声明步骤', onClose: firstClose }, { default: () => h('b', '步骤内容') }),
				h(TourStep, { title: '另一步', onClose: secondClose })
			],
			content: () => '根内容'
		});
		await settle();
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('声明步骤');
		expect(document.querySelector('.vc-tour__content')?.textContent).toBe('步骤内容');
		expect(document.querySelector('.vc-tour__shade')).toBeNull();
		expect(document.querySelector('.vc-tour__close')).toBeNull();
		await instance(wrapper).skip();
		expect(firstClose).toHaveBeenCalledOnce();
		expect(secondClose).not.toHaveBeenCalled();
	});

	it.each([['二', '一'], ['三', '一', '二']])('声明式步骤重排或插入后使用模板顺序：%s', async (...order) => {
		const titles = ref(['一', '二']);
		const active = ref(false);
		const tour = ref<any>();
		const root = mount(defineComponent(() => () => (
			<Tour ref={tour} modelValue={active.value} animated={false}>
				{titles.value.map(title => <TourStep key={title} title={title} />)}
			</Tour>
		)), { attachTo: document.body });
		wrappers.push(root);
		await settle();
		titles.value = order;
		await settle();
		active.value = true;
		await settle();
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe(order[0]);
		await tour.value!.goTo(1);
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe(order[1]);
	});

	it('步骤显式 false 和 0 覆盖根配置，图文函数与 footer 插槽', async () => {
		create({ steps: [{ arrow: false, closable: false, stagePadding: 0, content: () => h('i', '函数内容') }] }, {
			footer: ({ finish }) => h('button', { onClick: finish }, '完成')
		});
		await settle();
		expect(document.querySelector('.vc-tour__close')).toBeNull();
		expect(document.querySelector('i')?.textContent).toBe('函数内容');
		expect(document.querySelector('.vc-tour__footer')?.textContent).toBe('完成');
	});

	it.each(['false', 'reject', 'throw'])('操作 %s 时留在当前步并允许重试', async (mode) => {
		const onClick = vi.fn((): unknown => {
			if (mode === 'throw') throw new Error('失败');
			if (mode === 'reject') return Promise.reject(new Error('失败'));
			return false;
		});
		const wrapper = create({ nextButtonOptions: { onClick } });
		await settle();
		expect(await instance(wrapper).next()).toBe(false);
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('第一步');
		if (mode !== 'false') expect(wrapper.emitted('error')?.[0][0]).toMatchObject({ phase: 'action' });
		onClick.mockImplementation(() => true);
		expect(await instance(wrapper).next()).toBe(true);
	});

	it('异步期间阻止重复操作和关闭，goTo 不执行按钮回调', async () => {
		let release!: (value: boolean) => void;
		const onClick = vi.fn(() => new Promise<boolean>(resolve => release = resolve));
		const wrapper = create({ nextButtonOptions: { onClick } });
		await settle();
		const isMoving = instance(wrapper).next();
		expect(await instance(wrapper).next()).toBe(false);
		expect(await instance(wrapper).close()).toBe(false);
		release(false);
		await isMoving;
		expect(await instance(wrapper).goTo(1)).toBe(true);
		expect(onClick).toHaveBeenCalledOnce();
	});

	it('异步操作期间拒绝 modelValue 关闭并回写，操作结束后允许关闭', async () => {
		const isActive = ref(true);
		const tour = ref<any>();
		let release!: (value: boolean) => void;
		const onClick = () => new Promise<boolean>(resolve => release = resolve);
		const root = mount(defineComponent(() => () => (
			<Tour
				ref={tour}
				modelValue={isActive.value}
				onUpdate:modelValue={value => isActive.value = value}
				animated={false}
				nextButtonOptions={{ onClick }}
				steps={[{ title: '第一步' }, { title: '第二步' }]}
			/>
		)), { attachTo: document.body });
		wrappers.push(root);
		await settle();
		const isMoving = tour.value!.next();
		isActive.value = false;
		await settle();
		expect(isActive.value).toBe(true);
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('第一步');
		expect(document.body.style.overflow).toBe('hidden');
		release(false);
		expect(await isMoving).toBe(false);
		isActive.value = false;
		await settle();
		expect(document.querySelector('.vc-tour')).toBeNull();
		expect(document.body.style.overflow).toBe('');
	});

	it('异步操作禁止外部 current 导航时，同步回实际下标', async () => {
		const current = ref(0);
		const tour = ref<any>();
		let release!: (value: boolean) => void;
		const onClick = () => new Promise<boolean>(resolve => release = resolve);
		const root = mount(defineComponent(() => () => (
			<Tour
				ref={tour}
				modelValue
				current={current.value}
				onUpdate:current={value => current.value = value}
				animated={false}
				nextButtonOptions={{ onClick }}
				steps={[{ title: '一' }, { title: '二' }, { title: '三' }]}
			/>
		)), { attachTo: document.body });
		wrappers.push(root);
		await settle();
		const isMoving = tour.value!.next();
		current.value = 2;
		await settle();
		expect(current.value).toBe(0);
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('一');
		release(false);
		expect(await isMoving).toBe(false);
		current.value = 2;
		await settle();
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('三');
	});

	it('真实按钮点击仅执行一次操作回调，并保留原生事件和按钮属性', async () => {
		const onClick = vi.fn(async () => true);
		const wrapper = create({ nextButtonOptions: { onClick, class: 'tour-next', wait: 0 } });
		await settle();
		document.querySelector<HTMLButtonElement>('.tour-next')!.click();
		await settle();
		expect(onClick).toHaveBeenCalledOnce();
		expect(onClick.mock.calls[0]).toEqual([expect.any(MouseEvent), expect.objectContaining({ current: 0, next: 1, source: 'button' })]);
		expect(wrapper.emitted('change')?.[0][0]).toBe(1);
	});

	it('外部 current 更新切步，modelValue 关闭', async () => {
		const wrapper = create();
		await settle();
		await wrapper.setProps({ current: 1 });
		await settle();
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('第二步');
		await wrapper.setProps({ modelValue: false });
		await settle();
		expect(wrapper.emitted('close')?.[0][0]).toMatchObject({ source: 'model' });
	});

	it('全局与实例打开检查顺序，拒绝不展示、不持锁', async () => {
		const order: string[] = [];
		VcInstance.configure({ Tour: { onOpen: () => { order.push('global'); } } });
		const leaf = Tour.open({ steps: [{ title: '测试' }], onOpen: () => { order.push('instance'); return false; } });
		expect(await leaf).toEqual({ type: 'blocked', current: null });
		expect(order).toEqual(['global', 'instance']);
		expect(document.querySelector('.vc-tour')).toBeNull();
		expect(document.body.style.overflow).toBe('');
	});

	it.each(['throw', 'reject'])('打开检查%s时通知 error 并阻止打开', async (mode) => {
		const error = new Error('open');
		const onError = vi.fn();
		const leaf = Tour.open({
			steps: [{ title: '测试' }],
			onOpen: () => {
				if (mode === 'throw') throw error;
				return Promise.reject(error);
			},
			onError
		});
		expect(await leaf).toEqual({ type: 'blocked', current: null });
		expect(onError).toHaveBeenCalledWith({ error, phase: 'open', current: 0 });
		expect(document.querySelector('.vc-tour')).toBeNull();
		expect(document.body.style.overflow).toBe('');
	});

	it.each(['finish', 'skip'] as const)('默认页面缓存记录 %s，后续同 key 不展示', async (action) => {
		const key = `tour-${action}`;
		const leaf = Tour.open({ animated: false, cache: key, steps: [{ title: key }] });
		await settle();
		await leaf.wrapper![action]();
		await leaf;
		const cached = Tour.open({ cache: key, steps: [{ title: key }] });
		expect(await cached).toEqual({ type: 'cached', current: null });
	});

	it('默认提前关闭不缓存，cacheTypes 可以缓存 close', async () => {
		const setter = vi.fn();
		VcInstance.configure({ Tour: { setCache: setter } });
		const wrapper = create({ cache: 'close-key' });
		await settle();
		await instance(wrapper).close();
		expect(setter).not.toHaveBeenCalled();
		const second = create({ cache: 'close-key', cacheTypes: ['close'] });
		await settle();
		await instance(second).close();
		expect(setter).toHaveBeenCalledWith({ cacheKey: 'close-key', type: 'close' });
	});

	it('全局关闭和实例 false 均跳过缓存读写', async () => {
		const getter = vi.fn(() => true);
		const setter = vi.fn();
		VcInstance.configure({ Tour: { cache: false, getCache: getter, setCache: setter } });
		const wrapper = create({ cache: 'global-disabled' });
		await settle();
		await instance(wrapper).finish();
		expect(getter).not.toHaveBeenCalled();
		expect(setter).not.toHaveBeenCalled();
		VcInstance.configure({ Tour: { getCache: getter } });
		create({ cache: false });
		await settle();
		expect(getter).not.toHaveBeenCalled();
	});

	it('缓存失败通知错误，仍然展示和结束', async () => {
		VcInstance.configure({ Tour: { getCache: async () => { throw new Error('读'); }, setCache: async () => { throw new Error('写'); } } });
		const wrapper = create({ cache: 'failure-key' });
		await settle();
		expect(document.querySelector('.vc-tour')).not.toBeNull();
		await instance(wrapper).finish();
		expect(wrapper.emitted('error')?.map(args => (args[0] as any).phase)).toEqual(['getCache', 'setCache']);
		expect(wrapper.emitted('finish')).toHaveLength(1);
	});

	it('新引导检查通过才替换，缓存命中不影响当前引导', async () => {
		const first = Tour.open({ animated: false, steps: [{ title: '旧引导' }] });
		await settle();
		const blocked = Tour.open({ steps: [{ title: '被阻止' }], onOpen: () => false });
		await blocked;
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('旧引导');
		const setter = vi.fn();
		VcInstance.configure({ Tour: { setCache: setter } });
		const second = Tour.open({ animated: false, steps: [{ title: '新引导' }] });
		await settle();
		expect(await first).toEqual({ type: 'close', current: 0 });
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('新引导');
		expect(setter).not.toHaveBeenCalled();
		await second.wrapper!.close();
	});

	it('较旧的异步打开不能覆盖新引导', async () => {
		let release!: () => void;
		const older = Tour.open({ steps: [{ title: '较旧' }], onOpen: () => new Promise<void>(resolve => release = resolve) });
		const newer = Tour.open({ animated: false, steps: [{ title: '较新' }] });
		await settle();
		release();
		expect(await older).toEqual({ type: 'blocked', current: null });
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('较新');
		await newer.wrapper!.close();
	});

	it('替换期间重新等待初始目标，迟到结果不能覆盖更新的引导', async () => {
		const first = Tour.open({ animated: true, duration: 60, steps: [{ title: '当前引导' }] });
		await settle();
		const waiting = create({ current: 0, steps: [{ title: '候选引导' }, { element: '#replacement-delayed', waitForElement: 200 }] });
		await flushPromises();
		expect(document.querySelector('.vc-tour')?.classList.contains('is-out')).toBe(true);
		await waiting.setProps({ current: 1 });
		await first;
		await flushPromises();
		const newest = Tour.open({ animated: false, steps: [{ title: '更新的引导' }] });
		await settle();
		target('replacement-delayed');
		await settle();
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('更新的引导');
		expect(waiting.emitted('update:modelValue')?.[0][0]).toBe(false);
		expect(waiting.emitted('ready')).toBeUndefined();
		await newest.wrapper!.close();
	});

	it('已被替换的定位请求不能在退出动画期间通知 ready', async () => {
		let release!: () => void;
		let controller!: ReturnType<typeof useTour>;
		const emit = vi.fn();
		const root = mount(defineComponent({
			props: tourProps,
			setup(props) {
				controller = useTour(props, emit, () => new Promise<void>(resolve => release = resolve));
				return () => null;
			}
		}), { props: { modelValue: true, duration: 60, steps: [{}] } });
		wrappers.push(root);
		await flushPromises();
		const newer = Tour.open({ animated: false, steps: [{ title: '新引导' }] });
		await flushPromises();
		expect(controller.isActive.value && controller.isLeaving.value).toBe(true);
		release();
		await flushPromises();
		expect(emit.mock.calls.some(([event]) => event === 'ready')).toBe(false);
		controller.handleAfterLeave();
		await settle();
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('新引导');
		await newer.wrapper!.close();
	});

	it('等待目标出现前不显示，出现后 ready', async () => {
		const wrapper = create({ steps: [{ element: '#delayed', waitForElement: 100 }] });
		await flushPromises();
		expect(document.querySelector('.vc-tour')).toBeNull();
		expect(document.body.style.overflow).toBe('');
		target('delayed');
		await settle();
		expect(wrapper.emitted('ready')?.[0][0]).toMatchObject({ element: document.querySelector('#delayed') });
	});

	it('初始等待中更新 current，取消旧目标等待并展示最新步骤', async () => {
		const onOpen = vi.fn();
		const wrapper = create({ current: 0, onOpen, steps: [{ element: '#obsolete-target', waitForElement: 200 }, { title: '最新步骤' }] });
		await flushPromises();
		await wrapper.setProps({ current: 1 });
		await settle();
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('最新步骤');
		target('obsolete-target');
		await settle();
		expect(wrapper.emitted('ready')).toHaveLength(1);
		expect(wrapper.emitted('ready')?.[0][0]).toMatchObject({ current: 1, element: null });
		expect(wrapper.emitted('change')).toBeUndefined();
		expect(onOpen).toHaveBeenCalledOnce();
	});

	it('取消初始等待后迟到目标不展示，超时目标居中并可重新定位', async () => {
		const cancelled = create({ steps: [{ element: '#late-cancelled', waitForElement: 80 }] });
		await flushPromises();
		await cancelled.setProps({ modelValue: false });
		target('late-cancelled');
		await settle();
		expect(cancelled.emitted('ready')).toBeUndefined();
		expect(document.body.style.overflow).toBe('');
		const wrapper = create({ steps: [{ element: '#after-timeout', waitForElement: 10 }] });
		await Utils.sleep(25);
		await settle();
		expect(wrapper.emitted('ready')?.[0][0]).toMatchObject({ element: null });
		const element = target('after-timeout');
		await settle();
		expect(document.querySelector('.vc-tour__shade')?.getAttribute('d')).toContain('Q');
		element.remove();
		await settle();
		expect(document.querySelector('.vc-tour__shade')?.getAttribute('d')).not.toContain('Q');
		expect(wrapper.emitted('change')).toBeUndefined();
	});

	it('已展示目标被移除时跳过，初始尾部全缺失仍选择前面的有效步骤', async () => {
		const element = target();
		const wrapper = create({ skipMissingElement: true, steps: [{ element }, { title: '后续步骤' }] });
		await settle();
		element.remove();
		await settle();
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('后续步骤');
		expect(wrapper.emitted('change')).toHaveLength(1);
		await instance(wrapper).close();
		const leaf = Tour.open({ animated: false, current: 1, skipMissingElement: true, steps: [{ title: '有效步骤' }, { element: '#missing' }] });
		await settle();
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('有效步骤');
		await leaf.wrapper!.finish();
		expect(await leaf).toEqual({ type: 'finish', current: 0 });
	});

	it('响应式目标函数变化后重新查找定位，不触发切步事件', async () => {
		const first = target('first-live-target');
		const second = target('second-live-target');
		second.getBoundingClientRect = () => new DOMRect(300, 200, 80, 30);
		const isTarget = ref(first);
		const wrapper = create({ steps: [{ element: () => isTarget.value }] });
		await settle();
		expect(wrapper.emitted('ready')?.[0][0]).toMatchObject({ element: first });
		isTarget.value = second;
		await settle();
		expect(document.querySelector('.vc-tour__shade')?.getAttribute('d')).toContain('M295,190');
		expect(wrapper.emitted('change')).toBeUndefined();
	});

	it('目标和祖先仅改变样式时跟踪位置，卡片自身变更不反复查找目标', async () => {
		const parent = document.createElement('div');
		document.body.appendChild(parent);
		const element = target();
		parent.appendChild(element);
		element.getBoundingClientRect = () => new DOMRect(parseFloat(element.style.left) || parseFloat(parent.style.left) || 100, 100, 100, 40);
		const lookup = vi.fn(() => element);
		const wrapper = create({ steps: [{ element: lookup }] });
		await settle();
		parent.style.left = '200px';
		await Utils.sleep(30);
		expect(document.querySelector('.vc-tour__shade')?.getAttribute('d')).toContain('M195,90');
		element.style.left = '300px';
		await Utils.sleep(30);
		expect(document.querySelector('.vc-tour__shade')?.getAttribute('d')).toContain('M295,90');
		lookup.mockClear();
		document.querySelector<HTMLElement>('.vc-tour__card')!.style.color = 'red';
		await Utils.sleep(30);
		expect(lookup).not.toHaveBeenCalled();
		expect(wrapper.emitted('change')).toBeUndefined();
	});

	it.each(['selector', 'function'])('%s 属性变化后发现或替换目标，不触发切步事件', async (mode) => {
		const first = target('selector-first');
		const second = target('selector-second');
		second.getBoundingClientRect = () => new DOMRect(300, 200, 80, 30);
		const element = mode === 'selector' ? '.current-tour-target' : () => document.querySelector<HTMLElement>('.current-tour-target');
		const wrapper = create({ steps: [{ element }] });
		await settle();
		expect(document.querySelector('.vc-tour__shade')?.getAttribute('d')).not.toContain('Q');
		first.className = 'current-tour-target';
		await settle();
		expect(document.querySelector('.vc-tour__shade')?.getAttribute('d')).toContain('M95,90');
		first.className = '';
		second.className = 'current-tour-target';
		await settle();
		expect(document.querySelector('.vc-tour__shade')?.getAttribute('d')).toContain('M295,190');
		expect(wrapper.emitted('change')).toBeUndefined();
	});

	it('尚未挂载的 DOM 目标连接后重新定位', async () => {
		const element = target();
		element.remove();
		create({ steps: [{ element }] });
		await settle();
		expect(document.querySelector('.vc-tour__shade')?.getAttribute('d')).not.toContain('Q');
		document.body.appendChild(element);
		await settle();
		expect(document.querySelector('.vc-tour__shade')?.getAttribute('d')).toContain('M95,90');
	});

	it('缺失目标居中、主动无目标不跳过；全部跳过返回 empty', async () => {
		const wrapper = create({ skipMissingElement: true, steps: [{ title: '居中' }, { element: '#missing' }] });
		await settle();
		expect(wrapper.emitted('ready')?.[0][0]).toMatchObject({ current: 0, element: null });
		await instance(wrapper).close();
		const leaf = Tour.open({ skipMissingElement: true, steps: [{ element: '#missing' }] });
		expect(await leaf).toEqual({ type: 'empty', current: null });
	});

	it('后续全部缺失执行完成回调并按 finish 缓存', async () => {
		const finish = vi.fn(() => true);
		const setter = vi.fn();
		VcInstance.configure({ Tour: { setCache: setter } });
		const wrapper = create({
			cache: 'last-reachable', skipMissingElement: true, finishButtonOptions: { onClick: finish },
			steps: [{ title: '有效' }, { element: '#missing', waitForElement: 10 }]
		});
		await settle();
		expect(await instance(wrapper).next()).toBe(true);
		expect(finish).toHaveBeenCalledOnce();
		expect(setter).toHaveBeenCalledWith({ cacheKey: 'last-reachable', type: 'finish' });
	});

	it('目标点击保留原行为并推进，禁止交互时不推进', async () => {
		const element = target();
		const original = vi.fn((event: Event) => event.stopPropagation());
		element.addEventListener('click', original);
		const wrapper = create({ advanceOnClick: true, steps: [{ element }, { title: '第二步' }] });
		await settle();
		element.click();
		await settle();
		expect(original).toHaveBeenCalledOnce();
		expect(wrapper.emitted('change')).toHaveLength(1);
		await instance(wrapper).close();
		const disabled = create({ advanceOnClick: true, disableActiveInteraction: true, steps: [{ element }, {}] });
		await settle();
		element.click();
		await settle();
		expect(disabled.emitted('change')).toBeUndefined();
		expect(document.querySelector('.vc-tour__blocker')).not.toBeNull();
	});

	it('关闭蒙层时，高亮动画期间仍阻挡新目标的真实位置', async () => {
		const first = target('animation-first');
		const second = target('animation-second');
		second.getBoundingClientRect = () => new DOMRect(300, 200, 80, 30);
		const wrapper = create({
			mask: false, animated: true, duration: 30, disableActiveInteraction: true,
			steps: [{ element: first }, { element: second }]
		});
		await settle();
		await instance(wrapper).next();
		const blocker = document.querySelector('.vc-tour__blocker')!;
		expect(blocker.getAttribute('x')).toBe('290');
		expect(blocker.getAttribute('y')).toBe('190');
		expect(blocker.getAttribute('width')).toBe('100');
		await instance(wrapper).close();
	});

	it('动画未结束时关闭动画并重新打开，同一目标仍正确镂空', async () => {
		const animation = vi.spyOn(globalThis, 'requestAnimationFrame').mockReturnValue(1);
		try {
			const first = target('reopen-first');
			const second = target('reopen-second');
			second.getBoundingClientRect = () => new DOMRect(300, 200, 80, 30);
			const wrapper = create({ animated: true, duration: 1000, steps: [{ element: first }, { element: second }] });
			await settle();
			await instance(wrapper).next();
			await wrapper.setProps({ animated: false, current: 1 });
			await instance(wrapper).close();
			await wrapper.setProps({ modelValue: false });
			await wrapper.setProps({ modelValue: true });
			await settle();
			expect(document.querySelector('.vc-tour__shade')?.getAttribute('d')).toContain('M295,190');
		} finally {
			animation.mockRestore();
		}
	});

	it('目标原有点击销毁实例后，不执行排队的推进回调', async () => {
		const element = target();
		const onClick = vi.fn();
		const leaf = Tour.open({ animated: false, advanceOnClick: true, nextButtonOptions: { onClick }, steps: [{ element }, {}] });
		await settle();
		element.addEventListener('click', () => leaf.destroy(), { once: true });
		element.click();
		await settle();
		expect(onClick).not.toHaveBeenCalled();
		expect(document.querySelector('.vc-tour')).toBeNull();
	});

	it('切步与动态禁止目标交互时焦点回到卡片，结束恢复打开前焦点', async () => {
		const element = target();
		element.focus();
		const wrapper = create({ steps: [{ element }, { title: '居中' }] });
		await settle();
		element.focus();
		expect(document.activeElement).toBe(element);
		await wrapper.setProps({ disableActiveInteraction: true });
		await settle();
		expect(document.activeElement).toBe(document.querySelector('.vc-tour__card'));
		await wrapper.setProps({ disableActiveInteraction: false });
		element.focus();
		await instance(wrapper).next();
		await settle();
		expect(document.activeElement).toBe(document.querySelector('.vc-tour__card'));
		await instance(wrapper).close();
		expect(document.activeElement).toBe(element);
	});

	it('Tab 在卡片与可交互目标间循环，禁止目标交互时仅保留卡片', async () => {
		const element = target();
		const wrapper = create({ closable: false, steps: [{ element }, {}] });
		await settle();
		const buttons = [...document.querySelectorAll<HTMLButtonElement>('.vc-tour__card button')];
		for (const node of [...buttons, element]) {
			node.getClientRects = () => [new DOMRect(0, 0, 100, 40)] as unknown as DOMRectList;
		}
		const tab = (shiftKey = false) => {
			const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true });
			document.activeElement!.dispatchEvent(event);
			return event;
		};
		element.focus();
		expect(tab().defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(buttons[0]);
		tab(true);
		expect(document.activeElement).toBe(element);
		await wrapper.setProps({ disableActiveInteraction: true });
		await settle();
		tab(true);
		expect(document.activeElement).toBe(buttons.at(-1));
		tab();
		expect(document.activeElement).toBe(buttons[0]);
		await wrapper.setProps({ mask: false });
		expect(tab().defaultPrevented).toBe(false);
	});

	it('卡片内打开的子弹层（含嵌套）保留焦点，外部弹层仍回到卡片', async () => {
		const outside = target('outside');
		create({ steps: [{ element: target() }] }, {
			content: () => h('button', { class: 'tour-popup-trigger' }, '打开')
		});
		await settle();
		const card = document.querySelector<HTMLElement>('.vc-tour__card')!;
		const open = (name: string, triggerElement: Element) => Popover.open({ name, triggerElement, content: () => h('input', { class: name }) });
		const leafs = [open('card-popup', card.querySelector('.tour-popup-trigger')!)];
		await settle();
		const input = document.querySelector<HTMLInputElement>('.card-popup')!;
		leafs.push(open('nested-popup', input), open('outside-popup', outside));
		await settle();
		for (const name of ['card-popup', 'nested-popup']) {
			const node = document.querySelector<HTMLInputElement>(`.${name}`)!;
			node.focus();
			expect(document.activeElement).toBe(node);
		}
		document.querySelector<HTMLInputElement>('.outside-popup')!.focus();
		expect(document.activeElement).toBe(card);
		leafs.forEach(leaf => leaf.destroy());
	});

	it('目标打开的子弹层保留焦点，禁止目标交互时回到卡片', async () => {
		const element = target();
		const wrapper = create({ steps: [{ element }] });
		await settle();
		const leaf = Popover.open({ name: 'element-popup', triggerElement: element, content: () => h('input', { class: 'element-popup' }) });
		await settle();
		const input = document.querySelector<HTMLInputElement>('.element-popup')!;
		input.focus();
		expect(document.activeElement).toBe(input);
		await wrapper.setProps({ disableActiveInteraction: true });
		await settle();
		input.focus();
		expect(document.activeElement).toBe(document.querySelector('.vc-tour__card'));
		leaf.destroy();
	});

	it('子弹层内 Tab 按触发节点的位置继续，ESC 先回到触发控件，左右键不切步', async () => {
		const wrapper = create({ closable: false, steps: [{ element: target() }, {}] }, {
			// 触发节点是包裹控件的容器（如 Select 内的 Popover），本身不可聚焦
			content: () => [
				h('button', { class: 'before-trigger' }, '前'),
				h('span', { class: 'popup-trigger' }, [h('button', { class: 'trigger-control' }, '打开')]),
				h('button', { class: 'after-trigger' }, '后')
			]
		});
		await settle();
		const card = document.querySelector<HTMLElement>('.vc-tour__card')!;
		const trigger = card.querySelector<HTMLElement>('.trigger-control')!;
		const leaf = Popover.open({
			name: 'keyboard-popup',
			triggerElement: card.querySelector('.popup-trigger')!,
			content: () => h('div', [h('input', { class: 'popup-input' }), h('button', { class: 'popup-option' }, '选项')])
		});
		await settle();
		for (const node of document.querySelectorAll<HTMLElement>('.vc-tour__card button, .popup-input, .popup-option')) {
			node.getClientRects = () => [new DOMRect(0, 0, 100, 40)] as unknown as DOMRectList;
		}
		const press = (key: string, shiftKey = false) => {
			const event = new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true });
			document.activeElement!.dispatchEvent(event);
			return event;
		};
		const input = document.querySelector<HTMLInputElement>('.popup-input')!;
		input.focus();
		expect(press('Tab').defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(card.querySelector('.after-trigger'));
		input.focus();
		press('Tab', true);
		expect(document.activeElement).toBe(trigger);

		document.querySelector<HTMLButtonElement>('.popup-option')!.focus();
		expect(press('ArrowRight').defaultPrevented).toBe(false);
		await settle();
		expect(wrapper.emitted('change')).toBeUndefined();

		input.focus();
		expect(press('Escape').defaultPrevented).toBe(true);
		await settle();
		expect(document.querySelector('.vc-tour')).not.toBeNull();
		expect(document.activeElement).toBe(trigger);
		press('Escape');
		await settle();
		expect(document.querySelector('.vc-tour')).toBeNull();
		expect(wrapper.emitted('close')?.[0][0]).toMatchObject({ source: 'esc' });
		leaf.destroy();
	});

	it('advanceOnClick 时点击目标打开的子弹层不推进', async () => {
		const element = target();
		create({ advanceOnClick: true, steps: [{ element, title: '第一步' }, { title: '第二步' }] });
		await settle();
		const leaf = Popover.open({ name: 'element-popup', triggerElement: element, content: () => h('button', { class: 'element-popup' }) });
		await settle();
		document.querySelector<HTMLButtonElement>('.element-popup')!.click();
		await settle();
		expect(document.querySelector('.vc-tour__title')?.textContent).toBe('第一步');
		leaf.destroy();
	});

	it('没有可聚焦内容时 Tab 保留卡片焦点，关闭与卸载释放键盘和焦点约束', async () => {
		const outside = target('outside');
		const wrapper = create({ closable: false, footer: false });
		await settle();
		const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
		document.dispatchEvent(tab);
		expect(tab.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(document.querySelector('.vc-tour__card'));
		await instance(wrapper).close();
		outside.focus();
		expect(document.activeElement).toBe(outside);
		const afterClose = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		document.dispatchEvent(afterClose);
		expect(afterClose.defaultPrevented).toBe(false);
		await wrapper.setProps({ modelValue: false });
		await wrapper.setProps({ modelValue: true });
		await settle();
		wrapper.unmount();
		wrappers.splice(wrappers.indexOf(wrapper), 1);
		outside.focus();
		expect(document.activeElement).toBe(outside);
		const afterUnmount = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
		document.dispatchEvent(afterUnmount);
		expect(afterUnmount.defaultPrevented).toBe(false);
	});

	it('强制卸载后恢复打开前焦点，不被仍在清理的焦点约束拦截', async () => {
		const opener = target('opener');
		opener.focus();
		const wrapper = create();
		await settle();
		expect(document.activeElement).toBe(document.querySelector('.vc-tour__card'));
		wrapper.unmount();
		wrappers.splice(wrappers.indexOf(wrapper), 1);
		expect(document.activeElement).toBe(opener);
	});

	it('替换当前引导后结束，仍恢复最初打开前的焦点', async () => {
		const opener = target('replacement-opener');
		opener.focus();
		const first = Tour.open({ animated: false, steps: [{ title: '旧引导' }] });
		await settle();
		const second = Tour.open({ animated: false, steps: [{ title: '新引导' }] });
		await settle();
		expect(await first).toEqual({ type: 'close', current: 0 });
		await second.wrapper!.finish();
		expect(document.activeElement).toBe(opener);
	});

	it('无蒙层引导替换时，结束恢复新引导入口的焦点', async () => {
		const first = Tour.open({ animated: false, mask: false, steps: [{}] });
		await settle();
		const opener = target('next-tour-opener');
		opener.focus();
		const second = Tour.open({ animated: false, steps: [{}] });
		await settle();
		await first;
		await second.wrapper!.finish();
		expect(document.activeElement).toBe(opener);
	});

	it('蒙层 next 复用回调，maskClosable=false 仅禁止 close', async () => {
		const onClick = vi.fn();
		const wrapper = create({ maskClickBehavior: 'next', maskClosable: false, nextButtonOptions: { onClick } });
		await settle();
		document.querySelector('.vc-tour__shade')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await settle();
		expect(onClick.mock.calls[0][1]).toMatchObject({ source: 'mask' });
		expect(wrapper.emitted('change')).toHaveLength(1);
	});

	it('键盘过滤输入、重复和组合输入，ESC 不传到背景弹层', async () => {
		const background = vi.fn();
		document.addEventListener('keydown', background);
		const wrapper = create({ escClosable: false });
		await settle();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', repeat: true, bubbles: true }));
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', isComposing: true, bubbles: true }));
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }));
		expect(wrapper.emitted('change')).toBeUndefined();
		const input = document.createElement('input');
		document.body.appendChild(input);
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
		await settle();
		expect(wrapper.emitted('change')).toBeUndefined();
		background.mockClear();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		expect(background).not.toHaveBeenCalled();
		expect(wrapper.emitted('close')).toBeUndefined();
		await wrapper.setProps({ escClosable: true });
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		await settle();
		expect(wrapper.emitted('close')?.[0][0]).toMatchObject({ source: 'esc' });
		document.removeEventListener('keydown', background);
	});

	it.each([ModalView, DrawerView])('与现有浮层共享锁，先关闭底层不解锁 Tour', async (Component) => {
		const bottom = mount(Component, { attachTo: document.body, props: { modelValue: true } });
		wrappers.push(bottom);
		await settle();
		const wrapper = create();
		await settle();
		bottom.unmount();
		wrappers.splice(wrappers.indexOf(bottom), 1);
		expect(document.body.style.overflow).toBe('hidden');
		await instance(wrapper).close();
		expect(document.body.style.overflow).toBe('');
	});

	it('步骤配置对象整体覆盖、圆点与自定义进度及页眉插槽生效', async () => {
		const rootAction = vi.fn(() => false);
		const wrapper = create({
			nextButtonOptions: { disabled: true, onClick: rootAction }, progressType: 'dot',
			steps: [{ nextButtonOptions: {}, title: '一' }, { title: '二' }]
		}, { header: ({ current }) => h('h3', `自定义页眉 ${current}`) });
		await settle();
		expect(document.querySelector('.vc-tour__header')?.textContent).toBe('自定义页眉 0');
		expect(document.querySelectorAll('.vc-tour__dot')).toHaveLength(2);
		expect(await instance(wrapper).next()).toBe(true);
		expect(rootAction).not.toHaveBeenCalled();
		await wrapper.setProps({ progressType: 'number', progressFormatter: ({ current, total }) => `${current} of ${total}` });
		expect(document.querySelector('.vc-tour__progress')?.textContent).toBe('2 of 2');
	});

	it('scrollable=true 不持锁，语言与显式文案实时更新', async () => {
		const wrapper = create({ scrollable: true });
		await settle();
		expect(document.body.style.overflow).toBe('');
		expect(document.querySelector('.vc-tour__close')?.getAttribute('aria-label')).toBe('关闭引导');
		expect(document.querySelector('.vc-tour__progress')?.getAttribute('aria-label')).toBe('第 1 步，共 2 步');
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(document.querySelector('.vc-tour__buttons')?.textContent).toContain('Next');
		expect(document.querySelector('.vc-tour__close')?.getAttribute('aria-label')).toBe('Close tour');
		expect(document.querySelector('.vc-tour__progress')?.getAttribute('aria-label')).toBe('Step 1 of 2');
		await wrapper.setProps({ nextText: '自定义' });
		expect(document.querySelector('.vc-tour__buttons')?.textContent).toContain('自定义');
		await wrapper.setProps({ nextText: '' });
		expect(document.querySelectorAll('.vc-tour__buttons button')).toHaveLength(2);
		expect(document.querySelector('.vc-tour__buttons')?.textContent).toBe('Skip');
	});

	it('强制销毁不结算、不缓存，迟到操作不触发 change', async () => {
		let release!: () => void;
		const setter = vi.fn();
		VcInstance.configure({ Tour: { setCache: setter } });
		const change = vi.fn();
		const leaf = Tour.open({
			animated: false, cache: 'destroy-key', steps: [{}, {}], onChange: change,
			nextButtonOptions: { onClick: () => new Promise<void>(resolve => release = resolve) }
		});
		await settle();
		const isMoving = leaf.wrapper!.next();
		const result = vi.fn();
		leaf.then(result);
		leaf.destroy();
		release();
		await isMoving;
		await settle();
		expect(change).not.toHaveBeenCalled();
		expect(result).not.toHaveBeenCalled();
		expect(setter).not.toHaveBeenCalled();
		expect(document.body.style.overflow).toBe('');
	});

	it('全局销毁清理当前 Portal 和等待创建的实例，不结算结果', async () => {
		let release!: () => void;
		const destroyed = vi.fn();
		const result = vi.fn();
		const leaf = Tour.open({ animated: false, steps: [{}], onDestroyed: destroyed });
		const waiting = Tour.open({
			steps: [{}],
			onBeforeCreate: () => new Promise<void>(resolve => release = resolve)
		});
		leaf.then(result);
		waiting.then(result);
		await settle();
		Tour.destroy();
		release();
		await settle();
		expect(destroyed).toHaveBeenCalledOnce();
		expect(leaf.wrapper).toBeUndefined();
		expect(waiting.wrapper).toBeUndefined();
		expect(result).not.toHaveBeenCalled();
		expect(document.querySelector('.vc-tour')).toBeNull();
		expect(document.body.style.overflow).toBe('');
	});
});
