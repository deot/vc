import { h, defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { getInstance } from '@deot/vc-hooks';

describe('get-instance.ts', () => {
	const Content = defineComponent(() => {
		const owner = getInstance('vc-wrapper', 'wrapperId');
		return () => h('div', h('span', owner?.exposed?.value || 'any'));
	});
	it('wrapper', async () => {
		const value = '123';
		const Wrapper = defineComponent({
			name: 'vc-wrapper',
			setup(_, { expose }) {
				expose({
					wrapperId: Math.random(),
					value
				});
				return () => h('div', h(Content, {}));
			}
		});

		const root = mount(Wrapper);

		expect(root.html()).toMatch(value);
	});
	it('ghost', async () => {
		const root = mount(Content);

		expect(root.html()).toMatch('any');
	});
});
