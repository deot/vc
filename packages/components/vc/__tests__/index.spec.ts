import { createApp, defineComponent } from 'vue';
import { vi } from 'vitest';
import { VcError, VcInstance, defineVcPlugin } from '@deot/vc-components';
import { Utils } from '@deot/dev-test';
import { enUS, zhCN } from '@deot/vc-locale';

// @vitest-environment jsdom
describe('index.ts', () => {
	it('basic', () => {
		expect(typeof VcError).toBe('function');
		expect(typeof VcInstance).toBe('object');
	});

	it('VcError', () => {
		const error = new VcError('any component', 'any error');
		expect(error.message).toMatch('[@deot/vc - any component]: any error');
	});

	it('VcError, none', () => {
		const error = new VcError();
		expect(error.message).toBeFalsy();
	});

	it('VcInstance', () => {
		const options = {
			Theme: {
				variables: {
					background: 'white'
				}
			}
		};
		VcInstance.configure();
		VcInstance.configure(options);
		expect((VcInstance.options.Theme!.variables).background).toBe('white');
	});

	it('VcInstance, locale', () => {
		VcInstance.configure({ locale: zhCN });
		expect(VcInstance.options.locale.name).toBe('zh-CN');

		VcInstance.configure({ locale: enUS });
		expect(VcInstance.options.locale.name).toBe('en-US');

		VcInstance.configure();
		VcInstance.configure({ locale: undefined });
		expect(VcInstance.options.locale.name).toBe('en-US');

		VcInstance.configure({ locale: zhCN });
	});

	it('VcInstance, getTriggerElement', async () => {
		const click = (target: EventTarget) => target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		const button = document.createElement('button');
		const text = document.createTextNode('a');
		button.append(text);
		document.body.append(button);

		await Utils.sleep(0);
		VcInstance.getTriggerElement();
		expect(VcInstance.getTriggerElement()).toBeNull();

		// 点击所在的任务里（含处理函数和之后的微任务）总是返回它；文本节点取所在元素
		let during: Element | null = null;
		button.addEventListener('click', () => (during = VcInstance.getTriggerElement()), { once: true });
		click(text);
		expect(during).toBe(button);
		await Promise.resolve();
		expect(VcInstance.getTriggerElement()).toBe(button);
		// 点击所在的任务里取过：之后的任务不再给
		await Utils.sleep(0);
		expect(VcInstance.getTriggerElement()).toBeNull();

		// 之后的任务（如请求回来）：只给第一个来取的
		click(button);
		await Utils.sleep(0);
		expect(VcInstance.getTriggerElement()).toBe(button);
		expect(VcInstance.getTriggerElement()).toBeNull();

		// 新的点击替换旧的
		const other = document.createElement('a');
		document.body.append(other);
		click(button);
		click(other);
		await Utils.sleep(0);
		expect(VcInstance.getTriggerElement()).toBe(other);

		// 已移出文档
		click(button);
		await Utils.sleep(0);
		button.remove();
		expect(VcInstance.getTriggerElement()).toBeNull();

		// 不是元素也不是节点
		click(document);
		await Utils.sleep(0);
		expect(VcInstance.getTriggerElement()).toBeNull();
		other.remove();
	});

	it('VcInstance, getTriggerElement 在假定时器下也在点击的任务结束后释放', async () => {
		const button = document.createElement('button');
		document.body.append(button);
		await Utils.sleep(0);
		VcInstance.getTriggerElement();
		vi.useFakeTimers();
		button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		// 定时器不走，靠消息排到之后的任务
		await new Promise((resolve) => {
			const channel = new MessageChannel();
			channel.port1.onmessage = () => (channel.port1.close(), resolve(null));
			channel.port2.postMessage(null);
		});
		vi.useRealTimers();
		expect(VcInstance.getTriggerElement()).toBe(button);
		expect(VcInstance.getTriggerElement()).toBeNull();
		button.remove();
	});

	it('defineVcPlugin', () => {
		const Foo = defineComponent({ name: 'vc-foo', render: () => null });
		const Bar = defineComponent({ name: 'vc-bar', render: () => null });
		const createVcPlugin = defineVcPlugin({ Foo, Bar });

		const app = createApp({});
		app.use(createVcPlugin({ locale: enUS }));
		expect(app.component('Foo')).toBe(Foo);
		expect(app.component('Bar')).toBe(Bar);
		expect(app.config.globalProperties.$vc).toBe(VcInstance);
		expect(VcInstance.options.locale.name).toBe('en-US');

		VcInstance.configure({ locale: zhCN });
	});

	it('defineVcPlugin, transfromComponentKey', () => {
		const Foo = defineComponent({ name: 'vc-foo', render: () => null });
		const Bar = defineComponent({ name: 'vc-bar', render: () => null });
		const createVcPlugin = defineVcPlugin({ Foo, Bar });

		const app = createApp({});
		app.use(createVcPlugin(undefined, key => (key === 'Foo' ? `V${key}` : '')));
		expect(app.component('VFoo')).toBe(Foo);
		expect(app.component('Foo')).toBeUndefined();
		// 返回空值时保留原名
		expect(app.component('Bar')).toBe(Bar);
	});
});
