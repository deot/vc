import { createApp, defineComponent } from 'vue';
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

	it('VcInstance, globalEvent', async () => {
		expect(VcInstance.globalEvent).toEqual({});

		const event = new Event('click');
		document.body.dispatchEvent(event);
		await Utils.sleep(10);

		expect(VcInstance.globalEvent).toBe(event);
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
