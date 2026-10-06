// @vitest-environment jsdom

import { createApp, defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { Button, VcInstance, enUS, zhCN } from '@deot/vc';
import { createVcPlugin, Components } from '../src/index.full';
import * as Full from '../src/index.full';
import * as Mobile from '../src/index.mobile';
import * as Desktop from '../src/index.desktop';

const MOBILE_REGEXP = /^M[A-Z]/;
const DESKTOP_WITH_M = ['Marquee', 'Measuring', 'Modal', 'ModalView'];

describe('index.{full,desktop,mobile}.ts', () => {
	it('create', async () => {
		const Wrapper = defineComponent({
			template: `<div><Popover /><MPopover /></div>`
		});

		const wrapper = mount(Wrapper, {
			global: {
				plugins: [createVcPlugin()]
			}
		});
		expect(wrapper.findAll('.vc-popover').length).toBe(2);
		expect((wrapper.vm as any).$vc).toBe(VcInstance);
	});

	it('options', () => {
		const app = createApp({});
		app.use(createVcPlugin({ locale: enUS }));
		expect(VcInstance.options.locale.name).toBe('en-US');

		VcInstance.configure({ locale: zhCN });
	});

	it('transfromComponentKey', () => {
		const app = createApp({});
		app.use(createVcPlugin(undefined, key => (key === 'Button' ? `V${key}` : '')));
		expect(app.component('VButton')).toBe(Button);
		expect(app.component('Button')).toBeUndefined();
		expect(app.component('Popover')).toBe(Components.Popover);
	});

	it('Components', () => {
		const keys = Object.keys(Components);
		expect(keys).toEqual(expect.arrayContaining(['Button', 'MButton', 'Modal', 'MModal', 'MDatePickerView']));
		expect(keys.length).toBe(Object.keys(Mobile.Components).length + Object.keys(Desktop.Components).length);
	});

	it('index.mobile.ts', () => {
		const keys = Object.keys(Mobile.Components);
		expect(keys.length).toBeGreaterThan(0);
		expect(keys.every(key => MOBILE_REGEXP.test(key))).toBe(true);
		expect(keys).toContain('MDatePickerView');

		const app = createApp({});
		app.use(Mobile.createVcPlugin());
		expect(app.component('MButton')).toBe(Mobile.MButton);
		expect(app.component('Button')).toBeUndefined();
	});

	it('index.desktop.ts', () => {
		const keys = Object.keys(Desktop.Components);
		expect(keys.length).toBeGreaterThan(0);
		expect(keys.some(key => MOBILE_REGEXP.test(key))).toBe(false);
		expect(keys).toEqual(expect.arrayContaining(DESKTOP_WITH_M));

		const app = createApp({});
		app.use(Desktop.createVcPlugin());
		expect(app.component('Button')).toBe(Desktop.Button);
		expect(app.component('Modal')).toBe(Desktop.Modal);
		expect(app.component('MButton')).toBeUndefined();
	});

	it('re-exports', () => {
		[Full, Mobile, Desktop].forEach((entry) => {
			expect(entry.zhCN.name).toBe('zh-CN');
			expect(entry.Button).toBe(Button);
			expect(entry.VcInstance).toBe(VcInstance);
		});
	});
});
