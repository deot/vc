// @vitest-environment jsdom

import {
	Button,
	MButton,
	VcInstance,
	defineVcPlugin,
	useLocale,
	zhCN,
	enUS,
	Utils,
	Keyboard,
	IS_SERVER
} from '@deot/vc';

describe('index.ts', () => {
	it('components exports', () => {
		expect(Button).toBeTypeOf('object');
		expect(MButton).toBeTypeOf('object');
		expect(VcInstance).toBeTypeOf('object');
		expect(defineVcPlugin).toBeTypeOf('function');
	});

	it('locale exports', () => {
		expect(zhCN.name).toBe('zh-CN');
		expect(enUS.name).toBe('en-US');
		expect(useLocale).toBeTypeOf('function');
	});

	it('shared exports', () => {
		expect(Utils).toBeTypeOf('object');
		expect(Keyboard).toBeTruthy();
		expect(IS_SERVER).toBe(false);
	});

	it('no full registration exports', async () => {
		const v = await import('@deot/vc');
		expect('createVcPlugin' in v).toBe(false);
		expect('Components' in v).toBe(false);
	});
});
