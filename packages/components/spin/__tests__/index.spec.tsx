// @vitest-environment jsdom

import { Spin, MSpin } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Spin).toBe('object');
	});

	it('size, 默认图标按 px 设置尺寸，字符框跟随外层字体', () => {
		const wrapper = mount(() => (<Spin size={20} />));

		expect(wrapper.classes()).toContain('vc-spin');

		const span = wrapper.find('.vc-spin__indicator').element as HTMLElement;
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

		expect((wrapper.find('.vc-spin__indicator').element as HTMLElement).style.fontSize).toBe('20px');
		expect(wrapper.find('.custom').exists()).toBeTruthy();
	});

	it('MSpin: size 为 750 稿长度，默认 56', async () => {
		const wrapper = mount(MSpin);
		const svg = wrapper.find('svg').element as SVGElement;

		expect(wrapper.classes()).toContain('vcm-spin');
		expect(svg.style.width).toBe('calc(var(--vc-rem) * 56)');

		await wrapper.setProps({ size: 40 });
		expect(svg.style.height).toBe('calc(var(--vc-rem) * 40)');
	});

	it('结构：根节点为 span，轨道 + 转动弧，颜色通过局部变量传入', () => {
		const wrapper = mount(() => (<Spin color="red" trackColor="blue" />));
		const el = wrapper.element as HTMLElement;

		expect(el.tagName).toBe('SPAN');
		expect(wrapper.find('circle.vc-spin__track').exists()).toBe(true);
		expect(wrapper.find('path.vc-spin__arc').exists()).toBe(true);
		expect(el.style.getPropertyValue('--vc-spin-color')).toBe('red');
		expect(el.style.getPropertyValue('--vc-spin-track-color')).toBe('blue');

		// 不传时不写行内变量，由样式取默认值
		const plain = mount(Spin).element as HTMLElement;
		expect(plain.getAttribute('style')).toBeFalsy();
	});

	it('无障碍：role=status，没有提示时 aria-label 为「加载中」，图标对读屏隐藏', () => {
		const wrapper = mount(Spin);
		expect(wrapper.attributes('role')).toBe('status');
		expect(wrapper.attributes('aria-label')).toBe('加载中');
		expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true');

		const tipped = mount(() => (<Spin tip="正在加载" />));
		expect(tipped.attributes('aria-label')).toBeUndefined();
	});

	it('tip：属性与插槽，显示在图标下方', () => {
		const wrapper = mount(() => (<Spin tip="正在加载" />));
		expect(wrapper.classes()).toContain('has-tip');
		expect(wrapper.find('.vc-spin__tip').text()).toBe('正在加载');

		const slotted = mount(() => (
			<Spin>{{ tip: () => <b class="custom-tip">插槽提示</b> }}</Spin>
		));
		expect(slotted.find('.vc-spin__tip .custom-tip').exists()).toBe(true);
		// 只有 tip 插槽不算包裹内容
		expect(slotted.find('.vc-spin-wrapper').exists()).toBe(false);
	});

	it('loading 为 false 时不显示图标', async () => {
		const wrapper = mount(Spin, { props: { loading: false } });
		expect(wrapper.find('.vc-spin').exists()).toBe(false);

		await wrapper.setProps({ loading: true });
		expect(wrapper.find('.vc-spin').exists()).toBe(true);
	});

	it('包裹内容：加载中盖一层带蒙层的图标，内容 aria-busy', async () => {
		const wrapper = mount(Spin, {
			props: { tip: '加载中' },
			slots: { default: () => <p class="content">内容</p> }
		});

		expect(wrapper.classes()).toContain('vc-spin-wrapper');
		expect(wrapper.find('.content').exists()).toBe(true);
		expect(wrapper.attributes('aria-busy')).toBe('true');
		const layer = wrapper.find('.vc-spin-wrapper__layer');
		expect(layer.classes()).toContain('is-mask');
		expect(layer.find('.vc-spin .vc-spin__tip').text()).toBe('加载中');

		await wrapper.setProps({ mask: false });
		expect(wrapper.find('.vc-spin-wrapper__layer').classes()).not.toContain('is-mask');

		await wrapper.setProps({ loading: false });
		expect(wrapper.attributes('aria-busy')).toBeUndefined();
		// 内容始终保留
		expect(wrapper.find('.content').exists()).toBe(true);
	});

	it('delay：加载在延迟内结束则不显示，结束时立即隐藏', async () => {
		vi.useFakeTimers();
		const wrapper = mount(Spin, { props: { delay: 300 } });
		await nextTick();
		expect(wrapper.find('.vc-spin').exists()).toBe(false);

		vi.advanceTimersByTime(300);
		await nextTick();
		expect(wrapper.find('.vc-spin').exists()).toBe(true);

		await wrapper.setProps({ loading: false });
		expect(wrapper.find('.vc-spin').exists()).toBe(false);

		// 延迟内结束：始终不出现
		await wrapper.setProps({ loading: true });
		vi.advanceTimersByTime(200);
		await wrapper.setProps({ loading: false });
		vi.advanceTimersByTime(200);
		await nextTick();
		expect(wrapper.find('.vc-spin').exists()).toBe(false);

		// 等待中卸载：清掉计时
		await wrapper.setProps({ loading: true });
		wrapper.unmount();
		vi.advanceTimersByTime(300);
		vi.useRealTimers();
	});

	it('MSpin：根节点带 vcm-spin，属性与 Spin 相同', () => {
		const wrapper = mount(() => (<MSpin tip="加载中" color="red" />));
		expect(wrapper.classes()).toEqual(expect.arrayContaining(['vc-spin', 'vcm-spin', 'has-tip']));
		expect((wrapper.element as HTMLElement).style.getPropertyValue('--vc-spin-color')).toBe('red');
	});
});
