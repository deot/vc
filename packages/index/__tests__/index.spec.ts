// @vitest-environment jsdom

import { createVcPlugin } from '@deot/vc';
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
});
