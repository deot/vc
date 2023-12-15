import { h, defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { useAttrs } from '@deot/vc-hooks';

describe('use-scrollbar.ts', () => {
	it('merge: true', async () => {
		const Wrapper = defineComponent(() => {
			const it = useAttrs();
			return () => h('div', h('span', it.value, 'any'));
		});

		const handleAny = vi.fn();
		const root = mount(Wrapper, {
			attrs: {
				class: 'any',
				any: 'any',
				onAny: handleAny
			}
		});

		expect(root.find('span').attributes()).toEqual({ class: 'any', any: 'any' });
		await root.find('span').trigger('any');
		expect(handleAny).toBeCalledTimes(2);
	});

	it('merge: false', async () => {
		const Wrapper = defineComponent(() => {
			const it = useAttrs({ merge: false });
			return () => h('div', h('span', it.value.attrs, 'any'));
		});

		const handleAny = vi.fn();
		const root = mount(Wrapper, {
			attrs: {
				class: 'any',
				any: 'any',
				onAny: handleAny
			}
		});

		expect(root.find('span').attributes()).toEqual({ any: 'any' });
		await root.find('span').trigger('any');
		expect(handleAny).toBeCalledTimes(1);
	});

	it('exclude', async () => {
		const Wrapper = defineComponent(() => {
			const it = useAttrs({ merge: false, exclude: ['any'] });
			return () => h('div', h('span', it.value.attrs, 'any'));
		});

		const handleAny = vi.fn();
		const root = mount(Wrapper, {
			attrs: {
				class: 'any',
				any: 'any',
				onAny: handleAny
			}
		});

		expect(root.find('span').attributes()).toEqual({});
		await root.find('span').trigger('any');
		expect(handleAny).toBeCalledTimes(1);
	});

	it('merge, exclude', async () => {
		const Wrapper = defineComponent(() => {
			const it = useAttrs({ merge: true, exclude: ['any'] });
			return () => h('div', h('span', it.value.attrs, 'any'));
		});

		const handleAny = vi.fn();
		const root = mount(Wrapper, {
			attrs: {
				class: 'any',
				any: 'any',
				onAny: handleAny
			}
		});

		expect(root.find('span').attributes()).toEqual({});
		await root.find('span').trigger('any');
		expect(handleAny).toBeCalledTimes(1);
	});
});
