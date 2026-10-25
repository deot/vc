// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';
import { SelectList } from '../select-list';

const renderRow = ({ row }: any) => (<div key={row.id} class="row">{row.label}</div>);
const getRows = (wrapper: any) => wrapper.findAll('.row').map((row: any) => row.element as HTMLElement);
const getActive = (wrapper: any) => wrapper.find('[data-active]').exists() ? wrapper.find('[data-active]').text() : undefined;

describe('select-list', () => {
	it('行即根节点的子元素；指针移入时发出 hover（下标）', async () => {
		const onHover = vi.fn();
		const wrapper = mount(() => (
			<SelectList data={[{ id: 1, label: 'A' }, { id: 2, label: 'B' }]} onHover={onHover}>
				{{ default: renderRow }}
			</SelectList>
		));
		expect(wrapper.find('.vc-select-list').element.children.length).toBe(2);

		getRows(wrapper)[1].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
		expect(onHover).toHaveBeenCalledWith(1);
		// 不在行上时不发出
		wrapper.find('.vc-select-list').element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
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
