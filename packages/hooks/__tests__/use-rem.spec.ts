// @vitest-environment jsdom

import { h, defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { useRem } from '@deot/vc-hooks';

// 记录所有 ResizeObserver 实例：测试里按被观察的元素找到对应的观察器再触发回调
const observers: any[] = [];
const MockResizeObserver = (globalThis as any).ResizeObserver;
(globalThis as any).ResizeObserver = class extends MockResizeObserver {
	constructor(cb: any) {
		super(cb);
		observers.push(this);
	}
};

const getProbe = () => [...document.body.children].find(el => (el as HTMLElement).style.width.includes('--vc-rem')) as HTMLElement | undefined;

const trigger = (el: Element) => observers.forEach(observer => observer.targets.has(el) && observer.trigger(el));

describe('use-rem.ts', () => {
	// jsdom 不做布局：探针的宽度由这里给出
	let width = 0;
	let rect: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		width = 0;
		rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
			return { width: this === getProbe() ? width : 0 } as DOMRect;
		});
	});

	afterEach(() => rect.mockRestore());

	const create = () => {
		let rem!: ReturnType<typeof useRem>;
		const root = mount(defineComponent(() => {
			rem = useRem();
			return () => h('div');
		}));
		return { rem, root };
	};

	it('探针按 750 稿的宽度量取，首个使用者同步读到值', () => {
		width = 414;
		const { rem, root } = create();
		expect(getProbe()!.style.width).toBe('calc(var(--vc-rem) * 750)');
		expect(rem.value).toBe(414 / 750);
		root.unmount();
	});

	it('探针宽度变化时更新；量不到时保留上一次的值', () => {
		width = 375;
		const { rem, root } = create();
		expect(rem.value).toBe(0.5);

		width = 480;
		trigger(getProbe()!);
		expect(rem.value).toBe(0.64);

		width = 0;
		trigger(getProbe()!);
		expect(rem.value).toBe(0.64);
		root.unmount();
	});

	it('多个使用者共用一个探针，最后一个卸载后移除', () => {
		width = 375;
		const first = create();
		const probe = getProbe()!;
		const second = create();
		expect(first.rem).toBe(second.rem);
		expect(document.body.contains(probe)).toBe(true);
		expect([...document.body.children].filter(el => el === probe)).toHaveLength(1);

		first.root.unmount();
		expect(getProbe()).toBe(probe);
		second.root.unmount();
		expect(getProbe()).toBeUndefined();
	});

	it('重新使用时重新创建探针并读取当前值', () => {
		width = 320;
		const { rem, root } = create();
		expect(rem.value).toBe(320 / 750);
		root.unmount();
	});
});
