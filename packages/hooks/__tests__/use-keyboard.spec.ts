import { h, defineComponent, ref, nextTick, effectScope } from 'vue';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { useKeyboard } from '@deot/vc-hooks';
import type { KeyboardOptions } from '@deot/vc-hooks';

describe('use-keyboard.ts', () => {
	const press = (key: string) => {
		const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
		document.body.dispatchEvent(event);
		return event;
	};
	const mountKeyboard = (options: KeyboardOptions) => {
		const Wrapper = defineComponent(() => {
			useKeyboard(options);
			return () => h('div');
		});
		return mount(Wrapper, { attachTo: document.body });
	};

	it('enabled 为真期间订阅，变化时订阅或退订', async () => {
		const enabled = ref(false);
		const handler = vi.fn(() => true);
		const wrapper = mountKeyboard({ enabled: () => enabled.value, handler });

		press('Enter');
		expect(handler).not.toHaveBeenCalled();

		enabled.value = true;
		await nextTick();
		const event = press('Enter');
		expect(handler).toHaveBeenCalledTimes(1);
		// 返回 true：阻止默认行为
		expect(event.defaultPrevented).toBe(true);

		enabled.value = false;
		await nextTick();
		press('Enter');
		expect(handler).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('创建时已为真则立即订阅；返回 false 时不阻止默认行为', () => {
		const handler = vi.fn(() => false);
		const wrapper = mountKeyboard({ enabled: () => true, handler });

		const event = press('Escape');
		expect(handler).toHaveBeenCalledTimes(1);
		expect(event.defaultPrevented).toBe(false);

		wrapper.unmount();
	});

	it('后订阅的先处理，处理后不再传给更早的订阅', () => {
		const first = vi.fn(() => true);
		const second = vi.fn(() => true);
		const a = mountKeyboard({ enabled: () => true, handler: first });
		const b = mountKeyboard({ enabled: () => true, handler: second });

		press('Escape');
		expect(second).toHaveBeenCalledTimes(1);
		expect(first).not.toHaveBeenCalled();

		b.unmount();
		press('Escape');
		expect(first).toHaveBeenCalledTimes(1);

		a.unmount();
	});

	it('卸载、作用域销毁时退订', async () => {
		const handler = vi.fn(() => true);
		const wrapper = mountKeyboard({ enabled: () => true, handler });
		wrapper.unmount();
		press('Enter');
		expect(handler).not.toHaveBeenCalled();

		const scope = effectScope();
		const enabled = ref(false);
		scope.run(() => useKeyboard({ enabled: () => enabled.value, handler, flush: 'post' }));
		enabled.value = true;
		await nextTick();
		press('Enter');
		expect(handler).toHaveBeenCalledTimes(1);

		scope.stop();
		press('Enter');
		expect(handler).toHaveBeenCalledTimes(1);
	});
});
