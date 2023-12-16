// @vitest-environment jsdom

import { Toast, ToastView } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Toast).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<ToastView />));

		expect(wrapper.classes()).toContain('vc-toast');
	});
});
