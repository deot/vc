// @vitest-environment jsdom

import { Pagination, MPagination, MButton, Select, InputNumber, VcInstance } from '@deot/vc-components';
import { enUS, zhCN } from '@deot/vc-locale';
import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

describe('index.ts', () => {
	afterEach(() => {
		VcInstance.configure({ locale: zhCN });
	});

	it('locale: 文案、提示和条数选项随语言实时更新', async () => {
		const wrapper = mount(Pagination, { props: { count: 200, current: 10, showSizer: true, showElevator: true } });
		expect(wrapper.find('.vc-pagination__count').text()).toBe('共 200 条');
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.find('.vc-pagination__count').text()).toBe('200 items');
		for (const title of ['Previous page', 'Next page', 'Previous 5 pages', 'Next 5 pages']) {
			expect(wrapper.find(`[title="${title}"]`).exists()).toBe(true);
		}
		expect(wrapper.findComponent(Select).props('extra')).toBe('10 / page');
		expect(wrapper.findComponent(Select).props('data')).toEqual([10, 20, 30, 40].map(value => ({ value, label: `${value} / page` })));
		expect(wrapper.find('.vc-pagination__elevator').text()).toBe('Go topage');
		VcInstance.configure({ locale: zhCN });
		await nextTick();
		expect(wrapper.find('[title="上一页"]').exists()).toBe(true);
		expect(wrapper.findComponent(Select).props('extra')).toBe('10 条/页');
		wrapper.unmount();
	});

	it('locale: 默认插槽在切换语言后仍优先，包括空内容', async () => {
		const wrapper = mount(Pagination, { props: { count: 100 }, slots: { default: () => '' } });
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.find('.vc-pagination__count').text()).toBe('');
		wrapper.unmount();
	});

	it('disabled: 首末页样式随当前页变化，空数据禁用双向翻页', async () => {
		const wrapper = mount(Pagination, { props: { count: 20 } });
		expect(wrapper.find('[title="上一页"]').classes()).toContain('is-disabled');
		expect(wrapper.find('[title="下一页"]').classes()).not.toContain('is-disabled');
		await wrapper.setProps({ current: 2 });
		expect(wrapper.find('[title="下一页"]').classes()).toContain('is-disabled');
		await wrapper.setProps({ count: 0 });
		expect(wrapper.findAll('.is-icon.is-disabled')).toHaveLength(2);
	});
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

		await wrapper.find('[title="下一页"]').trigger('click');

		expect(wrapper.emitted()).toHaveProperty('update:current');
		expect(wrapper.emitted()).toHaveProperty('change');
		expect(wrapper.emitted('change')![0]).toEqual([2]);
	});

	it('previous: 点击上一页', async () => {
		const wrapper = mount(Pagination, { props: { count: 100, current: 3 } });

		await wrapper.find('[title="上一页"]').trigger('click');

		expect(wrapper.emitted('change')![0]).toEqual([2]);
	});

	it('previous: 第一页时点击无效', async () => {
		const wrapper = mount(() => (<Pagination count={100} current={1} />));

		await wrapper.find('[title="上一页"]').trigger('click');

		expect(wrapper.emitted('change')).toBeUndefined();
	});

	it('next: 最后一页时点击无效', async () => {
		const wrapper = mount(() => (<Pagination count={100} current={10} pageSize={10} />));

		await wrapper.find('[title="下一页"]').trigger('click');

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

	it('expose: previous / next / resetPage', async () => {
		const wrapper = mount(Pagination, {
			props: { count: 100, current: 3, pageSize: 10 }
		});

		expect(typeof (wrapper.vm as any).previous).toBe('function');
		expect(typeof (wrapper.vm as any).next).toBe('function');
		expect(typeof (wrapper.vm as any).resetPage).toBe('function');

		(wrapper.vm as any).next();
		await wrapper.vm.$nextTick();
		expect(wrapper.find('.vc-pagination__item.is-active').text()).toBe('4');

		(wrapper.vm as any).previous();
		await wrapper.vm.$nextTick();
		expect(wrapper.find('.vc-pagination__item.is-active').text()).toBe('3');

		(wrapper.vm as any).resetPage(8);
		await wrapper.vm.$nextTick();
		expect(wrapper.find('.vc-pagination__item.is-active').text()).toBe('8');
	});
});

describe('MPagination', () => {
	const sleep = () => new Promise(resolve => setTimeout(resolve));
	afterEach(() => {
		VcInstance.configure({ locale: zhCN });
	});

	const fields = (wrapper: any) => ({
		previous: wrapper.find('.vcm-pagination__previous .vcm-button'),
		next: wrapper.find('.vcm-pagination__next .vcm-button')
	});

	it('独立组件：类名 vcm-pagination，翻页按钮为 MButton', () => {
		expect(MPagination).not.toBe(Pagination);
		expect(MPagination.name).toBe('vcm-pagination');
		const wrapper = mount(MPagination, { props: { count: 60, current: 2 } });
		expect(wrapper.classes()).toEqual(expect.arrayContaining(['vcm-pagination', 'is-default', 'is-between']));
		expect(wrapper.findAllComponents(MButton)).toHaveLength(2);
		expect(wrapper.find('.vcm-pagination__page').text()).toBe('2 / 6');
		const { previous, next } = fields(wrapper);
		expect(previous.text()).toBe('上一页');
		expect(next.text()).toBe('下一页');
	});

	it('翻页：v-model、change，首末页禁用且不触发事件', async () => {
		const wrapper = mount(MPagination, { props: { 'count': 25, 'onUpdate:current': (v: number) => wrapper.setProps({ current: v }) } });
		const { previous, next } = fields(wrapper);
		expect(previous.classes()).toContain('is-disabled');
		await previous.trigger('click');
		expect(wrapper.emitted('change')).toBeUndefined();

		// MButton 的点击经过 Debounce（leading），连续点击之间隔一个宏任务，与真实点击一致
		await next.trigger('click');
		await sleep();
		await next.trigger('click');
		expect(wrapper.emitted('change')).toEqual([[2], [3]]);
		expect(wrapper.emitted('update:current')).toEqual([[2], [3]]);
		expect(wrapper.find('.vcm-pagination__page').text()).toBe('3 / 3');
		expect(fields(wrapper).next.classes()).toContain('is-disabled');
		await sleep();
		await fields(wrapper).next.trigger('click');
		expect(wrapper.emitted('change')).toHaveLength(2);

		await sleep();
		await fields(wrapper).previous.trigger('click');
		expect(wrapper.emitted('change')!.at(-1)).toEqual([2]);
	});

	it('count 为 0 时显示 1 / 1；count 减少时退到新的末页且不触发事件', async () => {
		const wrapper = mount(MPagination, { props: { count: 0 } });
		expect(wrapper.find('.vcm-pagination__page').text()).toBe('1 / 1');
		expect(wrapper.findAll('.vcm-button.is-disabled')).toHaveLength(2);

		await wrapper.setProps({ count: 100, current: 8 });
		expect(wrapper.find('.vcm-pagination__page').text()).toBe('8 / 10');
		await wrapper.setProps({ count: 30 });
		expect(wrapper.find('.vcm-pagination__page').text()).toBe('3 / 3');
		expect(wrapper.emitted('change')).toBeUndefined();
	});

	it('type：text 用文字按钮，simple 只显示页码；nextType 与 justify 的类名', async () => {
		const wrapper = mount(MPagination, { props: { count: 60, type: 'text', nextType: 'primary', justify: 'center' } });
		expect(wrapper.classes()).toEqual(expect.arrayContaining(['is-text', 'is-center', 'is-next-primary']));
		expect(wrapper.findAll('.vcm-button.is-text')).toHaveLength(2);

		await wrapper.setProps({ type: 'default' });
		expect(fields(wrapper).next.classes()).toContain('is-primary');
		expect(fields(wrapper).previous.classes()).toContain('is-default');

		await wrapper.setProps({ type: 'simple' });
		expect(wrapper.find('.vcm-pagination__previous').exists()).toBe(false);
		expect(wrapper.find('.vcm-pagination__next').exists()).toBe(false);
		expect(wrapper.find('.vcm-pagination__page').exists()).toBe(true);
	});

	it('icon 与文字：空字符串时只显示图标，文案随语言更新', async () => {
		const wrapper = mount(MPagination, { props: { count: 60, icon: true, previousText: '', nextText: '' } });
		const { previous, next } = fields(wrapper);
		expect(previous.classes()).toEqual(expect.arrayContaining(['is-alone', 'is-with-icon']));
		expect(previous.find('.vc-button__icon .vc-icon').exists()).toBe(true);
		expect(next.find('.vc-button__icon .vc-icon').exists()).toBe(true);
		expect(previous.text()).toBe('');

		await wrapper.setProps({ previousText: undefined, nextText: undefined });
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(fields(wrapper).previous.text()).toBe('Previous page');
		expect(fields(wrapper).next.classes()).not.toContain('is-alone');
	});

	it('插槽：previous / next / default 的参数，previous() 与 next() 可翻页', async () => {
		const wrapper = mount(MPagination, {
			props: { count: 60, pageSize: 20, current: 2 },
			slots: {
				previous: (scope: any) => (
					<span class="custom-previous" data-disabled={String(scope.disabled)} onClick={scope.previous}>
						{`${scope.current}/${scope.total}`}
					</span>
				),
				next: (scope: any) => (
					<span class="custom-next" data-disabled={String(scope.disabled)} onClick={scope.next}>next</span>
				),
				default: (scope: any) => `第 ${scope.current} 章 · 共 ${scope.total} 章`
			}
		});
		expect(wrapper.findComponent(MButton).exists()).toBe(false);
		expect(wrapper.find('.custom-previous').text()).toBe('2/3');
		expect(wrapper.find('.custom-previous').attributes('data-disabled')).toBe('false');
		expect(wrapper.find('.vcm-pagination__page').text()).toBe('第 2 章 · 共 3 章');

		await wrapper.find('.custom-next').trigger('click');
		expect(wrapper.emitted('change')).toEqual([[3]]);
		expect(wrapper.find('.custom-next').attributes('data-disabled')).toBe('true');
		await wrapper.find('.custom-previous').trigger('click');
		expect(wrapper.emitted('change')!.at(-1)).toEqual([2]);
	});

	it('hideOnSinglePage：只有一页时不渲染', async () => {
		const wrapper = mount(MPagination, { props: { count: 10, hideOnSinglePage: true } });
		expect(wrapper.find('.vcm-pagination').exists()).toBe(false);
		await wrapper.setProps({ count: 11 });
		expect(wrapper.find('.vcm-pagination').exists()).toBe(true);
	});

	it('实例方法：previous / next / resetPage', async () => {
		const wrapper = mount(MPagination, { props: { count: 100 } });
		const vm = wrapper.vm as any;
		expect(vm.previous()).toBe(false);
		vm.next();
		vm.resetPage(7);
		await nextTick();
		expect(wrapper.emitted('change')).toEqual([[2], [7]]);
		expect(wrapper.find('.vcm-pagination__page').text()).toBe('7 / 10');
	});
});
