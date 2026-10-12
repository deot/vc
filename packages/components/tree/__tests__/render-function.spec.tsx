// @vitest-environment jsdom

import { Tree } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { vi } from 'vitest';

describe('renderNodeLabel', () => {
	it('收到 { store, row }，根节点上没有透传属性', async () => {
		const renderNodeLabel = vi.fn(({ row }: any) => (<span class="render-label">{ row.label }</span>));
		const wrapper = mount(() => (
			<Tree data={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} renderNodeLabel={renderNodeLabel} />
		));
		await nextTick();

		expect(Object.keys((renderNodeLabel.mock.calls[0] as any)[0]).sort()).toEqual(['row', 'store']);
		const labels = wrapper.findAll('.render-label');
		expect(labels.map(i => i.text())).toEqual(['A', 'B']);
		expect(labels[0].attributes()).toEqual({ class: 'render-label' });
		wrapper.unmount();
	});
});
