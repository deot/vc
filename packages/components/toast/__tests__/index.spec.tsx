// @vitest-environment jsdom

import { Toast, ToastView, MToast, MToastView } from '@deot/vc-components';
import { mount, config } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';
import { h, nextTick } from 'vue';
import { vi } from 'vitest';

// @vue/test-utils 默认会把 Transition 替换成 stub, 导致 v-show 拿不到 vnode.transition,
// onAfterLeave 不会触发。这里关闭 stub, 走真实 Transition 生命周期。
config.global.stubs.transition = false;
config.global.stubs['transition-group'] = false;

const flush = async () => {
	await nextTick();
	await Utils.sleep(0);
	await nextTick();
};

// isActive 未 expose, 通过 v-show 控制的 __wrapper display 判断是否处于显示态
const isVisible = (wrapper: any) => {
	const el = wrapper.find('.vcm-toast__wrapper').element as HTMLElement;
	return el.style.display !== 'none';
};

// 等待 TransitionFade 的离场动画完成。toast 的 leave duration=150ms,
// 通过 use-transition 的 createNext 设置 setTimeout(done, duration) 触发 onAfterLeave。
const flushTransition = async (extra = 400) => {
	await nextTick();
	await Utils.sleep(extra);
	await nextTick();
	await nextTick();
};

describe('index.ts', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		MToast.destroy();
	});

	it('basic', () => {
		expect(typeof Toast).toBe('object');
		expect(typeof ToastView).toBe('object');
		expect(typeof MToast).toBe('object');
		expect(typeof MToastView).toBe('object');

		// Toast / MToast 为同一引用, ToastView / MToastView 同理
		expect(Toast).toBe(MToast);
		expect(ToastView).toBe(MToastView);

		// 静态方法
		expect(typeof MToast.info).toBe('function');
		expect(typeof MToast.success).toBe('function');
		expect(typeof MToast.loading).toBe('function');
		expect(typeof MToast.warning).toBe('function');
		expect(typeof MToast.error).toBe('function');
		expect(typeof MToast.destroy).toBe('function');
	});

	it('create', async () => {
		const wrapper = mount(() => (<ToastView />));

		expect(wrapper.classes()).toContain('vcm-toast');
	});
});

describe('ToastView 基础渲染', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('渲染 vcm-toast 根节点, 含 __bg / __wrapper 子节点', async () => {
		const wrapper = mount(MToastView, { attachTo: document.body });
		await flush();

		expect(wrapper.classes()).toContain('vcm-toast');
		expect(wrapper.find('.vcm-toast__bg').exists()).toBe(true);
		expect(wrapper.find('.vcm-toast__wrapper').exists()).toBe(true);

		wrapper.unmount();
	});

	it('onMounted 后 __wrapper 显示', async () => {
		const wrapper = mount(MToastView, { attachTo: document.body });
		await flush();

		expect(isVisible(wrapper)).toBe(true);

		wrapper.unmount();
	});

	it('content：{ type: \'html\' } 写入 __content 的 innerHTML，字符串按文本', async () => {
		const wrapper = mount(MToastView, {
			attachTo: document.body,
			props: { content: { type: 'html', value: '提示语 <br> 换行' } }
		});
		await flush();

		const content = wrapper.find('.vcm-toast__content');
		expect(content.exists()).toBe(true);
		expect(content.element.innerHTML).toContain('提示语');
		expect(content.element.innerHTML).toContain('<br>');

		await wrapper.setProps({ content: '提示语 <br> 换行' });
		expect(content.find('br').exists()).toBe(false);
		expect(content.text()).toBe('提示语 <br> 换行');

		wrapper.unmount();
	});

	it('content (function) 通过 MCustomer 渲染', async () => {
		const renderFn = vi.fn(() => h('span', { class: 'fn-content' }, '函数内容'));
		const wrapper = mount(MToastView, {
			attachTo: document.body,
			props: { content: renderFn }
		});
		await flush();

		expect(renderFn).toHaveBeenCalled();
		expect(wrapper.find('.fn-content').exists()).toBe(true);
		expect(wrapper.find('.fn-content').text()).toBe('函数内容');
		// function 内容不会渲染 __content
		expect(wrapper.find('.vcm-toast__content').exists()).toBe(false);

		wrapper.unmount();
	});

	it('content 为空 (非 string/function) 时不渲染内容节点', async () => {
		const wrapper = mount(MToastView, { attachTo: document.body });
		await flush();

		expect(wrapper.find('.vcm-toast__content').exists()).toBe(false);
		expect(wrapper.find('.vc-customer').exists()).toBe(false);

		wrapper.unmount();
	});

	it('mode=loading 渲染 __loading (MSpin)', async () => {
		const wrapper = mount(MToastView, {
			attachTo: document.body,
			props: { mode: 'loading' }
		});
		await flush();

		expect(wrapper.find('.vcm-toast__loading').exists()).toBe(true);

		wrapper.unmount();
	});

	it('非 loading 模式不渲染 __loading', async () => {
		const wrapper = mount(MToastView, {
			attachTo: document.body,
			props: { mode: 'info' }
		});
		await flush();

		expect(wrapper.find('.vcm-toast__loading').exists()).toBe(false);

		wrapper.unmount();
	});

	it('__bg touchmove 阻止默认行为 (不抛错)', async () => {
		const wrapper = mount(MToastView, { attachTo: document.body });
		await flush();

		expect(() => wrapper.find('.vcm-toast__bg').trigger('touchmove')).not.toThrow();

		wrapper.unmount();
	});
});

describe('ToastView 关闭逻辑 (maskClosable / duration)', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('maskClosable=true (默认): 点击 __bg 关闭', async () => {
		const wrapper = mount(MToastView, {
			attachTo: document.body,
			props: { duration: 0 }
		});
		await flush();

		expect(isVisible(wrapper)).toBe(true);
		await wrapper.find('.vcm-toast__bg').trigger('click');
		await flushTransition();
		expect(isVisible(wrapper)).toBe(false);

		wrapper.unmount();
	}, 10000);

	it('maskClosable=false: 点击 __bg 不关闭', async () => {
		const wrapper = mount(MToastView, {
			attachTo: document.body,
			props: { duration: 0, maskClosable: false }
		});
		await flush();

		await wrapper.find('.vcm-toast__bg').trigger('click');
		await flush();
		expect(isVisible(wrapper)).toBe(true);

		wrapper.unmount();
	});

	it('duration 到时后自动关闭', async () => {
		const wrapper = mount(MToastView, {
			attachTo: document.body,
			props: { duration: 30 }
		});
		await flush();

		expect(isVisible(wrapper)).toBe(true);
		await Utils.sleep(60);
		await flushTransition();
		expect(isVisible(wrapper)).toBe(false);

		wrapper.unmount();
	}, 10000);

	it('duration=0: 不会自动关闭', async () => {
		const wrapper = mount(MToastView, {
			attachTo: document.body,
			props: { duration: 0 }
		});
		await flush();

		await Utils.sleep(60);
		await flush();
		expect(isVisible(wrapper)).toBe(true);

		wrapper.unmount();
	});

	it('关闭后 (动画结束) 触发 close / portal-fulfilled', async () => {
		const wrapper = mount(MToastView, {
			attachTo: document.body,
			props: { duration: 30, content: 'hi' }
		});
		await flush();

		await Utils.sleep(60);
		await flushTransition();

		expect(wrapper.emitted('close')).toBeTruthy();
		expect(wrapper.emitted('portal-fulfilled')).toBeTruthy();

		wrapper.unmount();
	}, 10000);
});

describe('ToastView expose / watch', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('expose: setContent 更新内容', async () => {
		const wrapper = mount(MToastView, { attachTo: document.body });
		await flush();

		(wrapper.vm as any).setContent('动态内容');
		await flush();
		expect(wrapper.find('.vcm-toast__content').element.innerHTML).toContain('动态内容');

		wrapper.unmount();
	});

	it('expose: setDuration 重设定时器后自动关闭', async () => {
		const wrapper = mount(MToastView, {
			attachTo: document.body,
			props: { duration: 0 }
		});
		await flush();

		expect(isVisible(wrapper)).toBe(true);
		(wrapper.vm as any).setDuration(30);
		await Utils.sleep(60);
		await flushTransition();
		expect(isVisible(wrapper)).toBe(false);

		wrapper.unmount();
	}, 10000);

	it('expose: setDuration 会清理已存在的定时器', async () => {
		// 挂载时 duration=3000 已经建立定时器, 再次 setDuration 走 clearTimeout 分支
		const wrapper = mount(MToastView, {
			attachTo: document.body,
			props: { duration: 3000 }
		});
		await flush();

		expect(isVisible(wrapper)).toBe(true);
		(wrapper.vm as any).setDuration(30);
		await Utils.sleep(60);
		await flushTransition();
		expect(isVisible(wrapper)).toBe(false);

		wrapper.unmount();
	}, 10000);

	it('expose: setDuration(0) 不设置定时器', async () => {
		const wrapper = mount(MToastView, {
			attachTo: document.body,
			props: { duration: 0 }
		});
		await flush();

		(wrapper.vm as any).setDuration(0);
		await Utils.sleep(60);
		await flush();
		expect(isVisible(wrapper)).toBe(true);

		wrapper.unmount();
	});

	it('expose: destroy / remove / close / hide 均触发 close / portal-fulfilled', async () => {
		for (const key of ['destroy', 'remove', 'close', 'hide'] as const) {
			const wrapper = mount(MToastView, {
				attachTo: document.body,
				props: { duration: 0 }
			});
			await flush();

			(wrapper.vm as any)[key]();
			await flush();

			expect(wrapper.emitted('close')).toBeTruthy();
			expect(wrapper.emitted('portal-fulfilled')).toBeTruthy();

			wrapper.unmount();
		}
	});

	it('watch content: props 变化时同步内容', async () => {
		const wrapper = mount(MToastView, {
			attachTo: document.body,
			props: { content: 'a' }
		});
		await flush();
		expect(wrapper.find('.vcm-toast__content').element.innerHTML).toContain('a');

		await wrapper.setProps({ content: 'b' });
		await flush();
		expect(wrapper.find('.vcm-toast__content').element.innerHTML).toContain('b');

		wrapper.unmount();
	});

	it('onUnmounted 清理定时器不抛错', async () => {
		const wrapper = mount(MToastView, {
			attachTo: document.body,
			props: { duration: 3000 }
		});
		await flush();

		expect(() => wrapper.unmount()).not.toThrow();
	});
});

describe('MToast 静态方法 (info / success / loading / warning / error / destroy)', () => {
	afterEach(() => {
		MToast.destroy();
		document.body.innerHTML = '';
	});

	it('MToast.info 传入 { type, value } 时作为内容，而不是选项', async () => {
		MToast.info({ type: 'text', value: '<b class="inner">text</b>' });
		await nextTick();

		const content = document.body.querySelector('.vcm-toast__content')!;
		expect(content.querySelector('.inner')).toBe(null);
		expect(content.textContent).toBe('<b class="inner">text</b>');
		MToast.destroy();
	});

	it('MToast.info 渲染 toast 到 body', async () => {
		MToast.info('提示语', 0);
		await flush();

		expect(document.body.querySelector('.vcm-toast')).not.toBeNull();
		expect(document.body.querySelector('.vcm-toast__content')!.innerHTML).toContain('提示语');
	});

	(['success', 'warning', 'error'] as const).forEach((m) => {
		it(`MToast.${m}() 渲染 toast 到 body`, async () => {
			MToast[m]('内容', 0);
			await flush();

			expect(document.body.querySelector('.vcm-toast')).not.toBeNull();
			expect(document.body.querySelector('.vcm-toast__content')!.innerHTML).toContain('内容');
		});
	});

	it('MToast.loading 渲染 loading (默认 duration=0, 不自动销毁)', async () => {
		MToast.loading('加载中', 0);
		await flush();

		expect(document.body.querySelector('.vcm-toast__loading')).not.toBeNull();
		await Utils.sleep(40);
		expect(document.body.querySelector('.vcm-toast')).not.toBeNull();
	});

	it('MToast.info 支持 onClose 回调 (自动关闭后触发)', async () => {
		const onClose = vi.fn();
		MToast.info('提示', 30, onClose);
		await flush();

		await Utils.sleep(60);
		await flushTransition();

		expect(onClose).toHaveBeenCalled();
	}, 10000);

	it('MToast.info 支持对象参数写法', async () => {
		MToast.info({ content: '对象写法', duration: 0 });
		await flush();

		expect(document.body.querySelector('.vcm-toast__content')!.innerHTML).toContain('对象写法');
	});

	it('MToast.destroy 清理所有 toast portal', async () => {
		MToast.info('a', 0);
		MToast.info('b', 0);
		await flush();
		expect(document.body.querySelectorAll('.vcm-toast').length).toBeGreaterThanOrEqual(2);

		MToast.destroy();
		await flush();
		expect(document.body.querySelectorAll('.vcm-toast').length).toBe(0);
	});
});

describe('函数式调用的参数', () => {
	afterEach(() => {
		MToast.destroy();
		document.body.innerHTML = '';
	});

	// 最终传给 MToastView 的属性
	const read = (leaf: any) => leaf.propsData.value;
	const html = { type: 'html', value: '<b class="inner">text</b>' };

	it('按位置传参，第四位是 maskClosable', () => {
		const onClose = vi.fn();
		const leaf = MToast.info('文字', 123, onClose, false);

		expect(read(leaf)).toMatchObject({ content: '文字', duration: 123, maskClosable: false, mode: 'info' });
		leaf.resolve();
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('传一个选项对象', () => {
		const onClose = vi.fn();
		const leaf = MToast.error({ duration: 20, content: '文字', onClose });

		expect(read(leaf)).toMatchObject({ content: '文字', duration: 20, mode: 'error' });
		leaf.resolve();
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('两种写法混用：最后一位的对象是选项', () => {
		const leaf = MToast.info('文字', { duration: 0, maskClosable: false });
		expect(read(leaf)).toMatchObject({ content: '文字', duration: 0, maskClosable: false });

		// 最后一位是 null 等于没传
		const leaf$ = MToast.info('文字', null as any);
		expect(read(leaf$).content).toBe('文字');
		expect(read(leaf$)).not.toHaveProperty('duration');
	});

	it('{ type, value } 是内容，后面可以继续跟位置参数或选项对象', () => {
		const alone = read(MToast.info(html));
		expect(alone.content).toEqual(html);
		expect(alone).not.toHaveProperty('type');
		expect(alone).not.toHaveProperty('value');

		expect(read(MToast.info(html, 0))).toMatchObject({ content: html, duration: 0 });
		expect(read(MToast.info(html, { duration: 0, maskClosable: false }))).toMatchObject({ content: html, duration: 0, maskClosable: false });
		expect(read(MToast.info({ content: html, duration: 0 }))).toMatchObject({ content: html, duration: 0 });
	});

	it('上一次调用的参数不会留到下一次', () => {
		const onClose = vi.fn();
		MToast.info('a', 0, onClose, false);
		const leaf = MToast.info('b');

		expect(read(leaf).content).toBe('b');
		expect(read(leaf)).not.toHaveProperty('duration');
		expect(read(leaf)).not.toHaveProperty('maskClosable');
		leaf.resolve();
		expect(onClose).not.toHaveBeenCalled();
	});
});
