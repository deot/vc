import { h, defineComponent, ref, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useScrollbar } from '@deot/vc-hooks';

describe('use-scrollbar.ts', () => {
	it('basic', async () => {
		const isActive = ref(true);
		const Wrapper = defineComponent(() => {
			useScrollbar(isActive);
			return () => h('div', {}, {});
		});

		const root = mount(Wrapper);
		expect(document.body.style.getPropertyValue('overflow')).toBe('hidden');

		isActive.value = false;
		await nextTick();
		expect(document.body.style.getPropertyValue('overflow')).toBe('');
		root.unmount();
	});

	it('original', async () => {
		document.body.style.overflow = 'hidden';
		const isActive = ref(true);
		const Wrapper = defineComponent(() => {
			useScrollbar(isActive);
			return () => h('div', {}, {});
		});

		const root = mount(Wrapper);
		expect(document.body.style.getPropertyValue('overflow')).toBe('hidden');

		isActive.value = false;
		await nextTick();
		expect(document.body.style.getPropertyValue('overflow')).toBe('hidden');
		root.unmount();
	});
});