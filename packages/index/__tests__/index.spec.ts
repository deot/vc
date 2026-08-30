// @vitest-environment jsdom

import { createVcPlugin, enUS, useLocale, zhCN } from '@deot/vc';
import { defineComponent } from 'vue';
import { mount, config } from '@vue/test-utils';

describe('index.ts', () => {
	const plugin = createVcPlugin();
	config.global.plugins = [plugin as any];
	it('create', async () => {
		const Wrapper = defineComponent({
			template: `<Popover />`
		});

		const wrapper = mount(Wrapper);
		expect(wrapper.classes()).toContain('vc-popover');
	});

	it('locale exports', () => {
		expect(zhCN.name).toBe('zh-CN');
		expect(enUS.name).toBe('en-US');
		expect(useLocale).toBeTypeOf('function');
	});
});
