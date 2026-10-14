// @vitest-environment jsdom

import { Spin } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Spin).toBe('object');
	});

	it('size, 默认图标按 px 设置尺寸，字符框跟随外层字体', () => {
		const wrapper = mount(() => (<Spin size={20} />));

		expect(wrapper.classes()).toContain('vc-spin');

		const span = wrapper.find('.vc-spin > span').element as HTMLElement;
		const svg = wrapper.find('svg').element as SVGElement;

		expect(span.style.fontSize).toBe('');
		expect(svg.style.width).toBe('20px');
		expect(svg.style.height).toBe('20px');
		// 对齐由字符框决定，不输出 vertical-align
		expect(svg.style.verticalAlign).toBe('');
	});

	it('size, loading 插槽的容器仍受 size 影响', () => {
		const wrapper = mount(() => (
			<Spin size={20}>
				{{ loading: () => <i class="custom" /> }}
			</Spin>
		));

		expect((wrapper.find('.vc-spin > span').element as HTMLElement).style.fontSize).toBe('20px');
		expect(wrapper.find('.custom').exists()).toBeTruthy();
	});
});
