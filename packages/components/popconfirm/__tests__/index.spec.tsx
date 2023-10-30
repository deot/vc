// @vitest-environment jsdom

import { Popconfirm } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Popconfirm).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Popconfirm />));

		expect(wrapper.classes()).toContain('vc-popconfirm');
	});
});
