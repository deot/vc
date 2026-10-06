// @vitest-environment jsdom

import { h, defineComponent, ref, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useScrollbar } from '@deot/vc-hooks';

describe('use-scrollbar.ts', () => {
	afterEach(() => document.body.style.removeProperty('overflow'));

	const create = (value = true) => {
		const active = ref(value);
		const root = mount(defineComponent(() => {
			useScrollbar(active);
			return () => h('div');
		}));
		return { active, root };
	};

	it.each(['auto', 'scroll', 'hidden'])('恢复原 overflow=%s 和优先级', async (value) => {
		document.body.style.setProperty('overflow', value, 'important');
		const { active, root } = create();
		expect(document.body.style.overflow).toBe('hidden');
		active.value = false;
		await nextTick();
		expect(document.body.style.overflow).toBe(value);
		expect(document.body.style.getPropertyPriority('overflow')).toBe('important');
		root.unmount();
	});

	it.each([true, false])('多个实例关闭顺序：先关闭底层=%s', async (bottomFirst) => {
		const first = create();
		const second = create();
		const [a, b] = bottomFirst ? [first, second] : [second, first];
		a.active.value = false;
		await nextTick();
		expect(document.body.style.overflow).toBe('hidden');
		a.root.unmount();
		b.root.unmount();
		expect(document.body.style.overflow).toBe('');
	});

	it('未持锁实例卸载不影响其他实例，反复开关不会重复计数', async () => {
		const hidden = create(false);
		const shown = create();
		hidden.root.unmount();
		expect(document.body.style.overflow).toBe('hidden');
		shown.active.value = false;
		await nextTick();
		shown.active.value = true;
		await nextTick();
		shown.root.unmount();
		expect(document.body.style.overflow).toBe('');
	});
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
