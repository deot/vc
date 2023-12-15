import { createApp } from 'vue';
import { VcError, VcInstance, install } from '@deot/vc-components';
import { Utils } from '@deot/dev-test';

// @vitest-environment jsdom
describe('index.ts', () => {
	it('basic', () => {
		expect(typeof VcError).toBe('function');
		expect(typeof VcInstance).toBe('object');
		expect(typeof install).toBe('function');
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
		expect((VcInstance.options.Theme.variables as any).background).toBe('white');
	});

	it('VcInstance, globalEvent', async () => {
		expect(VcInstance.globalEvent).toEqual({});

		const event = new Event('click');
		document.body.dispatchEvent(event);
		await Utils.sleep(10);

		expect(VcInstance.globalEvent).toBe(event);
	});

	it('install', async () => {
		const app = createApp({});

		install(app, {});
		expect(app.config.globalProperties.$vc).toBe(VcInstance);
	});
});
