// @vitest-environment jsdom

import { Pagination, Select, InputNumber } from '@deot/vc-components';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Pagination).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Pagination />));

		expect(wrapper.classes()).toContain('vc-pagination');
	});

	it('showCount: 默认展示总条数', () => {
		const wrapper = mount(() => (<Pagination count={100} />));

		const count = wrapper.find('.vc-pagination__count');
		expect(count.exists()).toBe(true);
		expect(count.text()).toContain('100');
	});

	it('showCount: 为 false 时不展示总条数', () => {
		const wrapper = mount(() => (<Pagination count={100} showCount={false} />));

		expect(wrapper.find('.vc-pagination__count').exists()).toBe(false);
	});

	it('slot default: 自定义总条数内容', () => {
		const wrapper = mount(() => (
			<Pagination
				count={100}
				v-slots={{ default: () => <span class="custom-count">自定义</span> }}
			/>
		));

		expect(wrapper.find('.custom-count').exists()).toBe(true);
		expect(wrapper.find('.custom-count').text()).toBe('自定义');
	});

	it('totalPage: count 为 0 时至少 1 页', () => {
		const wrapper = mount(() => (<Pagination count={0} />));

		expect(wrapper.find('[title="1"]').exists()).toBe(true);
		// 只有一页时不渲染最后一页
		expect(wrapper.find('.vc-pagination__item.is-active').text()).toBe('1');
	});

	it('totalPage: 根据 count 与 pageSize 计算总页数', () => {
		const wrapper = mount(() => (<Pagination count={100} pageSize={10} />));

		expect(wrapper.find('[title="10"]').exists()).toBe(true);
	});

	it('current: 高亮当前页', () => {
		const wrapper = mount(() => (<Pagination count={100} current={1} />));

		const active = wrapper.find('.vc-pagination__item.is-active');
		expect(active.text()).toBe('1');
	});

	it('next: 点击下一页', async () => {
		const wrapper = mount(Pagination, { props: { count: 100, current: 1 } });

		await wrapper.find('[title="next"]').trigger('click');

		expect(wrapper.emitted()).toHaveProperty('update:current');
		expect(wrapper.emitted()).toHaveProperty('change');
		expect(wrapper.emitted('change')![0]).toEqual([2]);
	});

	it('prev: 点击上一页', async () => {
		const wrapper = mount(Pagination, { props: { count: 100, current: 3 } });

		await wrapper.find('[title="prev"]').trigger('click');

		expect(wrapper.emitted('change')![0]).toEqual([2]);
	});

	it('prev: 第一页时点击无效', async () => {
		const wrapper = mount(() => (<Pagination count={100} current={1} />));

		await wrapper.find('[title="prev"]').trigger('click');

		expect(wrapper.emitted('change')).toBeUndefined();
	});

	it('next: 最后一页时点击无效', async () => {
		const wrapper = mount(() => (<Pagination count={100} current={10} pageSize={10} />));

		await wrapper.find('[title="next"]').trigger('click');

		expect(wrapper.emitted('change')).toBeUndefined();
	});

	it('resetPage: 点击页码跳转', async () => {
		const wrapper = mount(Pagination, { props: { count: 100, current: 1, pageSize: 10 } });

		await wrapper.find('[title="10"]').trigger('click');

		expect(wrapper.emitted('change')![0]).toEqual([10]);
	});

	it('resetPage: 点击当前页不触发事件', async () => {
		const wrapper = mount(Pagination, { props: { count: 100, current: 1 } });

		await wrapper.find('[title="1"]').trigger('click');

		expect(wrapper.emitted('change')).toBeUndefined();
	});

	it('handleFastNext: 向后 5 页', async () => {
		const wrapper = mount(Pagination, { props: { count: 200, current: 1, pageSize: 10 } });

		const jump = wrapper.find('[title="向后 5 页"]');
		expect(jump.exists()).toBe(true);

		await jump.trigger('click');
		expect(wrapper.emitted('change')![0]).toEqual([6]);
	});

	it('handleFastPre: 向前 5 页', async () => {
		const wrapper = mount(Pagination, { props: { count: 200, current: 10, pageSize: 10 } });

		const jump = wrapper.find('[title="向前 5 页"]');
		expect(jump.exists()).toBe(true);

		await jump.trigger('click');
		expect(wrapper.emitted('change')![0]).toEqual([5]);
	});

	it('中间页码: 当前页居中时渲染前后页码与跳转', () => {
		const wrapper = mount(() => (<Pagination count={200} current={10} pageSize={10} />));

		expect(wrapper.find('[title="向前 5 页"]').exists()).toBe(true);
		expect(wrapper.find('[title="向后 5 页"]').exists()).toBe(true);
		expect(wrapper.find('[title="8"]').exists()).toBe(true);
		expect(wrapper.find('[title="9"]').exists()).toBe(true);
		expect(wrapper.find('[title="11"]').exists()).toBe(true);
		expect(wrapper.find('[title="12"]').exists()).toBe(true);
		expect(wrapper.find('.vc-pagination__item.is-active').text()).toBe('10');
	});

	it('中间页码: 点击 current-1 页码跳转', async () => {
		const wrapper = mount(Pagination, { props: { count: 200, current: 10, pageSize: 10 } });

		await wrapper.find('[title="9"]').trigger('click');
		expect(wrapper.emitted('change')![0]).toEqual([9]);
	});

	it('中间页码: 点击 current-2 页码跳转', async () => {
		const wrapper = mount(Pagination, { props: { count: 200, current: 10, pageSize: 10 } });

		await wrapper.find('[title="8"]').trigger('click');
		expect(wrapper.emitted('change')![0]).toEqual([8]);
	});

	it('中间页码: 点击 current+1 页码跳转', async () => {
		const wrapper = mount(Pagination, { props: { count: 200, current: 10, pageSize: 10 } });

		await wrapper.find('[title="11"]').trigger('click');
		expect(wrapper.emitted('change')![0]).toEqual([11]);
	});

	it('中间页码: 点击 current+2 页码跳转', async () => {
		const wrapper = mount(Pagination, { props: { count: 200, current: 10, pageSize: 10 } });

		await wrapper.find('[title="12"]').trigger('click');
		expect(wrapper.emitted('change')![0]).toEqual([12]);
	});

	it('中间页码: current 为 5 时渲染 current-3 页码', async () => {
		const wrapper = mount(Pagination, { props: { count: 200, current: 5, pageSize: 10 } });

		const item = wrapper.find('[title="2"]');
		expect(item.exists()).toBe(true);

		await item.trigger('click');
		expect(wrapper.emitted('change')![0]).toEqual([2]);
	});

	it('中间页码: totalPage - current 为 4 时渲染 current+3 页码', async () => {
		const wrapper = mount(Pagination, { props: { count: 200, current: 16, pageSize: 10 } });

		const item = wrapper.find('[title="19"]');
		expect(item.exists()).toBe(true);

		await item.trigger('click');
		expect(wrapper.emitted('change')![0]).toEqual([19]);
	});

	it('showSizer: 渲染每页条数选择器', () => {
		const wrapper = mount(() => (<Pagination count={100} showSizer />));

		expect(wrapper.find('.vc-pagination__size').exists()).toBe(true);
	});

	it('showElevator: 渲染快速跳转', () => {
		const wrapper = mount(() => (<Pagination count={100} showElevator />));

		expect(wrapper.find('.vc-pagination__elevator').exists()).toBe(true);
	});

	it('resetPageSize: 切换每页条数触发 page-size-change 并回到第一页', async () => {
		const wrapper = mount(Pagination, {
			props: { count: 200, current: 5, pageSize: 10, showSizer: true }
		});

		wrapper.findComponent(Select).vm.$emit('change', 20);
		await wrapper.vm.$nextTick();

		expect(wrapper.emitted('page-size-change')![0]).toEqual([20]);
		expect(wrapper.find('.vc-pagination__item.is-active').text()).toBe('1');
	});

	it('handleEnter: 输入页码回车跳转', async () => {
		const wrapper = mount(Pagination, {
			props: { count: 200, current: 1, pageSize: 10, showElevator: true }
		});

		const input = wrapper.findComponent(InputNumber);
		input.vm.$emit('input', 6);
		input.vm.$emit('enter');
		await wrapper.vm.$nextTick();

		expect(wrapper.emitted('change')![0]).toEqual([6]);
	});

	it('handleInput: 输入超过总页数时取总页数', async () => {
		const wrapper = mount(Pagination, {
			props: { count: 200, current: 1, pageSize: 10, showElevator: true }
		});

		const input = wrapper.findComponent(InputNumber);
		input.vm.$emit('input', 999);
		input.vm.$emit('enter');
		await wrapper.vm.$nextTick();

		expect(wrapper.emitted('change')![0]).toEqual([20]);
	});

	it('current 变化: 同步高亮页码', async () => {
		const wrapper = mount({
			props: { current: { type: Number, default: 1 } },
			setup(props) {
				return () => <Pagination count={100} current={props.current} />;
			}
		}, {
			props: { current: 1 }
		});

		expect(wrapper.find('.vc-pagination__item.is-active').text()).toBe('1');

		await wrapper.setProps({ current: 5 });
		expect(wrapper.find('.vc-pagination__item.is-active').text()).toBe('5');
	});

	it('count 变化: 当前页超出范围时回退', async () => {
		const wrapper = mount({
			props: { count: { type: Number, default: 100 } },
			setup(props) {
				return () => <Pagination count={props.count} current={10} pageSize={10} />;
			}
		}, {
			props: { count: 100 }
		});

		expect(wrapper.find('.vc-pagination__item.is-active').text()).toBe('10');

		await wrapper.setProps({ count: 30 });
		expect(wrapper.find('.vc-pagination__item.is-active').text()).toBe('3');
	});

	it('expose: prev / next / resetPage', async () => {
		const wrapper = mount(Pagination, {
			props: { count: 100, current: 3, pageSize: 10 }
		});

		expect(typeof (wrapper.vm as any).prev).toBe('function');
		expect(typeof (wrapper.vm as any).next).toBe('function');
		expect(typeof (wrapper.vm as any).resetPage).toBe('function');

		(wrapper.vm as any).next();
		await wrapper.vm.$nextTick();
		expect(wrapper.find('.vc-pagination__item.is-active').text()).toBe('4');

		(wrapper.vm as any).prev();
		await wrapper.vm.$nextTick();
		expect(wrapper.find('.vc-pagination__item.is-active').text()).toBe('3');

		(wrapper.vm as any).resetPage(8);
		await wrapper.vm.$nextTick();
		expect(wrapper.find('.vc-pagination__item.is-active').text()).toBe('8');
	});
});
