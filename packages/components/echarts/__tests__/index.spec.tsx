// @vitest-environment jsdom

import { Echarts } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Echarts).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Echarts />));

		expect(wrapper.classes()).toContain('vc-echarts');
	});
});
