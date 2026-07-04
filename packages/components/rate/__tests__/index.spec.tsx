// @vitest-environment jsdom

import { vi } from 'vitest';
import { Rate } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

const flush = async () => {
	for (let i = 0; i < 5; i++) {
		await nextTick();
		await Promise.resolve();
	}
};

// 默认使用 character 渲染, 避免默认 star 图标反复注册 IconManager 监听导致跨用例污染
const CHAR = '★';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Rate).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Rate character={CHAR} />));

		expect(wrapper.classes()).toContain('vc-rate');
	});

	it('count: 渲染对应数量的星星', () => {
		const wrapper = mount(() => (<Rate character={CHAR} count={7} />));

		expect(wrapper.findAll('.vc-rate__star').length).toBe(7);
	});

	it('modelValue: 高亮已选中的星星', async () => {
		const wrapper = mount(() => (<Rate character={CHAR} modelValue={3} />));
		await flush();

		const stars = wrapper.findAll('.vc-rate__star');
		expect(stars.filter(v => v.classes().includes('is-select')).length).toBe(3);
	});

	it('half: 渲染半星', async () => {
		const wrapper = mount(() => (<Rate character={CHAR} half modelValue={3.5} />));
		await flush();

		const stars = wrapper.findAll('.vc-rate__star');
		expect(stars.filter(v => v.classes().includes('is-select')).length).toBe(3);
		expect(stars.filter(v => v.classes().includes('is-half')).length).toBe(1);
		expect(stars[3].classes()).toContain('is-half');
	});

	it('disabled: 添加 is-disabled 类', async () => {
		const wrapper = mount(() => (<Rate character={CHAR} disabled modelValue={2} />));
		await flush();

		expect(wrapper.find('.vc-rate__star').classes()).toContain('is-disabled');
	});

	it('character: 使用自定义字符替代图标', () => {
		const wrapper = mount(() => (<Rate character="好" count={3} />));

		const spans = wrapper.findAll('.vc-rate__star--icon span');
		expect(spans.length).toBe(3 * 2);
		expect(spans[0].text()).toBe('好');
	});

	it('默认使用 Icon 图标', () => {
		const wrapper = mount(() => (<Rate count={2} icon="star" />));

		expect(wrapper.find('.vc-icon').exists()).toBe(true);
	});

	it('color: 选中的星星应用颜色', async () => {
		const wrapper = mount(() => (<Rate character={CHAR} modelValue={2} color="rgb(255, 0, 0)" />));
		await flush();

		const stars = wrapper.findAll('.vc-rate__star');
		expect(stars[0].attributes('style')).toContain('rgb(255, 0, 0)');
	});

	it('tooltip: 渲染提示文本', async () => {
		const wrapper = mount(() => (
			<Rate character={CHAR} modelValue={2} tooltip={['极差', '差', '一般', '好', '极好']} />
		));
		await flush();

		const tip = wrapper.find('.vc-rate__tips');
		expect(tip.exists()).toBe(true);
		expect(tip.text()).toBe('差');
	});

	it('tooltip: 通过 tip 插槽自定义提示', async () => {
		const wrapper = mount(() => (
			<Rate character={CHAR} modelValue={3} tooltip={['a']} v-slots={{ tip: ({ value }: any) => (<span class="my-tip">{value}</span>) }} />
		));
		await flush();

		expect(wrapper.find('.my-tip').text()).toBe('3');
	});

	it('click: 点击星星更新值并触发事件', async () => {
		const onUpdate = vi.fn();
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Rate character={CHAR} onUpdate:modelValue={onUpdate} onChange={onChange} />
		));
		await flush();

		await wrapper.findAll('.vc-rate__star')[2].trigger('click');

		expect(onUpdate).toHaveBeenCalledWith(3);
		expect(onChange).toHaveBeenCalledWith(3);
	});

	it('click: modelValue 为字符串时触发字符串类型', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Rate character={CHAR} modelValue="0" onChange={onChange} />
		));
		await flush();

		await wrapper.findAll('.vc-rate__star')[2].trigger('click');

		expect(onChange).toHaveBeenCalledWith('3');
	});

	it('disabled: 点击不触发事件', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Rate character={CHAR} disabled onChange={onChange} />
		));
		await flush();

		await wrapper.findAll('.vc-rate__star')[2].trigger('click');

		expect(onChange).not.toHaveBeenCalled();
	});

	it('clearable: 再次点击相同值清零', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Rate character={CHAR} clearable modelValue={3} onChange={onChange} />
		));
		await flush();

		await wrapper.findAll('.vc-rate__star')[2].trigger('click');

		expect(onChange).toHaveBeenCalledWith(0);
	});

	it('half: 点击左半侧得到 x-0.5', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Rate character={CHAR} half onChange={onChange} />
		));
		await flush();

		await wrapper.findAll('.vc-rate__star--first')[2].trigger('click');

		expect(onChange).toHaveBeenCalledWith(2.5);
	});

	it('half: 点击右半侧得到整数值', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Rate character={CHAR} half onChange={onChange} />
		));
		await flush();

		await wrapper.findAll('.vc-rate__star--second')[2].trigger('click');

		expect(onChange).toHaveBeenCalledWith(3);
	});

	it('half: 点击非左右半侧区域(直接点击 li)得到整数值', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Rate character={CHAR} half onChange={onChange} />
		));
		await flush();

		await wrapper.findAll('.vc-rate__star')[2].trigger('click');

		expect(onChange).toHaveBeenCalledWith(3);
	});

	it('half + clearable: 点击半星左侧清零', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Rate character={CHAR} half clearable modelValue={3.5} onChange={onChange} />
		));
		await flush();

		await wrapper.findAll('.vc-rate__star--first')[3].trigger('click');

		expect(onChange).toHaveBeenCalledWith(0);
	});

	it('half + clearable: 点击满星左侧得到 x-0.5', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Rate character={CHAR} half clearable modelValue={3} onChange={onChange} />
		));
		await flush();

		await wrapper.findAll('.vc-rate__star--first')[2].trigger('click');

		expect(onChange).toHaveBeenCalledWith(2.5);
	});

	it('half + clearable: 点击非满星右侧得到整数值', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Rate character={CHAR} half clearable modelValue={2} onChange={onChange} />
		));
		await flush();

		await wrapper.findAll('.vc-rate__star--second')[2].trigger('click');

		expect(onChange).toHaveBeenCalledWith(3);
	});

	it('half + clearable: 点击满星右侧清零', async () => {
		const onChange = vi.fn();
		const wrapper = mount(() => (
			<Rate character={CHAR} half clearable modelValue={3} onChange={onChange} />
		));
		await flush();

		await wrapper.findAll('.vc-rate__star--second')[2].trigger('click');

		expect(onChange).toHaveBeenCalledWith(0);
	});

	it('hover: 移入高亮, 移出还原', async () => {
		const wrapper = mount(() => (<Rate character={CHAR} modelValue={1} />));
		await flush();

		const stars = wrapper.findAll('.vc-rate__star');
		await stars[3].trigger('mousemove');
		await flush();

		expect(wrapper.findAll('.vc-rate__star').filter(v => v.classes().includes('is-select')).length).toBe(4);

		await wrapper.find('.vc-rate').trigger('mouseleave');
		await flush();

		expect(wrapper.findAll('.vc-rate__star').filter(v => v.classes().includes('is-select')).length).toBe(1);
	});

	it('disabled: 移入不改变高亮', async () => {
		const wrapper = mount(() => (<Rate character={CHAR} disabled modelValue={1} />));
		await flush();

		await wrapper.findAll('.vc-rate__star')[3].trigger('mousemove');
		await flush();

		expect(wrapper.findAll('.vc-rate__star').filter(v => v.classes().includes('is-select')).length).toBe(1);
	});
});
