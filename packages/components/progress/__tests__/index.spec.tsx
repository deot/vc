// @vitest-environment jsdom

import { Progress } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Progress).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Progress />));

		expect(wrapper.classes()).toContain('vc-progress');
	});
	it.each(['line', 'circle'])('uses themed track color for %s', (type) => {
		const wrapper = mount(Progress, { props: { type } });
		const progress = wrapper.findComponent({ name: `vc-progress-${type}` });

		expect(progress.props('trackColor')).toBe('var(--vc-progress-background-color-light, var(--vc-background-color-light))');
		wrapper.unmount();
	});
	it.each(['line', 'circle'])('preserves explicit track color for %s', (type) => {
		const wrapper = mount(Progress, { props: { type, trackColor: '#123456' } });
		const progress = wrapper.findComponent({ name: `vc-progress-${type}` });

		expect(progress.props('trackColor')).toBe('#123456');
		if (type === 'circle') {
			expect(wrapper.find('svg path').attributes('stroke')).toBe('#123456');
		} else {
			expect(wrapper.find('.vc-progress-line__box').attributes('style')).toContain('rgb(18, 52, 86)');
		}
		wrapper.unmount();
	});
});
