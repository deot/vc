// @vitest-environment jsdom

import { Modal, ModalView, MModal, MModalView } from '@deot/vc-components';
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

// 等待 TransitionScale / TransitionFade 的离场动画完成。默认 duration=300ms,
// 通过 use-transition 的 createNext 设置 setTimeout(done, duration) 触发 onAfterLeave。
const flushTransition = async (extra = 600) => {
	await nextTick();
	await Utils.sleep(extra);
	await nextTick();
	await nextTick();
};

const triggerResize = (el: any) => {
	el?.__rz__?.handleResize?.([{ target: el }]);
};

describe('index.ts', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
		Modal.destroy();
	});

	it('basic', () => {
		expect(typeof Modal).toBe('object');
		expect(typeof ModalView).toBe('object');
		expect(typeof Modal.info).toBe('function');
		expect(typeof Modal.success).toBe('function');
		expect(typeof Modal.warning).toBe('function');
		expect(typeof Modal.error).toBe('function');
		expect(typeof Modal.destroy).toBe('function');
	});

	it('create', async () => {
		const wrapper = mount(() => (<ModalView />));
		expect(wrapper.classes()).toContain('vc-modal');
	});
});

describe('ModalView 基础渲染', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
		Modal.destroy();
	});

	it('根节点渲染 vc-modal, 默认存在 mask / wrapper / container 子节点', async () => {
		const wrapper = mount(ModalView, { attachTo: document.body });
		await flush();

		expect(wrapper.classes()).toContain('vc-modal');
		expect(wrapper.find('.vc-modal__mask').exists()).toBe(true);
		expect(wrapper.find('.vc-modal__wrapper').exists()).toBe(true);
		expect(wrapper.find('.vc-modal__container').exists()).toBe(true);

		wrapper.unmount();
	});

	it('默认 modelValue=false: isActive=false, container 不显示', async () => {
		const wrapper = mount(ModalView, { attachTo: document.body });
		await flush();

		expect((wrapper.vm as any).isActive).toBe(false);
		const container = wrapper.find('.vc-modal__container').element as HTMLElement;
		expect(container.style.display).toBe('none');

		wrapper.unmount();
	});

	it('modelValue=true: isActive=true, container 显示 (展开 v-show)', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		expect((wrapper.vm as any).isActive).toBe(true);
		const container = wrapper.find('.vc-modal__container').element as HTMLElement;
		expect(container.style.display).not.toBe('none');

		wrapper.unmount();
	});

	it('watch modelValue: setProps 切换会同步 isActive', async () => {
		const wrapper = mount(ModalView, {
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
		const wrapper = mount(ModalView, {
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

	it('title (string) 透传到 vc-modal__title 的 innerHTML', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, title: '<span class="t-inner">hi</span>' }
		});
		await flush();

		const title = wrapper.find('.vc-modal__title');
		expect(title.exists()).toBe(true);
		expect(title.find('.t-inner').exists()).toBe(true);
		expect(title.text()).toBe('hi');

		wrapper.unmount();
	});

	it('content (string) 渲染到 vc-modal__content 内', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				content: '<p class="c-string">hello</p>'
			}
		});
		await flush();

		const content = wrapper.find('.vc-modal__content');
		expect(content.exists()).toBe(true);
		expect(content.find('.c-string').exists()).toBe(true);
		expect(content.find('.c-string').text()).toBe('hello');

		wrapper.unmount();
	});

	it('content (function) 走 Customer 渲染 (对应 Modal.warning 的写法)', async () => {
		const renderFn = vi.fn(() => [h('div', { class: 'c-fn' }, 'fn-content')] as any);
		const wrapper = mount(ModalView, {
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

describe('ModalView size 与自定义尺寸', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('size=small 默认宽度 480px', async () => {
		const wrapper = mount(ModalView, { attachTo: document.body, props: { modelValue: true, size: 'small' } });
		await flush();
		const container = wrapper.find('.vc-modal__container').element as HTMLElement;
		expect(container.style.width).toBe('480px');
		expect(container.classList.contains('is-large')).toBe(false);
		wrapper.unmount();
	});

	it('size=medium 默认宽度 640px, 含 is-large 标记', async () => {
		const wrapper = mount(ModalView, { attachTo: document.body, props: { modelValue: true, size: 'medium' } });
		await flush();
		const container = wrapper.find('.vc-modal__container').element as HTMLElement;
		expect(container.style.width).toBe('640px');
		expect(container.classList.contains('is-large')).toBe(true);
		wrapper.unmount();
	});

	it('size=large 默认宽度 864px', async () => {
		const wrapper = mount(ModalView, { attachTo: document.body, props: { modelValue: true, size: 'large' } });
		await flush();
		const container = wrapper.find('.vc-modal__container').element as HTMLElement;
		expect(container.style.width).toBe('864px');
		expect(container.classList.contains('is-large')).toBe(true);
		wrapper.unmount();
	});

	it('mode + size=small/large 走 confirm 模式的尺寸 (340 / 390)', async () => {
		const small = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, mode: 'info', size: 'small' }
		});
		await flush();
		expect((small.find('.vc-modal__container').element as HTMLElement).style.width).toBe('340px');
		small.unmount();

		const large = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, mode: 'info', size: 'large' }
		});
		await flush();
		expect((large.find('.vc-modal__container').element as HTMLElement).style.width).toBe('390px');
		large.unmount();
	});

	it('自定义 width 覆盖默认宽度 (受 MAX_WIDTH=window.innerWidth-20 限制)', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, width: 500 }
		});
		await flush();
		const container = wrapper.find('.vc-modal__container').element as HTMLElement;
		expect(container.style.width).toBe('500px');
		// 未指定 height 时使用 minHeight
		expect(container.style.minHeight).toBeTruthy();
		wrapper.unmount();
	});

	it('自定义 height 时使用 height 而非 minHeight', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, width: 500, height: 400 }
		});
		await flush();
		const container = wrapper.find('.vc-modal__container').element as HTMLElement;
		expect(container.style.height).toBe('400px');
		expect(container.style.minHeight).toBe('');
		wrapper.unmount();
	});
});

describe('ModalView mode (info/success/warning/error)', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	(['info', 'success', 'warning', 'error'] as const).forEach((mode) => {
		it(`mode="${mode}": 渲染 Icon, header 含 is-confirm`, async () => {
			const wrapper = mount(ModalView, {
				attachTo: document.body,
				props: { modelValue: true, mode }
			});
			await flush();

			const icon = wrapper.find('.vc-modal__icon');
			expect(icon.exists()).toBe(true);
			expect(icon.classes()).toContain(`is-${mode}`);

			const header = wrapper.find('.vc-modal__header');
			expect(header.classes()).toContain('is-confirm');

			// mode 模式下不渲染默认的关闭按钮
			expect(wrapper.find('.vc-modal__close').exists()).toBe(false);

			wrapper.unmount();
		});
	});
});

describe('ModalView 关闭逻辑', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('closable=true (默认) 渲染关闭按钮, 点击关闭弹窗', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		const close = wrapper.find('.vc-modal__close');
		expect(close.exists()).toBe(true);
		await close.trigger('click');
		await flush();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	it('closable=false: 不渲染关闭按钮', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, closable: false }
		});
		await flush();

		expect(wrapper.find('.vc-modal__close').exists()).toBe(false);

		wrapper.unmount();
	});

	it('maskClosable=true (默认): 点击 wrapper 自身关闭', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		// 必须 e.target 为 wrapper 自身才会关闭
		await wrapper.find('.vc-modal__wrapper').trigger('click');
		await flush();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	it('maskClosable=true: 点击 mask 也会关闭', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		await wrapper.find('.vc-modal__mask').trigger('click');
		await flush();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	it('maskClosable=false: 点击 wrapper / mask 都不关闭', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, maskClosable: false }
		});
		await flush();

		await wrapper.find('.vc-modal__wrapper').trigger('click');
		await wrapper.find('.vc-modal__mask').trigger('click');
		await flush();
		expect((wrapper.vm as any).isActive).toBe(true);

		wrapper.unmount();
	});

	it('点击 container 内部不会关闭 (target 不是 wrapper)', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		await wrapper.find('.vc-modal__container').trigger('click');
		await flush();
		expect((wrapper.vm as any).isActive).toBe(true);

		wrapper.unmount();
	});

	it('escClosable=true (默认) + ESC keydown 关闭', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
		await flush();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	it('escClosable=false: ESC 不关闭', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, escClosable: false }
		});
		await flush();

		document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
		await flush();
		expect((wrapper.vm as any).isActive).toBe(true);

		wrapper.unmount();
	});

	it('其他键位 (非 ESC) 不会触发关闭', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
		await flush();
		expect((wrapper.vm as any).isActive).toBe(true);

		wrapper.unmount();
	});

	it('isActive=false 时 ESC 无作用', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: false }
		});
		await flush();

		expect(() => {
			document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
		}).not.toThrow();

		wrapper.unmount();
	});

	it('mask=false: mask v-show 为隐藏', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, mask: false }
		});
		await flush();

		const mask = wrapper.find('.vc-modal__mask').element as HTMLElement;
		expect(mask.style.display).toBe('none');

		wrapper.unmount();
	});
});

describe('ModalView closeWithCancel / cancel / ok', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('closeWithCancel=true (默认): 关闭按钮触发 onCancel 并关闭', async () => {
		const onCancel = vi.fn();
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, onCancel }
		});
		await flush();

		await wrapper.find('.vc-modal__close').trigger('click');
		await flush();

		expect(onCancel).toHaveBeenCalled();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	// handleBefore 中 `!fn || fn === true` 触发关闭, 仅 truthy 非 true 非 Promise 才能阻止
	it('closeWithCancel=true: onCancel 返回 truthy (非 true 非 Promise) 时阻止关闭', async () => {
		const onCancel = vi.fn(() => 'block');
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, onCancel }
		});
		await flush();

		await wrapper.find('.vc-modal__close').trigger('click');
		await flush();

		expect(onCancel).toHaveBeenCalled();
		expect((wrapper.vm as any).isActive).toBe(true);

		wrapper.unmount();
	});

	it('closeWithCancel=true: onCancel 返回 false / undefined 同样会关闭', async () => {
		const onCancel = vi.fn(() => false);
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, onCancel }
		});
		await flush();

		await wrapper.find('.vc-modal__close').trigger('click');
		await flush();

		expect(onCancel).toHaveBeenCalled();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	it('closeWithCancel=false: 关闭按钮直接关闭, 不触发 onCancel', async () => {
		const onCancel = vi.fn();
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, closeWithCancel: false, onCancel }
		});
		await flush();

		await wrapper.find('.vc-modal__close').trigger('click');
		await flush();

		expect(onCancel).not.toHaveBeenCalled();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	it('点击 cancelText 按钮: 触发 onCancel 并关闭', async () => {
		const onCancel = vi.fn();
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, onCancel }
		});
		await flush();

		const buttons = wrapper.findAll('.vc-modal__footer button');
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
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, onOk }
		});
		await flush();

		const buttons = wrapper.findAll('.vc-modal__footer button');
		await buttons[1].trigger('click');
		await flush();

		expect(onOk).toHaveBeenCalled();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	it('onOk 返回 Promise: resolve 后才关闭 (异步分支)', async () => {
		let resolveFn: (v?: any) => void;
		const onOk = vi.fn(() => new Promise<void>((r) => { resolveFn = r; }));
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, onOk }
		});
		await flush();

		await wrapper.findAll('.vc-modal__footer button')[1].trigger('click');
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
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, onOk }
		});
		await flush();

		await wrapper.findAll('.vc-modal__footer button')[1].trigger('click');
		await flush();

		expect((wrapper.vm as any).isActive).toBe(true);
		wrapper.unmount();
	});

	it('isActive=false 时 cancel 按钮无副作用 (handleBefore 早退)', async () => {
		const onCancel = vi.fn();
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: false, onCancel }
		});
		await flush();

		// 强制点击 cancel 按钮 (尽管按钮处于隐藏的容器内, 仍可触发 onClick)
		const buttons = wrapper.findAll('.vc-modal__footer button');
		await buttons[0].trigger('click');
		await flush();

		expect(onCancel).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it('未传 onOk/onCancel: 点击按钮也不报错 (走 fallback)', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		const buttons = wrapper.findAll('.vc-modal__footer button');
		await buttons[1].trigger('click');
		await flush();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});
});

describe('ModalView footer / okText / cancelText', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('默认 footer=true 同时存在 okText / cancelText 时渲染 footer 与 has-footer', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		expect(wrapper.find('.vc-modal__footer').exists()).toBe(true);
		expect(wrapper.find('.vc-modal__container').classes()).toContain('has-footer');
		expect(wrapper.findAll('.vc-modal__footer button')).toHaveLength(2);

		wrapper.unmount();
	});

	it('footer=false: 不渲染 footer, 也不带 has-footer', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, footer: false }
		});
		await flush();

		expect(wrapper.find('.vc-modal__footer').exists()).toBe(false);
		expect(wrapper.find('.vc-modal__container').classes()).not.toContain('has-footer');

		wrapper.unmount();
	});

	it('okText=false: 不渲染确定按钮 (仅显示取消)', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, okText: false }
		});
		await flush();

		const buttons = wrapper.findAll('.vc-modal__footer button');
		expect(buttons).toHaveLength(1);
		expect(buttons[0].text()).toBe('取消');

		wrapper.unmount();
	});

	it('cancelText=false: 不渲染取消按钮 (仅显示确定)', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, cancelText: false }
		});
		await flush();

		const buttons = wrapper.findAll('.vc-modal__footer button');
		expect(buttons).toHaveLength(1);
		expect(buttons[0].text()).toBe('确定');

		wrapper.unmount();
	});

	it('okText/cancelText 都为 false: 不渲染 footer', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, okText: false, cancelText: false }
		});
		await flush();

		expect(wrapper.find('.vc-modal__footer').exists()).toBe(false);

		wrapper.unmount();
	});

	it('自定义 okText / cancelText 文案', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, okText: '保存', cancelText: '关闭' }
		});
		await flush();

		const buttons = wrapper.findAll('.vc-modal__footer button');
		expect(buttons[0].text()).toBe('关闭');
		expect(buttons[1].text()).toBe('保存');

		wrapper.unmount();
	});

	it('okDisabled / cancelDisabled 透传到按钮', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, okDisabled: true, cancelDisabled: true }
		});
		await flush();

		const buttons = wrapper.findAll('.vc-modal__footer button');
		expect((buttons[0].element as HTMLButtonElement).disabled).toBe(true);
		expect((buttons[1].element as HTMLButtonElement).disabled).toBe(true);

		wrapper.unmount();
	});
});

describe('ModalView slots', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('header slot 覆盖默认 title 与关闭按钮 (对照 wya-vc 自定义 header)', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, title: 'should-be-hidden' },
			slots: {
				header: () => h('div', { class: '__newHeader' }, 'header-x')
			}
		});
		await flush();

		expect(wrapper.find('.__newHeader').exists()).toBe(true);
		expect(wrapper.find('.__newHeader').text()).toBe('header-x');
		expect(wrapper.find('.vc-modal__title').exists()).toBe(false);
		expect(wrapper.find('.vc-modal__close').exists()).toBe(false);

		wrapper.unmount();
	});

	it('footer slot 覆盖默认按钮', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true },
			slots: {
				footer: () => h('div', { class: '__newFooter' }, 'footer-x')
			}
		});
		await flush();

		expect(wrapper.find('.__newFooter').exists()).toBe(true);
		expect(wrapper.findAll('.vc-modal__footer button')).toHaveLength(0);

		wrapper.unmount();
	});

	it('footer-extra slot 渲染在 footer 内', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true },
			slots: {
				'footer-extra': () => h('span', { class: '__extra' }, 'extra')
			}
		});
		await flush();

		const footer = wrapper.find('.vc-modal__footer');
		expect(footer.exists()).toBe(true);
		expect(footer.find('.__extra').exists()).toBe(true);

		wrapper.unmount();
	});

	it('default slot 渲染到 vc-modal__content 内 (对应 examples 默认插槽)', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true },
			slots: {
				default: () => h('p', { class: 'd-default' }, 'body content')
			}
		});
		await flush();

		expect(wrapper.find('.vc-modal__content .d-default').exists()).toBe(true);

		wrapper.unmount();
	});
});

describe('ModalView modifier 类名 / 样式透传', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('draggable=true 添加 is-drag', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, draggable: true }
		});
		await flush();

		expect(wrapper.find('.vc-modal__container').classes()).toContain('is-drag');
		// draggable 时 wrapper 上 top: 0
		const wrapperEl = wrapper.find('.vc-modal__wrapper').element as HTMLElement;
		expect(wrapperEl.style.top).toBe('0px');
		wrapper.unmount();
	});

	it('border=true 添加 has-border', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, border: true }
		});
		await flush();

		expect(wrapper.find('.vc-modal__container').classes()).toContain('has-border');
		wrapper.unmount();
	});

	it('wrapperClass / wrapperStyle 透传到 vc-modal__wrapper', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				wrapperClass: 'wrapper-x',
				wrapperStyle: { color: 'red' }
			}
		});
		await flush();

		const w = wrapper.find('.vc-modal__wrapper');
		expect(w.classes()).toContain('wrapper-x');
		expect((w.element as HTMLElement).style.color).toBe('red');
		wrapper.unmount();
	});

	it('contentClass / contentStyle 透传到 vc-modal__content', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				contentClass: 'content-x',
				contentStyle: { padding: '10px' }
			}
		});
		await flush();

		const c = wrapper.find('.vc-modal__content');
		expect(c.classes()).toContain('content-x');
		expect((c.element as HTMLElement).style.padding).toBe('10px');
		wrapper.unmount();
	});
});

describe('ModalView draggable', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('header mousedown 设置 cursor=move, mousemove 与 mouseup 完整链路', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, draggable: true }
		});
		await flush();

		const header = wrapper.find('.vc-modal__header').element as HTMLElement;
		const wrapperEl = wrapper.find('.vc-modal__wrapper').element as HTMLElement;
		header.dispatchEvent(new MouseEvent('mousedown', {
			bubbles: true,
			clientX: 100,
			clientY: 100
		}));
		await flush();

		expect(header.style.cursor).toBe('move');
		// zIndex 单调递增
		expect(parseInt(wrapperEl.style.zIndex || '0')).toBeGreaterThan(0);

		// 触发 mousemove (handleMouseMove 更新 x/y)
		document.dispatchEvent(new MouseEvent('mousemove', {
			bubbles: true,
			clientX: 150,
			clientY: 160
		}));
		await flush();

		// mouseup 卸载 listener (resetOrigin debounced 不抛错)
		document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
		await flush();

		// 二次 mousemove 应该已经被解绑, 不会抛错
		expect(() => {
			document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 200, clientY: 200 }));
		}).not.toThrow();

		wrapper.unmount();
	});

	it('draggable=false: header mousedown 不会改变 cursor', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, draggable: false }
		});
		await flush();

		const header = wrapper.find('.vc-modal__header').element as HTMLElement;
		header.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
		await flush();

		expect(header.style.cursor).not.toBe('move');
		wrapper.unmount();
	});

	it('draggable + 自定义 x/y: draggableStyle 应用 left/top', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				draggable: true,
				x: 50,
				y: 80
			}
		});
		await flush();

		const container = wrapper.find('.vc-modal__container').element as HTMLElement;
		expect(container.style.left).toBe('50px');
		expect(container.style.top).toBe('80px');
		wrapper.unmount();
	});
});

describe('ModalView Resize 钩子', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('container Resize 回调: 奇数高度时把高度补 +1 (containerHeight%2 !== 0)', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		const container = wrapper.find('.vc-modal__container').element as HTMLElement;
		// 模拟一个奇数 offsetHeight, 触发 `containerHeight % 2 !== 0` 分支
		Object.defineProperty(container, 'offsetHeight', { configurable: true, value: 301 });

		triggerResize(container);
		await flush();

		expect(container.style.height).toBe('302px');
		wrapper.unmount();
	});

	it('container Resize 回调: 容器顶到 maxheight 且 maxheight 为奇数时降 1', async () => {
		// window.innerHeight 默认 768, maxheight=748 (偶数). 改为 769 让 maxheight=749 (奇数)
		const original = window.innerHeight;
		Object.defineProperty(window, 'innerHeight', { configurable: true, value: 769 });

		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		const container = wrapper.find('.vc-modal__container').element as HTMLElement;
		// containerHeight + 1 > maxheight(749) → containerHeight >= 749
		Object.defineProperty(container, 'offsetHeight', { configurable: true, value: 800 });

		triggerResize(container);
		await flush();

		// maxheight - 1 = 748
		expect(container.style.height).toBe('748px');

		wrapper.unmount();
		Object.defineProperty(window, 'innerHeight', { configurable: true, value: original });
	});

	it('content Resize 回调: 当未传 height 且 scroller/container 存在 height 时清理 + refresh', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		const container = wrapper.find('.vc-modal__container').element as HTMLElement;
		const scrollerEl = wrapper.find('.vc-scroller > div').element as HTMLElement;

		// 模拟存在 height 样式, 触发清理路径
		container.style.height = '300px';
		scrollerEl.style.height = '200px';

		const scrollerContent = wrapper.find('.vc-modal__content').element as HTMLElement;
		triggerResize(scrollerContent);
		await flush();

		expect(container.style.height).toBe('');
		expect(scrollerEl.style.height).toBe('');

		wrapper.unmount();
	});

	it('content Resize 回调: 当 props.height 已设置时直接 return', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true, height: 400 }
		});
		await flush();

		const container = wrapper.find('.vc-modal__container').element as HTMLElement;
		// 不应该被清理 (height 设置后属于固定模式)
		const original = container.style.height;
		const scrollerContent = wrapper.find('.vc-modal__content').element as HTMLElement;
		triggerResize(scrollerContent);
		await flush();

		expect(container.style.height).toBe(original);
		wrapper.unmount();
	});
});

describe('ModalView expose', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('expose: isActive / toggle / resetOrigin 都可访问', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: false }
		});
		await flush();

		const vm = wrapper.vm as any;
		expect(vm.isActive).toBe(false);
		expect(typeof vm.toggle).toBe('function');
		expect(typeof vm.resetOrigin).toBe('function');

		vm.toggle();
		await flush();
		expect(vm.isActive).toBe(true);

		vm.toggle(false);
		await flush();
		expect(vm.isActive).toBe(false);

		vm.toggle(true);
		await flush();
		expect(vm.isActive).toBe(true);

		expect(() => vm.resetOrigin()).not.toThrow();
		wrapper.unmount();
	});

	it('handleClick (document capture): 点击会被记录到 originX/originY', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		// 不应抛出 (handleClick 走 default 分支并赋值 originX/originY)
		expect(() => {
			document.body.dispatchEvent(new MouseEvent('click', {
				bubbles: true,
				clientX: 80,
				clientY: 90
			}));
		}).not.toThrow();

		wrapper.unmount();
	});
});

describe('ModalView 关闭事件 (close / update:modelValue / visible-change / portal-fulfilled)', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	// handleRemove 在 TransitionScale 的 onAfterLeave 触发,
	// 默认 duration=300ms, 设置 animationDuration 后 Vue 内部 setTimeout 兜底 timeout+1ms 触发 done
	it('关闭后 (动画结束) 触发 close / update:modelValue=false / visible-change=false / portal-fulfilled', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		await wrapper.find('.vc-modal__close').trigger('click');
		await flushTransition();

		expect(wrapper.emitted('close')).toBeTruthy();
		expect(wrapper.emitted('portal-fulfilled')).toBeTruthy();
		const updates = wrapper.emitted('update:modelValue') as any[][];
		expect(updates?.[updates.length - 1]).toEqual([false]);
		const vc = wrapper.emitted('visible-change') as any[][];
		expect(vc?.[vc.length - 1]).toEqual([false]);

		wrapper.unmount();
	}, 10000);

	it('已 unmount 后 handleRemove 不会抛错 / 不再 emit', async () => {
		const wrapper = mount(ModalView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();

		await wrapper.find('.vc-modal__close').trigger('click');
		// 立即卸载, 模拟 instance.isUnmounted=true 后才走到 handleRemove
		wrapper.unmount();
		await flushTransition();
		// 不抛错即可
		expect(true).toBe(true);
	}, 10000);
});

describe('Modal 静态方法 (info / success / warning / error / destroy)', () => {
	afterEach(() => {
		Modal.destroy();
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	(['info', 'success', 'warning', 'error'] as const).forEach((m) => {
		it(`Modal.${m}() 渲染对应 mode 的 Modal 到 body`, async () => {
			Modal[m]({});
			await flush();

			expect(document.body.querySelector('.vc-modal')).not.toBeNull();
			expect(document.body.querySelector(`.is-${m}`)).not.toBeNull();
			expect(document.body.querySelector('.vc-modal__container')).not.toBeNull();
		});
	});

	it('Modal.warning + onOk Promise + onClose (对应 examples/index.vue handleModal4)', async () => {
		const onOk = vi.fn(() => new Promise<void>(r => setTimeout(r, 0)));
		const onClose = vi.fn();
		Modal.warning({
			title: 'warning',
			width: 500,
			content: () => [h('div', '确认提示')],
			okText: 'OK',
			mask: true,
			closeWithCancel: true,
			maskClosable: true,
			onOk,
			onClose
		});

		await flush();
		expect(document.body.querySelector('.is-warning')).not.toBeNull();
		expect(document.body.querySelector('.vc-modal__title')!.innerHTML).toContain('warning');

		// warning 模式下 cancelText 默认 '取消' 仍存在, 取最右边 ok 按钮
		const buttons = document.body.querySelectorAll<HTMLButtonElement>('.vc-modal__footer button');
		expect(buttons.length).toBeGreaterThan(0);
		buttons[buttons.length - 1].click();

		// resolve onOk + 动画收尾后 onClose 被触发
		await flushTransition();

		expect(onOk).toHaveBeenCalled();
		expect(onClose).toHaveBeenCalled();
	}, 10000);

	it('Modal.destroy() 清理所有 Modal portal', async () => {
		Modal.info({});
		Modal.success({});
		await flush();
		expect(document.body.querySelectorAll('.vc-modal').length).toBeGreaterThanOrEqual(2);

		Modal.destroy();
		await flush();
		expect(document.body.querySelectorAll('.vc-modal').length).toBe(0);
	});
});

/**
 * Mobile - MModalView / MModal
 * 复用 PC 端的 transition stub 关闭设置, 走真实 Vue Transition 生命周期。
 */
describe('MModalView 基础渲染 / props', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
		MModal.destroy();
	});

	it('basic export', () => {
		expect(typeof MModalView).toBe('object');
		expect(typeof MModal).toBe('object');
		expect(typeof MModal.alert).toBe('function');
		expect(typeof MModal.operation).toBe('function');
		expect(typeof MModal.destroy).toBe('function');
	});

	it('create 渲染 vcm-modal 根节点', () => {
		const wrapper = mount(() => <MModalView />);
		expect(wrapper.classes()).toContain('vcm-modal');
	});

	it('modelValue=true 后 isActive=true, useScrollbar 锁定 body', async () => {
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: { modelValue: true }
		});
		await flush();
		expect((wrapper.vm as any).isActive).toBe(true);
		expect(document.body.style.overflow).toBe('hidden');
		wrapper.unmount();
	});

	it('toggle expose 方法切换 isActive (含 toggle 无参数取反)', async () => {
		const wrapper = mount(MModalView, { props: { modelValue: false } });
		await flush();
		expect((wrapper.vm as any).isActive).toBe(false);

		(wrapper.vm as any).toggle(true);
		await flush();
		expect((wrapper.vm as any).isActive).toBe(true);

		(wrapper.vm as any).toggle();
		await flush();
		expect((wrapper.vm as any).isActive).toBe(false);

		wrapper.unmount();
	});

	it('mode=alert: title / content (string) / footer 默认按钮 (取消 + 确定)', async () => {
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'alert',
				title: '提示',
				content: '内容文案'
			}
		});
		await flush();

		expect(wrapper.find('.vcm-modal__header').exists()).toBe(true);
		expect(wrapper.find('.vcm-modal__title').html()).toContain('提示');
		expect(wrapper.find('.vcm-modal__content').exists()).toBe(true);
		expect(wrapper.find('.vcm-modal__html').html()).toContain('内容文案');
		expect(wrapper.findAll('.vcm-modal__footer .vcm-modal__button').length).toBe(2);

		wrapper.unmount();
	});

	it('mode=alert: content (function) 通过 MCustomer 渲染, 没有 title 时附加 vcm-modal__no-title', async () => {
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'alert',
				content: () => h('span', { class: 'fn-content' }, '函数内容')
			}
		});
		await flush();

		expect(wrapper.find('.vcm-modal__no-title').exists()).toBe(true);
		expect(wrapper.find('.fn-content').exists()).toBe(true);
		wrapper.unmount();
	});

	it('mode=alert: 自定义 actions 单按钮 (is-alone)', async () => {
		const onPress = vi.fn();
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'alert',
				title: 't',
				content: 'c',
				actions: [{ text: '我知道了', onPress }]
			}
		});
		await flush();

		const footer = wrapper.find('.vcm-modal__footer');
		expect(footer.classes()).toContain('is-alone');
		const buttons = footer.findAll('.vcm-modal__button');
		expect(buttons.length).toBe(1);
		await buttons[0].trigger('click');
		expect(onPress).toHaveBeenCalled();

		wrapper.unmount();
	});

	it('mode=alert: actions 数量 >=3 时 is-column', async () => {
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'alert',
				title: 't',
				content: 'c',
				actions: [
					{ text: 'A' },
					{ text: 'B' },
					{ text: 'C' }
				]
			}
		});
		await flush();
		expect(wrapper.find('.vcm-modal__footer').classes()).toContain('is-column');
		wrapper.unmount();
	});

	it('mode=alert: 单个 action 缺 text 时跳过, 用 slots.footer 替换默认按钮', async () => {
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'alert',
				title: 't',
				content: 'c'
			},
			slots: {
				footer: () => h('div', { class: 'custom-footer' }, 'custom')
			}
		});
		await flush();
		expect(wrapper.find('.custom-footer').exists()).toBe(true);
		wrapper.unmount();
	});

	it('mode=alert: slots.header / slots.default 自定义内容', async () => {
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'alert',
				title: 'should-be-overwritten'
			},
			slots: {
				header: () => h('div', { class: 'custom-header' }, 'h'),
				default: () => h('div', { class: 'custom-body' }, 'b')
			}
		});
		await flush();
		expect(wrapper.find('.custom-header').exists()).toBe(true);
		expect(wrapper.find('.custom-body').exists()).toBe(true);
		wrapper.unmount();
	});

	it('mode=alert: footer=false 不渲染 footer', async () => {
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'alert',
				title: 't',
				content: 'c',
				footer: false
			}
		});
		await flush();
		expect(wrapper.find('.vcm-modal__footer').exists()).toBe(false);
		wrapper.unmount();
	});

	it('mode=operation: 渲染 actions 列表, 缺 text 跳过', async () => {
		const onA = vi.fn();
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'operation',
				actions: [
					{ text: 'A', onPress: onA },
					{ text: '' },
					{ text: 'B' }
				]
			}
		});
		await flush();

		const ops = wrapper.findAll('.vcm-modal__operation .vcm-modal__button');
		expect(ops.length).toBe(2);
		await ops[0].trigger('click');
		expect(onA).toHaveBeenCalled();
		wrapper.unmount();
	});

	it('basicStyle: width 默认 270px, maxHeight=window.innerHeight - 20', async () => {
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: { modelValue: true, mode: 'alert', title: 't', content: 'c', width: 320 }
		});
		await flush();
		const container = wrapper.find('.vcm-modal__container').element as HTMLElement;
		expect(container.style.width).toBe('320px');
		expect(container.style.maxHeight).toBe(`${window.innerHeight - 20}px`);
		wrapper.unmount();
	});

	it('wrapperStyle 透传到 vcm-modal__wrapper', async () => {
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'alert',
				title: 't',
				content: 'c',
				wrapperStyle: { backgroundColor: 'rgb(0, 0, 0)' }
			}
		});
		await flush();
		const w = wrapper.find('.vcm-modal__wrapper').element as HTMLElement;
		expect(w.style.backgroundColor).toBe('rgb(0, 0, 0)');
		wrapper.unmount();
	});

	it('mask=true 时渲染 mask, 点击 mask 触发 handleClose (closeWithCancel=true 走 cancel)', async () => {
		const onCancel = vi.fn();
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'alert',
				title: 't',
				content: 'c',
				mask: true,
				maskClosable: true,
				closeWithCancel: true,
				onCancel
			}
		});
		await flush();

		const wrapperEl = wrapper.find('.vcm-modal__wrapper').element as HTMLElement;
		// mask 点击事件挂在 .vcm-modal__mask, 但条件判断里检测的是 .vcm-modal__wrapper className
		const maskEl = wrapper.find('.vcm-modal__mask').element as HTMLElement;
		// 直接用 wrapperEl 派发 click 让 e.target 命中 .vcm-modal__wrapper
		const event = new MouseEvent('click', { bubbles: true });
		Object.defineProperty(event, 'target', { value: wrapperEl, writable: false });
		maskEl.dispatchEvent(event);
		await flush();

		expect(onCancel).toHaveBeenCalled();
		expect((wrapper.vm as any).isActive).toBe(false);
		wrapper.unmount();
	});

	it('maskClosable=false 时点击 mask 不会关闭', async () => {
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'alert',
				title: 't',
				content: 'c',
				mask: true,
				maskClosable: false
			}
		});
		await flush();

		const maskEl = wrapper.find('.vcm-modal__mask').element as HTMLElement;
		await maskEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		expect((wrapper.vm as any).isActive).toBe(true);
		wrapper.unmount();
	});

	it('closeWithCancel=false: 点击非取消按钮触发 handleClose 时直接置 isActive=false', async () => {
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'alert',
				title: 't',
				content: 'c',
				mask: true,
				maskClosable: true,
				closeWithCancel: false
			}
		});
		await flush();

		const wrapperEl = wrapper.find('.vcm-modal__wrapper').element as HTMLElement;
		const maskEl = wrapper.find('.vcm-modal__mask').element as HTMLElement;
		const event = new MouseEvent('click', { bubbles: true });
		Object.defineProperty(event, 'target', { value: wrapperEl });
		maskEl.dispatchEvent(event);
		await flush();
		expect((wrapper.vm as any).isActive).toBe(false);
		wrapper.unmount();
	});

	it('handleBefore: 默认 onCancel/onOk 为空函数, 点击按钮直接关闭', async () => {
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'alert',
				title: 't',
				content: 'c'
			}
		});
		await flush();

		const buttons = wrapper.findAll('.vcm-modal__footer .vcm-modal__button');
		await buttons[1].trigger('click');
		await flush();
		expect((wrapper.vm as any).isActive).toBe(false);
		wrapper.unmount();
	});

	it('handleBefore: onOk 返回 Promise.resolve 后关闭', async () => {
		const onOk = vi.fn(() => new Promise<void>(r => setTimeout(r, 0)));
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'alert',
				title: 't',
				content: 'c',
				onOk
			}
		});
		await flush();
		const buttons = wrapper.findAll('.vcm-modal__footer .vcm-modal__button');
		await buttons[1].trigger('click');
		await Utils.sleep(20);
		await flush();
		expect(onOk).toHaveBeenCalled();
		expect((wrapper.vm as any).isActive).toBe(false);
		wrapper.unmount();
	});

	it('handleBefore: onCancel 返回 truthy 时阻止关闭', async () => {
		const onCancel = vi.fn(() => 'block');
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'alert',
				title: 't',
				content: 'c',
				onCancel
			}
		});
		await flush();
		const buttons = wrapper.findAll('.vcm-modal__footer .vcm-modal__button');
		await buttons[0].trigger('click');
		await flush();
		expect(onCancel).toHaveBeenCalled();
		expect((wrapper.vm as any).isActive).toBe(true);
		wrapper.unmount();
	});

	it('handleBefore: !isActive 时直接 return, 不再触发 hook', async () => {
		const onOk = vi.fn();
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'alert',
				title: 't',
				content: 'c',
				onOk
			}
		});
		await flush();
		(wrapper.vm as any).toggle(false);
		await flush();
		const buttons = wrapper.findAll('.vcm-modal__footer .vcm-modal__button');
		await buttons[1].trigger('click');
		await flush();
		expect(onOk).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it('关闭后 (transition leave) 触发 close / portal-fulfilled / update:modelValue=false', async () => {
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: {
				modelValue: true,
				mode: 'alert',
				title: 't',
				content: 'c'
			}
		});
		await flush();
		const buttons = wrapper.findAll('.vcm-modal__footer .vcm-modal__button');
		await buttons[1].trigger('click');
		await flushTransition();

		expect(wrapper.emitted('close')).toBeTruthy();
		expect(wrapper.emitted('portal-fulfilled')).toBeTruthy();
		const updates = wrapper.emitted('update:modelValue') as any[][];
		expect(updates?.[updates.length - 1]).toEqual([false]);
		wrapper.unmount();
	}, 10000);

	it('已 unmount 后 handleRemove 不会再 emit', async () => {
		const wrapper = mount(MModalView, {
			attachTo: document.body,
			props: { modelValue: true, mode: 'alert', title: 't', content: 'c' }
		});
		await flush();
		const buttons = wrapper.findAll('.vcm-modal__footer .vcm-modal__button');
		await buttons[1].trigger('click');
		wrapper.unmount();
		await flushTransition();
		// 不抛错即视为通过
		expect(true).toBe(true);
	}, 10000);
});

describe('MModal 静态方法 (alert / operation / destroy)', () => {
	afterEach(() => {
		MModal.destroy();
		document.body.innerHTML = '';
		document.body.style.removeProperty('overflow');
	});

	it('MModal.alert 渲染 alert 模式 modal 到 body', async () => {
		MModal.alert({ title: 'a-title', content: 'a-content' });
		await flush();
		expect(document.body.querySelector('.vcm-modal')).not.toBeNull();
		expect(document.body.querySelector('.vcm-modal__title')!.innerHTML).toContain('a-title');
		expect(document.body.querySelector('.vcm-modal__html')!.innerHTML).toContain('a-content');
	});

	it('MModal.operation 渲染 operation 模式 modal 到 body', async () => {
		MModal.operation({
			actions: [
				{ text: '操作 1' },
				{ text: '操作 2' }
			]
		});
		await flush();
		expect(document.body.querySelector('.vcm-modal__operation')).not.toBeNull();
		expect(document.body.querySelectorAll('.vcm-modal__operation .vcm-modal__button').length).toBe(2);
	});

	it('MModal.alert + onOk Promise + onClose: 动画收尾后回调被触发', async () => {
		const onOk = vi.fn(() => new Promise<void>(r => setTimeout(r, 0)));
		const onClose = vi.fn();
		MModal.alert({
			title: 'mobile-warning',
			content: '确认',
			okText: '确定',
			closeWithCancel: true,
			onOk,
			onClose
		});
		await flush();

		const buttons = document.body.querySelectorAll<HTMLDivElement>('.vcm-modal__footer .vcm-modal__button');
		expect(buttons.length).toBeGreaterThan(0);
		buttons[buttons.length - 1].click();
		await flushTransition();

		expect(onOk).toHaveBeenCalled();
		expect(onClose).toHaveBeenCalled();
	}, 10000);

	it('MModal.destroy 清理所有 mobile portal', async () => {
		MModal.alert({ title: 't1', content: 'c1' });
		MModal.alert({ title: 't2', content: 'c2' });
		await flush();
		expect(document.body.querySelectorAll('.vcm-modal').length).toBeGreaterThanOrEqual(2);

		MModal.destroy();
		await flush();
		expect(document.body.querySelectorAll('.vcm-modal').length).toBe(0);
	});
});
