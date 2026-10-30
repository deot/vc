import { createApp, defineComponent } from 'vue';
import { VcError, VcInstance, VirtualElement, defineVcPlugin } from '@deot/vc-components';
import { enUS, zhCN } from '@deot/vc-locale';
import { fireMouse } from '../../../hooks/__tests__/fixtures/drag';
import { rectOf } from './fixtures/click';

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

	it('VirtualElement', () => {
		const rect = { left: 1, top: 2, width: 3, height: 4 };
		const el = document.createElement('div');
		const virtual = new VirtualElement(rect, el);
		// 盒子按创建时的值保存，之后改动传入的对象不影响
		rect.left = 100;
		expect(virtual.getBoundingClientRect()).toEqual({ left: 1, top: 2, width: 3, height: 4 });
		expect(virtual.contextElement).toBe(el);
		expect(new VirtualElement(rect).contextElement).toBeUndefined();
	});

	it('VirtualElement.fromEvent', () => {
		const button = document.createElement('button');
		const label = document.createElement('span');
		button.append(label);
		document.body.append(button);
		button.getBoundingClientRect = () => rectOf(10, 20, 100, 40);
		const eventOf = (target: EventTarget, init?: MouseEventInit) => fireMouse(target, 'contextmenu', init);

		// 点在按钮里：取整个按钮此刻的盒子
		const inside = eventOf(label, { detail: 1, clientX: 40, clientY: 30 });
		expect(VirtualElement.fromEvent(inside)!.getBoundingClientRect()).toEqual({ left: 10, top: 20, width: 100, height: 40 });
		expect(VirtualElement.fromEvent(inside)!.contextElement).toBe(button);
		// 按钮已不在：取点下的那个点；没有坐标时为 null
		button.remove();
		expect(VirtualElement.fromEvent(inside)!.getBoundingClientRect()).toEqual({ left: 40, top: 30, width: 0, height: 0 });
		expect(VirtualElement.fromEvent(eventOf(label))).toBeNull();
		// 点在页面空白处：取点下的那个点
		expect(VirtualElement.fromEvent(eventOf(document.body, { detail: 1, clientX: 5, clientY: 6 }))!.getBoundingClientRect())
			.toEqual({ left: 5, top: 6, width: 0, height: 0 });
	});

	it('VirtualElement.fromClick', () => {
		const click = (target: EventTarget, init?: MouseEventInit) => fireMouse(target, 'click', init);
		const button = document.createElement('button');
		const label = document.createElement('span');
		const text = document.createTextNode('a');
		label.append(text);
		button.append(label);
		document.body.append(button);
		button.getBoundingClientRect = () => rectOf(10, 20, 100, 40);
		label.getBoundingClientRect = () => rectOf(30, 30, 20, 10);

		// 点在按钮里的文字、文本节点上，取整个按钮；用到时才量，量的是它此刻的盒子
		click(text, { detail: 1, clientX: 40, clientY: 35 });
		const trigger = VirtualElement.fromClick()!;
		expect(trigger).toBeInstanceOf(VirtualElement);
		expect(trigger.getBoundingClientRect()).toEqual({ left: 10, top: 20, width: 100, height: 40 });
		expect(trigger.contextElement).toBe(button);
		button.getBoundingClientRect = () => rectOf(10, 120, 100, 40);
		// 取到的结果之后不变；再取量的是按钮此刻的位置
		expect(trigger.getBoundingClientRect()).toEqual({ left: 10, top: 20, width: 100, height: 40 });
		expect(VirtualElement.fromClick()!.getBoundingClientRect()).toEqual({ left: 10, top: 120, width: 100, height: 40 });

		// 按钮被移除、隐藏后：退到点下的那个点
		button.remove();
		expect(VirtualElement.fromClick()!.getBoundingClientRect()).toEqual({ left: 40, top: 35, width: 0, height: 0 });
		document.body.append(button);
		button.getBoundingClientRect = () => rectOf(0, 0, 0, 0);
		expect(VirtualElement.fromClick()!.getBoundingClientRect()).toEqual({ left: 40, top: 35, width: 0, height: 0 });

		// 键盘、el.click() 没有坐标：按钮不在时为 null
		click(button);
		expect(VirtualElement.fromClick()).toBeNull();

		// 不在按钮、链接里时取元素本身
		const cell = document.createElement('div');
		cell.getBoundingClientRect = () => rectOf(0, 0, 50, 20);
		document.body.append(cell);
		click(cell);
		expect(VirtualElement.fromClick()!.getBoundingClientRect()).toEqual({ left: 0, top: 0, width: 50, height: 20 });

		// 点在页面空白处、不是节点时清掉
		click(document.body, { detail: 1, clientX: 5, clientY: 5 });
		expect(VirtualElement.fromClick()).toBeNull();
		click(cell);
		click(document);
		expect(VirtualElement.fromClick()).toBeNull();
		button.remove();
		cell.remove();
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
