// @vitest-environment jsdom

import { Drawer, DrawerView } from '@deot/vc-components';
import { mount, config } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';
import { h, nextTick } from 'vue';
import { vi } from 'vitest';

// @vue/test-utils 默认通过全局 transformVNodeArgs 把 Transition/TransitionGroup
// 替换为 stub (createApp 也受影响), 会导致 v-show 拿不到 vnode.transition,
// onAfterLeave 不会触发。这里关闭 stub, 走真实 Transition 生命周期。
config.global.stubs.transition = false;
config.global.stubs['transition-group'] = false;

const flush = async () => {
	await nextTick();
	await Utils.sleep(0);
	await nextTick();
};

// 等待 TransitionSlide / TransitionFade 的离场动画完成。默认 duration=300ms,
// 通过 use-transition 的 createNext 设置 setTimeout(done, duration) 触发 onAfterLeave。
const flushTransition = async (extra = 600) => {
	await nextTick();
	await Utils.sleep(extra);
	await nextTick();
	await nextTick();
};

describe('index.ts', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
		Drawer.destroy();
	});

	it('basic', () => {
		expect(typeof Drawer).toBe('object');
		expect(typeof DrawerView).toBe('object');
		expect(typeof Drawer.open).toBe('function');
		expect(typeof Drawer.destroy).toBe('function');
	});

	it('create', async () => {
		const wrapper = mount(() => (<DrawerView />));

		expect(wrapper.classes()).toContain('vc-drawer');
	});
});

describe('DrawerView 基础渲染', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('根节点渲染 vc-drawer, 默认存在 mask / wrapper / container 子节点', async () => {
		const wrapper = mount(DrawerView, { attachTo: document.body });
		await flush();

		expect(wrapper.classes()).toContain('vc-drawer');
		expect(wrapper.find('.vc-drawer__mask').exists()).toBe(true);
		expect(wrapper.find('.vc-drawer__wrapper').exists()).toBe(true);
		expect(wrapper.find('.vc-drawer__container').exists()).toBe(true);

		wrapper.unmount();
	});

	it('默认 placement=right: 根节点带 is-right', async () => {
		const wrapper = mount(DrawerView, { attachTo: document.body });
		await flush();

		expect(wrapper.classes()).toContain('is-right');
		wrapper.unmount();
	});

	(['top', 'right', 'bottom', 'left'] as const).forEach((placement) => {
		it(`placement=${placement}: 根节点带 is-${placement}`, async () => {
			const wrapper = mount(DrawerView, {
				attachTo: document.body,
				props: { placement }
			});
			await flush();

			expect(wrapper.classes()).toContain(`is-${placement}`);
			wrapper.unmount();
		});
	});

	it('默认 modelValue=false: isActive=false, wrapper 不显示', async () => {
		const wrapper = mount(DrawerView, { attachTo: document.body });
		await flush();

		expect((wrapper.vm as any).isActive).toBe(false);
		const wrapperEl = wrapper.find('.vc-drawer__wrapper').element as HTMLElement;
		expect(wrapperEl.style.display).toBe('none');

		wrapper.unmount();
	});

	it('modelValue=true: isActive=true, wrapper 显示 (展开 v-show)', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		expect((wrapper.vm as any).isActive).toBe(true);
		const wrapperEl = wrapper.find('.vc-drawer__wrapper').element as HTMLElement;
		expect(wrapperEl.style.display).not.toBe('none');

		wrapper.unmount();
	});

	it('watch modelValue: setProps 切换会同步 isActive', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: false }
		});
		await flush();

		expect((wrapper.vm as any).isActive).toBe(false);

		await wrapper.setProps({ modelValue: true });
		await flush();
		expect((wrapper.vm as any).isActive).toBe(true);

		await wrapper.setProps({ modelValue: false });
		await flush();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	it('useScrollbar: 打开时 body.overflow=hidden, 关闭时移除', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		expect(document.body.style.overflow).toBe('hidden');

		await wrapper.setProps({ modelValue: false });
		await flush();
		expect(document.body.style.overflow).toBe('');

		wrapper.unmount();
	});

	it('title (string) 透传到 vc-drawer__title 的 innerHTML', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, title: '<span class="t-inner">hi</span>' }
		});
		await flush();

		const title = wrapper.find('.vc-drawer__title');
		expect(title.exists()).toBe(true);
		expect(title.find('.t-inner').exists()).toBe(true);
		expect(title.text()).toBe('hi');

		wrapper.unmount();
	});

	it('title (function) 走 Customer 渲染', async () => {
		const renderFn = vi.fn(() => [h('div', { class: 't-fn' }, 'fn-title')] as any);
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, title: renderFn }
		});
		await flush();

		expect(renderFn).toHaveBeenCalled();
		expect(wrapper.find('.t-fn').exists()).toBe(true);
		expect(wrapper.find('.t-fn').text()).toBe('fn-title');

		wrapper.unmount();
	});

	it('content (string) 渲染到 vc-drawer__content 内', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				content: '<p class="c-string">hello</p>'
			}
		});
		await flush();

		const content = wrapper.find('.vc-drawer__content');
		expect(content.exists()).toBe(true);
		expect(content.find('.c-string').exists()).toBe(true);
		expect(content.find('.c-string').text()).toBe('hello');

		wrapper.unmount();
	});

	it('content (function) 走 Customer 渲染', async () => {
		const renderFn = vi.fn(() => [h('div', { class: 'c-fn' }, 'fn-content')] as any);
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				content: renderFn
			}
		});
		await flush();

		expect(renderFn).toHaveBeenCalled();
		expect(wrapper.find('.c-fn').exists()).toBe(true);
		expect(wrapper.find('.c-fn').text()).toBe('fn-content');

		wrapper.unmount();
	});
});

describe('DrawerView size 与自定义尺寸', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('placement=right (默认): wrapper 使用 width, 默认 600px', async () => {
		const wrapper = mount(DrawerView, { attachTo: document.body, props: { modelValue: true } });
		await flush();
		const wrapperEl = wrapper.find('.vc-drawer__wrapper').element as HTMLElement;
		expect(wrapperEl.style.width).toBe('600px');
		wrapper.unmount();
	});

	it('placement=left: 自定义 width 透传到 wrapper', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, placement: 'left', width: 400 }
		});
		await flush();
		const wrapperEl = wrapper.find('.vc-drawer__wrapper').element as HTMLElement;
		expect(wrapperEl.style.width).toBe('400px');
		wrapper.unmount();
	});

	it('placement=bottom: wrapper 使用 height, 默认 300px', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, placement: 'bottom' }
		});
		await flush();
		const wrapperEl = wrapper.find('.vc-drawer__wrapper').element as HTMLElement;
		expect(wrapperEl.style.height).toBe('300px');
		wrapper.unmount();
	});

	it('placement=top: 自定义 height 透传到 wrapper', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, placement: 'top', height: 500 }
		});
		await flush();
		const wrapperEl = wrapper.find('.vc-drawer__wrapper').element as HTMLElement;
		expect(wrapperEl.style.height).toBe('500px');
		wrapper.unmount();
	});
});

describe('DrawerView 关闭逻辑', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('默认渲染关闭按钮, 点击关闭抽屉', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		const close = wrapper.find('.vc-drawer__close');
		expect(close.exists()).toBe(true);
		await close.trigger('click');
		await flush();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	it('maskClosable=true (默认): 点击 mask 关闭', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		await wrapper.find('.vc-drawer__mask').trigger('click');
		await flush();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	it('maskClosable=false: 点击 mask 不关闭', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, maskClosable: false }
		});
		await flush();

		await wrapper.find('.vc-drawer__mask').trigger('click');
		await flush();
		expect((wrapper.vm as any).isActive).toBe(true);

		wrapper.unmount();
	});

	it('mask=false: mask v-show 为隐藏', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, mask: false }
		});
		await flush();

		const mask = wrapper.find('.vc-drawer__mask').element as HTMLElement;
		expect(mask.style.display).toBe('none');

		wrapper.unmount();
	});

	it('isActive=false 时点击关闭按钮无副作用 (handleBefore 早退)', async () => {
		const onCancel = vi.fn();
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: false, onCancel }
		});
		await flush();

		await wrapper.find('.vc-drawer__close').trigger('click');
		await flush();

		expect(onCancel).not.toHaveBeenCalled();
		wrapper.unmount();
	});
});

describe('DrawerView closeWithCancel / cancel / ok', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('closeWithCancel=true (默认): 关闭按钮触发 onCancel 并关闭', async () => {
		const onCancel = vi.fn();
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, onCancel }
		});
		await flush();

		await wrapper.find('.vc-drawer__close').trigger('click');
		await flush();

		expect(onCancel).toHaveBeenCalled();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	// handleBefore 中 `!fn || fn === true` 触发关闭, 仅 truthy 非 true 非 Promise 才能阻止
	it('closeWithCancel=true: onCancel 返回 truthy (非 true 非 Promise) 时阻止关闭', async () => {
		const onCancel = vi.fn(() => 'block');
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, onCancel }
		});
		await flush();

		await wrapper.find('.vc-drawer__close').trigger('click');
		await flush();

		expect(onCancel).toHaveBeenCalled();
		expect((wrapper.vm as any).isActive).toBe(true);

		wrapper.unmount();
	});

	it('closeWithCancel=true: onCancel 返回 false / undefined 同样会关闭', async () => {
		const onCancel = vi.fn(() => false);
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, onCancel }
		});
		await flush();

		await wrapper.find('.vc-drawer__close').trigger('click');
		await flush();

		expect(onCancel).toHaveBeenCalled();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	it('closeWithCancel=false: 关闭按钮直接关闭, 不触发 onCancel', async () => {
		const onCancel = vi.fn();
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, closeWithCancel: false, onCancel }
		});
		await flush();

		await wrapper.find('.vc-drawer__close').trigger('click');
		await flush();

		expect(onCancel).not.toHaveBeenCalled();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	it('点击 cancelText 按钮: 触发 onCancel 并关闭', async () => {
		const onCancel = vi.fn();
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, onCancel }
		});
		await flush();

		const buttons = wrapper.findAll('.vc-drawer__footer button');
		// 顺序: cancel(left), ok(right)
		expect(buttons.length).toBe(2);
		await buttons[0].trigger('click');
		await flush();

		expect(onCancel).toHaveBeenCalled();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	it('点击 okText 按钮: 触发 onOk 并关闭', async () => {
		const onOk = vi.fn();
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, onOk }
		});
		await flush();

		const buttons = wrapper.findAll('.vc-drawer__footer button');
		await buttons[1].trigger('click');
		await flush();

		expect(onOk).toHaveBeenCalled();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	it('onOk 返回 Promise: resolve 后才关闭 (异步分支)', async () => {
		let resolveFn: (v?: any) => void;
		const onOk = vi.fn(() => new Promise<void>((r) => { resolveFn = r; }));
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, onOk }
		});
		await flush();

		await wrapper.findAll('.vc-drawer__footer button')[1].trigger('click');
		await flush();

		// resolve 前仍处于打开状态
		expect((wrapper.vm as any).isActive).toBe(true);

		resolveFn!();
		await flush();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	it('onOk 返回 truthy (非 true 非 Promise) 时阻止关闭', async () => {
		const onOk = vi.fn(() => 1);
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, onOk }
		});
		await flush();

		await wrapper.findAll('.vc-drawer__footer button')[1].trigger('click');
		await flush();

		expect((wrapper.vm as any).isActive).toBe(true);
		wrapper.unmount();
	});

	it('未传 onOk/onCancel: 点击按钮也不报错 (走 fallback)', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		const buttons = wrapper.findAll('.vc-drawer__footer button');
		await buttons[1].trigger('click');
		await flush();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});
});

describe('DrawerView footer / okText / cancelText', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('默认 footer=true 同时存在 okText / cancelText 时渲染 footer, container 不带 is-no-footer', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		expect(wrapper.find('.vc-drawer__footer').exists()).toBe(true);
		expect(wrapper.find('.vc-drawer__container').classes()).not.toContain('is-no-footer');
		expect(wrapper.findAll('.vc-drawer__footer button')).toHaveLength(2);

		wrapper.unmount();
	});

	it('footer=false: 不渲染 footer, container 带 is-no-footer', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, footer: false }
		});
		await flush();

		expect(wrapper.find('.vc-drawer__footer').exists()).toBe(false);
		expect(wrapper.find('.vc-drawer__container').classes()).toContain('is-no-footer');

		wrapper.unmount();
	});

	it('okText=false: 不渲染确定按钮 (仅显示取消)', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, okText: false }
		});
		await flush();

		const buttons = wrapper.findAll('.vc-drawer__footer button');
		expect(buttons).toHaveLength(1);
		expect(buttons[0].text()).toBe('取消');

		wrapper.unmount();
	});

	it('cancelText=false: 不渲染取消按钮 (仅显示确定)', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, cancelText: false }
		});
		await flush();

		const buttons = wrapper.findAll('.vc-drawer__footer button');
		expect(buttons).toHaveLength(1);
		expect(buttons[0].text()).toBe('确定');

		wrapper.unmount();
	});

	it('okText/cancelText 都为 false: 不渲染 footer, container 带 is-no-footer', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, okText: false, cancelText: false }
		});
		await flush();

		expect(wrapper.find('.vc-drawer__footer').exists()).toBe(false);
		expect(wrapper.find('.vc-drawer__container').classes()).toContain('is-no-footer');

		wrapper.unmount();
	});

	it('自定义 okText / cancelText 文案', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, okText: '保存', cancelText: '关闭' }
		});
		await flush();

		const buttons = wrapper.findAll('.vc-drawer__footer button');
		expect(buttons[0].text()).toBe('关闭');
		expect(buttons[1].text()).toBe('保存');

		wrapper.unmount();
	});

	it('okDisabled / cancelDisabled 透传到按钮', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, okDisabled: true, cancelDisabled: true }
		});
		await flush();

		const buttons = wrapper.findAll('.vc-drawer__footer button');
		expect((buttons[0].element as HTMLButtonElement).disabled).toBe(true);
		expect((buttons[1].element as HTMLButtonElement).disabled).toBe(true);

		wrapper.unmount();
	});
});

describe('DrawerView slots', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('header slot 覆盖默认 title', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true, title: 'should-be-hidden' },
			slots: {
				header: () => h('div', { class: '__newHeader' }, 'header-x')
			}
		});
		await flush();

		expect(wrapper.find('.__newHeader').exists()).toBe(true);
		expect(wrapper.find('.__newHeader').text()).toBe('header-x');
		expect(wrapper.find('.vc-drawer__title').exists()).toBe(false);

		wrapper.unmount();
	});

	it('footer slot 覆盖默认按钮', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true },
			slots: {
				footer: () => h('div', { class: '__newFooter' }, 'footer-x')
			}
		});
		await flush();

		expect(wrapper.find('.__newFooter').exists()).toBe(true);
		expect(wrapper.findAll('.vc-drawer__footer button')).toHaveLength(0);

		wrapper.unmount();
	});

	it('footer-extra slot 渲染在 footer 内', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true },
			slots: {
				'footer-extra': () => h('span', { class: '__extra' }, 'extra')
			}
		});
		await flush();

		const footer = wrapper.find('.vc-drawer__footer');
		expect(footer.exists()).toBe(true);
		expect(footer.find('.__extra').exists()).toBe(true);

		wrapper.unmount();
	});

	it('default slot 渲染到 vc-drawer__content 内', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true },
			slots: {
				default: () => h('p', { class: 'd-default' }, 'body content')
			}
		});
		await flush();

		expect(wrapper.find('.vc-drawer__content .d-default').exists()).toBe(true);

		wrapper.unmount();
	});
});

describe('DrawerView 类名 / 样式透传', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('wrapperClass / wrapperStyle 透传到 vc-drawer__wrapper', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				wrapperClass: 'wrapper-x',
				wrapperStyle: { color: 'red' }
			}
		});
		await flush();

		const w = wrapper.find('.vc-drawer__wrapper');
		expect(w.classes()).toContain('wrapper-x');
		expect((w.element as HTMLElement).style.color).toBe('red');
		wrapper.unmount();
	});

	it('contentClass / contentStyle 透传到 vc-drawer__content', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				contentClass: 'content-x',
				contentStyle: { padding: '10px' }
			}
		});
		await flush();

		const c = wrapper.find('.vc-drawer__content');
		expect(c.classes()).toContain('content-x');
		expect((c.element as HTMLElement).style.padding).toBe('10px');
		wrapper.unmount();
	});

	it('maskStyle 透传到 vc-drawer__mask', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				maskStyle: { backgroundColor: 'rgb(0, 0, 0)' }
			}
		});
		await flush();

		const mask = wrapper.find('.vc-drawer__mask').element as HTMLElement;
		expect(mask.style.backgroundColor).toBe('rgb(0, 0, 0)');
		wrapper.unmount();
	});
});

describe('DrawerView expose', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('expose: isActive / toggle 都可访问, toggle 支持无参数取反', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: false }
		});
		await flush();

		const vm = wrapper.vm as any;
		expect(vm.isActive).toBe(false);
		expect(typeof vm.toggle).toBe('function');

		vm.toggle();
		await flush();
		expect(vm.isActive).toBe(true);

		vm.toggle(false);
		await flush();
		expect(vm.isActive).toBe(false);

		vm.toggle(true);
		await flush();
		expect(vm.isActive).toBe(true);

		wrapper.unmount();
	});
});

describe('DrawerView 关闭事件 (close / update:modelValue / visible-change)', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	// handleRemove 在 TransitionSlide 的 onAfterLeave 触发,
	// 默认 duration=300ms, 通过 use-transition 的 setTimeout(done, duration) 触发。
	it('关闭后 (动画结束) 触发 close / update:modelValue=false / visible-change=false', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		await wrapper.find('.vc-drawer__close').trigger('click');
		await flushTransition();

		expect(wrapper.emitted('close')).toBeTruthy();
		const updates = wrapper.emitted('update:modelValue') as any[][];
		expect(updates?.[updates.length - 1]).toEqual([false]);
		const vc = wrapper.emitted('visible-change') as any[][];
		expect(vc?.[vc.length - 1]).toEqual([false]);

		wrapper.unmount();
	}, 10000);

	it('已 unmount 后 handleRemove 不会抛错 / 不再 emit', async () => {
		const wrapper = mount(DrawerView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		await wrapper.find('.vc-drawer__close').trigger('click');
		// 立即卸载, 模拟 instance.isUnmounted=true 后才走到 handleRemove
		wrapper.unmount();
		await flushTransition();
		// 不抛错即可
		expect(true).toBe(true);
	}, 10000);
});

describe('Drawer 静态方法 (open / destroy)', () => {
	afterEach(() => {
		Drawer.destroy();
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('Drawer.open() 渲染 Drawer 到 body 并打开', async () => {
		Drawer.open({ title: 'open-title', content: 'open-content' });
		await flush();

		expect(document.body.querySelector('.vc-drawer')).not.toBeNull();
		expect(document.body.querySelector('.vc-drawer__wrapper')).not.toBeNull();
		expect(document.body.querySelector('.vc-drawer__title')!.innerHTML).toContain('open-title');
	});

	it('Drawer.open() 支持 content 为函数 (Customer 渲染)', async () => {
		Drawer.open({
			title: 'fn',
			content: () => [h('div', { class: 'open-fn' }, 'fn-body')]
		});
		await flush();

		expect(document.body.querySelector('.open-fn')).not.toBeNull();
		expect(document.body.querySelector('.open-fn')!.innerHTML).toContain('fn-body');
	});

	it('Drawer.destroy() 清理所有 Drawer portal', async () => {
		Drawer.open({ title: 't1' });
		Drawer.open({ title: 't2' });
		await flush();
		expect(document.body.querySelectorAll('.vc-drawer').length).toBeGreaterThanOrEqual(2);

		Drawer.destroy();
		await flush();
		expect(document.body.querySelectorAll('.vc-drawer').length).toBe(0);
	});
});
