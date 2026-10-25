// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';
import { SelectList } from '../select-list';

const renderRow = ({ row }: any) => (<div key={row.id} class="row">{row.label}</div>);
const getRows = (wrapper: any) => wrapper.findAll('.row').map((row: any) => row.element as HTMLElement);
const getActive = (wrapper: any) => wrapper.find('[data-active]').exists() ? wrapper.find('[data-active]').text() : undefined;

describe('select-list', () => {
	it('行即根节点的子元素；指针在行上移动时发出 hover（下标）', async () => {
		const onHover = vi.fn();
		const wrapper = mount(() => (
			<SelectList data={[{ id: 1, label: 'A' }, { id: 2, label: 'B' }]} onHover={onHover}>
				{{ default: renderRow }}
			</SelectList>
		));
		expect(wrapper.find('.vc-select-list').element.children.length).toBe(2);

		getRows(wrapper)[1].dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
		expect(onHover).toHaveBeenCalledWith(1);
		// 不在行上时不发出
		wrapper.find('.vc-select-list').element.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
		expect(onHover).toHaveBeenCalledTimes(1);
		// 只用 mousemove：列表在静止的指针下滚动时浏览器补发的 mouseover 不改变高亮
		getRows(wrapper)[0].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
		expect(onHover).toHaveBeenCalledTimes(1);
	});

	it('高亮直接写在行的节点上；先高亮后挂载的行补上，下标随数据变化时跟随下标', async () => {
		const listRef = ref<any>();
		const data = ref<any[]>([{ id: 1, label: 'A' }]);
		const wrapper = mount(() => (
			<SelectList ref={listRef} data={data.value}>
				{{ default: renderRow }}
			</SelectList>
		));

		listRef.value.highlight(0);
		expect(getActive(wrapper)).toBe('A');

		// 尚未渲染的行：挂载时补上
		listRef.value.highlight(1);
		expect(getActive(wrapper)).toBeUndefined();
		data.value = [{ id: 1, label: 'A' }, { id: 2, label: 'B' }];
		await nextTick();
		expect(getActive(wrapper)).toBe('B');

		// 头部插入：B 的下标变为 2，第 1 行（A）成为高亮
		data.value = [{ id: 0, label: 'Z' }, ...data.value];
		await nextTick();
		expect(getActive(wrapper)).toBe('A');
		expect(wrapper.findAll('[data-active]').length).toBe(1);

		// 高亮的行卸载后不残留
		data.value = [{ id: 0, label: 'Z' }];
		await nextTick();
		expect(getActive(wrapper)).toBeUndefined();
		listRef.value.highlight(-1);
		listRef.value.scrollToIndex(-1);
		listRef.value.scrollToIndex(0);
	});
});

describe('select-list virtualized', () => {
	it('只渲染部分行；高亮在行挂载时补上，指针移入按登记的行取下标', async () => {
		const listRef = ref<any>();
		const onHover = vi.fn();
		const data = Array.from({ length: 500 }, (_, id) => ({ id, label: `L${id}` }));
		const wrapper = mount(() => (
			<div class="vc-scroller" style="height: 200px; overflow: auto">
				<SelectList ref={listRef} data={data} virtualized onHover={onHover}>
					{{ default: renderRow }}
				</SelectList>
			</div>
		), { attachTo: document.body });
		await nextTick();
		await new Promise(r => setTimeout(r));
		await nextTick();
		const rows = getRows(wrapper);
		expect(wrapper.find('.vc-recycle-list').exists()).toBe(true);
		expect(rows.length).toBeGreaterThan(0);
		expect(rows.length).toBeLessThan(500);
		// 不额外写 data-index
		expect(rows[0].hasAttribute('data-index')).toBe(false);

		listRef.value.highlight(1);
		expect(getActive(wrapper)).toBe('L1');
		rows[2].dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
		expect(onHover).toHaveBeenLastCalledWith(2);
		// 已是高亮行时不重复发出
		rows[1].dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
		expect(onHover).toHaveBeenCalledTimes(1);

		// 尚未渲染的行：高亮先记下
		listRef.value.highlight(499);
		expect(getActive(wrapper)).toBeUndefined();
		wrapper.unmount();
	});
});
