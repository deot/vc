// @vitest-environment jsdom

import { FloatButton, MFloatButton } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { KeepAlive, defineComponent, h, nextTick, ref } from 'vue';
import { vi } from 'vitest';

const root = document.documentElement;

const getButton = () => document.body.querySelector<HTMLButtonElement>('.vc-float-button')!;

// 视口 1000×800、按钮 48×48；默认 gap 24 时范围为 x 24 ~ 928、y 24 ~ 728
const mockViewport = (width = 1000, height = 800) => {
	vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(width);
	vi.spyOn(root, 'clientHeight', 'get').mockReturnValue(height);
};

const getTranslate = () => {
	const match = getButton().style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/);
	return match ? { x: +match[1], y: +match[2] } : null;
};

const firePointer = (type: string, x: number, y: number) => {
	getButton().dispatchEvent(new PointerEvent(type, {
		bubbles: true,
		cancelable: true,
		button: 0,
		pointerId: 1,
		pointerType: 'mouse',
		clientX: x,
		clientY: y
	}));
};

// 从 (x, y) 拖动 (dx, dy) 后松开；中途先越过 8px 的阈值
const drag = async (x: number, y: number, dx: number, dy: number) => {
	firePointer('pointerdown', x, y);
	firePointer('pointermove', x + Math.sign(dx) * 10, y + Math.sign(dy) * 10);
	firePointer('pointermove', x + dx, y + dy);
	firePointer('pointerup', x + dx, y + dy);
	await nextTick();
	await nextTick();
};

const keydown = async (key: string, init: KeyboardEventInit = {}) => {
	getButton().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
	await nextTick();
	await nextTick();
};

const wrappers: Array<{ unmount: () => void }> = [];
const attach = <T extends { unmount: () => void }>(wrapper: T) => {
	wrappers.push(wrapper);
	return wrapper;
};

beforeEach(() => {
	mockViewport();
	vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(48);
	vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(48);
});

afterEach(() => {
	wrappers.splice(0).forEach(wrapper => wrapper.unmount());
	document.body.innerHTML = '';
	vi.restoreAllMocks();
});

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof FloatButton).toBe('object');
		expect(typeof MFloatButton).toBe('object');
	});

	it('默认挂到 body，停在右下角，同步 v-model:offset', async () => {
		const onUpdate = vi.fn();
		const wrapper = attach(mount(FloatButton, {
			attachTo: document.body,
			props: { 'icon': 'service', 'class': 'custom', 'aria-label': '客服', 'onUpdate:offset': onUpdate }
		}));
		await nextTick();

		expect(wrapper.find('.vc-float-button__placeholder').exists()).toBe(true);
		const button = getButton();
		expect(button.parentElement).toBe(document.body);
		expect(button.getAttribute('type')).toBe('button');
		expect(button.getAttribute('aria-label')).toBe('客服');
		expect([...button.classList].sort()).toEqual(['custom', 'is-circle', 'is-draggable', 'vc-float-button']);
		expect(button.querySelector('.vc-float-button__icon')).not.toBeNull();
		expect(getTranslate()).toEqual({ x: 928, y: 728 });
		expect(onUpdate).toHaveBeenLastCalledWith({ x: 928, y: 728 });
	});

	it('draggable 默认为 y：只沿纵向移动，拖动后的 click 不触发', async () => {
		const onClick = vi.fn();
		const onAfterChange = vi.fn();
		attach(mount(FloatButton, { attachTo: document.body, props: { onClick, onAfterChange } }));
		await nextTick();

		await drag(950, 750, -150, -150);
		expect(getTranslate()).toEqual({ x: 928, y: 578 });
		expect(onAfterChange).toHaveBeenCalledTimes(1);
		expect(onAfterChange).toHaveBeenLastCalledWith({ x: 928, y: 578 });

		// 拖动松开后紧跟的原生 click 被吞掉
		getButton().click();
		expect(onClick).not.toHaveBeenCalled();

		// 点按
		firePointer('pointerdown', 950, 600);
		firePointer('pointerup', 950, 600);
		getButton().click();
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('draggable 为 x / true / false', async () => {
		const draggable = ref<boolean | 'x'>('x');
		attach(mount(() => <FloatButton draggable={draggable.value} />, { attachTo: document.body }));
		await nextTick();

		await drag(950, 750, -200, -200);
		expect(getTranslate()).toEqual({ x: 728, y: 728 });

		draggable.value = true;
		await nextTick();
		await drag(750, 750, -100, -100);
		expect(getTranslate()).toEqual({ x: 628, y: 628 });

		draggable.value = false;
		await nextTick();
		expect(getButton().classList.contains('is-draggable')).toBe(false);
		await drag(650, 650, -100, -100);
		expect(getTranslate()).toEqual({ x: 628, y: 628 });
	});

	it('拖出边界时限制在边界内，gap 数组为 [左右, 上下]', async () => {
		attach(mount(() => <FloatButton draggable gap={[10, 40]} />, { attachTo: document.body }));
		await nextTick();
		expect(getTranslate()).toEqual({ x: 942, y: 712 });

		await drag(950, 750, -2000, -2000);
		expect(getTranslate()).toEqual({ x: 10, y: 40 });
	});

	it('magnetic：x 吸到左右，y 吸到上下，true 吸到最近的一边', async () => {
		const magnetic = ref<boolean | 'x' | 'y'>('x');
		attach(mount(() => <FloatButton draggable magnetic={magnetic.value} />, { attachTo: document.body }));
		await nextTick();

		// 拖到左半边、纵向中部：吸到左边
		await drag(950, 750, -650, -400);
		expect(getTranslate()).toEqual({ x: 24, y: 328 });
		expect(getButton().classList.contains('is-snapping')).toBe(true);

		magnetic.value = 'y';
		await nextTick();
		// x 24 → 324，y 328 → 228：较靠上，吸到上边
		await drag(50, 350, 300, -100);
		expect(getTranslate()).toEqual({ x: 324, y: 24 });

		magnetic.value = true;
		await nextTick();
		// x 324 → 874（距右边 54），y 24 → 324（距上边 300）：右边最近
		await drag(350, 50, 550, 300);
		expect(getTranslate()).toEqual({ x: 928, y: 324 });
	});

	it('边界尺寸变化：贴住的边保持不变，其它位置限制在边界内', async () => {
		const offset = ref({ x: 300, y: 300 });
		attach(mount(() => (
			<div>
				<FloatButton />
				<FloatButton v-model:offset={offset.value} />
			</div>
		), { attachTo: document.body }));
		await nextTick();
		const [stuck, free] = Array.from(document.body.querySelectorAll<HTMLElement>('.vc-float-button'));

		mockViewport(1200, 500);
		window.dispatchEvent(new Event('resize'));
		await nextTick();
		expect(stuck.style.transform).toBe('translate3d(1128px, 428px, 0)');
		expect(free.style.transform).toBe('translate3d(300px, 300px, 0)');

		mockViewport(200, 200);
		window.dispatchEvent(new Event('resize'));
		await nextTick();
		expect(free.style.transform).toBe('translate3d(128px, 128px, 0)');
		expect(offset.value).toEqual({ x: 128, y: 128 });
	});

	it('外部修改 v-model:offset 时移过去；reset 回到右下角', async () => {
		const offset = ref({ x: 100, y: 100 });
		const wrapper = attach(mount(defineComponent({
			setup() {
				const instance = ref();
				return { instance, offset };
			},
			render() {
				return <FloatButton ref="instance" v-model:offset={this.offset} />;
			}
		}), { attachTo: document.body }));
		await nextTick();
		expect(getTranslate()).toEqual({ x: 100, y: 100 });

		offset.value = { x: 400, y: 5000 };
		await nextTick();
		expect(getTranslate()).toEqual({ x: 400, y: 728 });
		expect(offset.value).toEqual({ x: 400, y: 728 });

		(wrapper.vm as any).instance.reset();
		await nextTick();
		expect(getTranslate()).toEqual({ x: 928, y: 728 });
		expect(offset.value).toEqual({ x: 928, y: 728 });
	});

	it('方向键：只在可拖动的方向上移动，Shift 为 40px，吸边方向直接移到那一边', async () => {
		const onAfterChange = vi.fn();
		const magnetic = ref<boolean | 'x'>(false);
		const draggable = ref<boolean | 'y'>('y');
		attach(mount(() => (
			<FloatButton draggable={draggable.value} magnetic={magnetic.value} onAfterChange={onAfterChange} />
		), { attachTo: document.body }));
		await nextTick();

		await keydown('ArrowUp');
		expect(getTranslate()).toEqual({ x: 928, y: 720 });
		await keydown('ArrowUp', { shiftKey: true });
		expect(getTranslate()).toEqual({ x: 928, y: 680 });
		await keydown('ArrowLeft');
		expect(getTranslate()).toEqual({ x: 928, y: 680 });
		// 已在下边界之外的方向：位置不变，不触发 after-change
		expect(onAfterChange).toHaveBeenCalledTimes(2);

		draggable.value = true;
		magnetic.value = 'x';
		await nextTick();
		await keydown('ArrowLeft');
		expect(getTranslate()).toEqual({ x: 24, y: 680 });
		expect(onAfterChange).toHaveBeenLastCalledWith({ x: 24, y: 680 });

		// 回车由浏览器转成 click，不移动
		await keydown('Enter');
		expect(getTranslate()).toEqual({ x: 24, y: 680 });
	});

	it('滚动容器是元素时限制在它的可视区内', async () => {
		attach(mount(() => (
			<div class="box" style="overflow: auto; height: 300px;">
				<FloatButton draggable gap={10} />
			</div>
		), { attachTo: document.body }));
		await nextTick();
		const box = document.body.querySelector<HTMLElement>('.box')!;
		// 按钮的 offsetWidth / offsetHeight 已在原型上 mock，这里只给容器定义自有属性
		Object.entries({ clientWidth: 300, clientHeight: 200, offsetWidth: 300, offsetHeight: 200 }).forEach(([key, value]) => {
			Object.defineProperty(box, key, { configurable: true, get: () => value });
		});
		vi.spyOn(box, 'getBoundingClientRect').mockReturnValue({ top: 100, left: 50, right: 350, bottom: 300, width: 300, height: 200 } as DOMRect);
		window.dispatchEvent(new Event('resize'));
		await nextTick();

		// 可视区 (50, 100) ~ (350, 300)：范围 x 10 ~ 242、y 10 ~ 142
		expect(getTranslate()).toEqual({ x: 50 + 242, y: 100 + 142 });

		// 容器离开视口后隐藏
		vi.spyOn(box, 'getBoundingClientRect').mockReturnValue({ top: -400, left: 50, right: 350, bottom: -200, width: 300, height: 200 } as DOMRect);
		window.dispatchEvent(new Event('resize'));
		await nextTick();
		expect(getButton().classList.contains('is-hidden')).toBe(true);
		expect(getButton().getAttribute('tabindex')).toBe('-1');
	});

	it('portal 为 false 时渲染在原处；shape、zIndex、插槽', async () => {
		const wrapper = attach(mount(() => (
			<FloatButton portal={false} shape="square" zIndex={9}>
				{{ default: ({ dragging }: { dragging: boolean }) => (dragging ? '拖动中' : '客服') }}
			</FloatButton>
		), { attachTo: document.body }));
		await nextTick();

		const button = wrapper.find('.vc-float-button');
		expect(button.exists()).toBe(true);
		expect(button.classes()).toContain('is-square');
		expect((button.element as HTMLElement).style.zIndex).toBe('9');
		expect(button.text()).toBe('客服');

		firePointer('pointerdown', 950, 750);
		firePointer('pointermove', 950, 700);
		await nextTick();
		expect(button.text()).toBe('拖动中');
		expect(button.classes()).toContain('is-dragging');
		firePointer('pointerup', 950, 700);
		await nextTick();
		expect(button.text()).toBe('客服');
	});

	it('KeepAlive 失活时隐藏，激活后重新定位', async () => {
		const Page = defineComponent({ render: () => h(FloatButton) });
		const Empty = defineComponent({ render: () => h('div') });
		const active = ref(true);
		attach(mount(() => <KeepAlive>{active.value ? h(Page) : h(Empty)}</KeepAlive>, { attachTo: document.body }));
		await nextTick();
		expect(getButton().classList.contains('is-hidden')).toBe(false);

		active.value = false;
		await nextTick();
		expect(getButton().classList.contains('is-hidden')).toBe(true);

		active.value = true;
		await nextTick();
		await nextTick();
		expect(getButton().classList.contains('is-hidden')).toBe(false);
		expect(getTranslate()).toEqual({ x: 928, y: 728 });
	});

	it('MFloatButton：标记类 vcm-float-button，数字 gap 为 750 稿长度', async () => {
		// 未量到 --vc-rem 时按 375 宽（1 单位 = 0.5px）
		attach(mount(() => <MFloatButton gap={[100, 60]} />, { attachTo: document.body }));
		await nextTick();
		expect(getButton().classList.contains('vcm-float-button')).toBe(true);
		expect(getTranslate()).toEqual({ x: 1000 - 50 - 48, y: 800 - 30 - 48 });
	});
});
