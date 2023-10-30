// @vitest-environment jsdom

import { Countdown } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Countdown).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Countdown />));

		expect(wrapper.classes()).toContain('vc-countdown');
	});
});
