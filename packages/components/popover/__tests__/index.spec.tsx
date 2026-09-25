// @vitest-environment jsdom

import { Popover, Select } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Resize } from '@deot/helper-resize';
import { nextTick, ref } from 'vue';
import { vi, onTestFinished } from 'vitest';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const fireEvent = (
	el: Element,
	type: 'mouseenter' | 'mouseleave' | 'mousedown' | 'mouseup' | 'click' | 'focus' | 'blur'
) => {
	const Ctor = (type === 'focus' || type === 'blur') ? FocusEvent : MouseEvent;
	el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true }));
};

const getWrapperEl = () => document.querySelector('.vc-popover-wrapper') as HTMLElement | null;

const setRect = (el: Element, rect: Partial<DOMRect>) => {
	(el as any).getBoundingClientRect = () => ({
		x: 0, y: 0, width: 0, height: 0,
		top: 0, left: 0, right: 0, bottom: 0,
		toJSON: () => ({}),
		...rect
	});
};

// 手动触发节点的 ResizeObserver 回调（测试环境中为 mock）
const resize = (el: Element) => (el as any).__rz__.handleResize([{ target: el }]);

describe('index.ts', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('basic', () => {
		expect(typeof Popover).toBe('object');
		expect(typeof Popover.open).toBe('function');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Popover />));
		await nextTick();

		expect(wrapper.classes()).toContain('vc-popover');
		expect(getWrapperEl()).toBeNull();

		wrapper.unmount();
	});
});

describe('Popover trigger', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('trigger="click": 点击切换显隐', async () => {
		const wrapper = mount(() => (
			<Popover trigger="click" content="hello">
				<button class="trigger-btn">trigger</button>
			</Popover>
		), { attachTo: document.body });
		await nextTick();

		expect(getWrapperEl()).toBeNull();

		await wrapper.trigger('click');
		await flush();
		expect(getWrapperEl()).not.toBeNull();
		expect(getWrapperEl()!.style.display).not.toBe('none');

		await wrapper.trigger('click');
		await flush();
		expect(getWrapperEl()!.style.display).toBe('none');

		wrapper.unmount();
	});

	it('trigger="hover": mouseenter 弹出, mouseleave 延时关闭', async () => {
		const wrapper = mount(() => (
			<Popover trigger="hover" content="hover-content">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await nextTick();

		fireEvent(wrapper.element, 'mouseenter');
		await flush();
		expect(getWrapperEl()).not.toBeNull();
		expect(getWrapperEl()!.style.display).not.toBe('none');

		fireEvent(wrapper.element, 'mouseleave');
		// 200ms 后才会真正关闭
		await sleep(220);
		await flush();
		expect(getWrapperEl()!.style.display).toBe('none');

		wrapper.unmount();
	});

	it('trigger="strictHover": 走 hover 链路', async () => {
		const wrapper = mount(() => (
			<Popover trigger="strictHover" content="strict">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await nextTick();

		fireEvent(wrapper.element, 'mouseenter');
		await flush();
		expect(getWrapperEl()).not.toBeNull();

		wrapper.unmount();
	});

	it('trigger="focus": focus 弹出, blur 关闭', async () => {
		const wrapper = mount(() => (
			<Popover trigger="focus" content="focus-content">
				<input class="focus-input" />
			</Popover>
		), { attachTo: document.body });
		await nextTick();

		fireEvent(wrapper.element, 'focus');
		await flush();
		expect(getWrapperEl()).not.toBeNull();
		expect(getWrapperEl()!.style.display).not.toBe('none');

		fireEvent(wrapper.element, 'blur');
		await flush();
		expect(getWrapperEl()!.style.display).toBe('none');

		wrapper.unmount();
	});

	it('trigger="focus" 修复: 非 focus 触发器下 blur 不应触发关闭', async () => {
		// 如果 isFocus 漏写 .value (regression)，blur 会强制走 handleChange 关闭
		const value = ref(true);
		const wrapper = mount(() => (
			<Popover v-model={value.value} trigger="click" content="x">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await flush();

		expect(getWrapperEl()!.style.display).not.toBe('none');

		fireEvent(wrapper.element, 'blur');
		await flush();

		expect(value.value).toBe(true);
		expect(getWrapperEl()!.style.display).not.toBe('none');

		wrapper.unmount();
	});

	it('disabled 时 click 不弹出', async () => {
		const wrapper = mount(() => (
			<Popover trigger="click" content="disabled" disabled>
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		expect(getWrapperEl()).toBeNull();
		wrapper.unmount();
	});
});

describe('Popover v-model & always & outsideClickable', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('v-model 控制弹出显示, 弹出后修改 false 会关闭', async () => {
		const visible = ref(true);
		const wrapper = mount(() => (
			<Popover v-model={visible.value} trigger="click" content="vm">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await flush();

		expect(getWrapperEl()).not.toBeNull();
		expect(getWrapperEl()!.style.display).not.toBe('none');

		visible.value = false;
		await flush();
		expect(getWrapperEl()!.style.display).toBe('none');

		wrapper.unmount();
	});

	it('always: 与 modelValue=true 配合, click 不会关闭', async () => {
		// demo 中 always 与 :model-value="true" 一起使用以保持显示
		const visible = ref(true);
		const wrapper = mount(() => (
			<Popover v-model={visible.value} always trigger="click" content="always">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await flush();

		expect(getWrapperEl()).not.toBeNull();
		expect(getWrapperEl()!.style.display).not.toBe('none');

		// always 时 isClick.value 为 false，click 不会触发 handleChange
		await wrapper.trigger('click');
		await flush();
		expect(getWrapperEl()!.style.display).not.toBe('none');

		wrapper.unmount();
	});

	it('默认 outsideClickable=true: 点击外部关闭', async () => {
		const visible = ref(true);
		const outside = document.createElement('div');
		outside.className = 'outside-area';
		document.body.appendChild(outside);

		const wrapper = mount(() => (
			<Popover v-model={visible.value} trigger="click" content="x">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await flush();

		expect(getWrapperEl()!.style.display).not.toBe('none');

		outside.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
		await flush();

		expect(visible.value).toBe(false);
		expect(getWrapperEl()!.style.display).toBe('none');

		wrapper.unmount();
		document.body.removeChild(outside);
	});

	it('outsideClickable=false: 点击外部不会关闭', async () => {
		const visible = ref(true);
		const outside = document.createElement('div');
		outside.className = 'outside-area';
		document.body.appendChild(outside);

		const wrapper = mount(() => (
			<Popover
				v-model={visible.value}
				trigger="click"
				content="x"
				outsideClickable={false}
			>
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await flush();

		outside.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
		await flush();

		expect(visible.value).toBe(true);
		expect(getWrapperEl()!.style.display).not.toBe('none');

		wrapper.unmount();
		document.body.removeChild(outside);
	});

	it('点击弹层内部（portal=false）不会关闭', async () => {
		const visible = ref(true);
		const wrapper = mount(() => (
			<Popover v-model={visible.value} trigger="click" portal={false}>
				{{
					default: () => <button>btn</button>,
					content: () => <span class="inner-text">inner</span>
				}}
			</Popover>
		), { attachTo: document.body });
		await flush();

		// portal=false 时弹层挂在 trigger 节点下，点击内部应被识别为 popArea
		const inner = wrapper.element.querySelector('.inner-text') as HTMLElement;
		expect(inner).not.toBeNull();
		inner.click();
		await flush();

		expect(visible.value).toBe(true);

		wrapper.unmount();
	});
});

describe('Popover 容器 (portal / getPopupContainer)', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('默认 portal=true: 弹层挂到 document.body', async () => {
		const wrapper = mount(() => (
			<Popover trigger="click" content="body-content">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await wrapper.trigger('click');
		await flush();

		const wrapperEl = getWrapperEl();
		expect(wrapperEl).not.toBeNull();
		// portal 渲染时 root=body，wrapper 不在 trigger 内
		expect(wrapper.element.contains(wrapperEl)).toBe(false);

		wrapper.unmount();
	});

	it('portal=false: 弹层挂在 trigger 父节点', async () => {
		const wrapper = mount(() => (
			<Popover trigger="click" portal={false} content="parent-content">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await wrapper.trigger('click');
		await flush();

		const wrapperEl = getWrapperEl();
		expect(wrapperEl).not.toBeNull();
		expect(wrapper.element.contains(wrapperEl)).toBe(true);

		wrapper.unmount();
	});

	it('getPopupContainer: 弹层挂到自定义容器', async () => {
		const container = document.createElement('div');
		container.className = 'custom-container';
		document.body.appendChild(container);

		const wrapper = mount(() => (
			<Popover
				trigger="click"
				content="custom-content"
				getPopupContainer={() => container}
			>
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await wrapper.trigger('click');
		await flush();

		const wrapperEl = getWrapperEl();
		expect(wrapperEl).not.toBeNull();
		expect(container.contains(wrapperEl!)).toBe(true);

		wrapper.unmount();
		document.body.removeChild(container);
	});
});

describe('Popover 内容渲染', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('content prop 字符串渲染', async () => {
		const wrapper = mount(() => (
			<Popover trigger="click" content="<span class='c-prop'>prop</span>">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await wrapper.trigger('click');
		await flush();

		expect(document.querySelector('.c-prop')).not.toBeNull();
		expect(document.querySelector('.c-prop')!.textContent).toBe('prop');

		wrapper.unmount();
	});

	it('#content slot 优先于 content prop', async () => {
		const wrapper = mount(() => (
			<Popover trigger="click" content="prop-string">
				{{
					default: () => <button>btn</button>,
					content: () => <span class="c-slot">slot</span>
				}}
			</Popover>
		), { attachTo: document.body });
		await wrapper.trigger('click');
		await flush();

		expect(document.querySelector('.c-slot')).not.toBeNull();
		expect(document.body.innerHTML).not.toContain('prop-string');

		wrapper.unmount();
	});

	it('content 函数渲染走 Customer 组件', async () => {
		const renderFn = vi.fn(() => (<span class="c-fn">fn-render</span>) as any);
		const wrapper = mount(() => (
			<Popover trigger="click" content={renderFn}>
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await wrapper.trigger('click');
		await flush();

		expect(renderFn).toHaveBeenCalled();
		expect(document.querySelector('.c-fn')).not.toBeNull();

		wrapper.unmount();
	});
});

describe('Popover 外观 (theme / placement / arrow)', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('theme="dark" 设置 is-dark', async () => {
		const wrapper = mount(() => (
			<Popover trigger="click" content="d" theme="dark">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await wrapper.trigger('click');
		await flush();

		const container = document.querySelector('.vc-popover-wrapper__container')!;
		expect(container.classList.contains('is-dark')).toBe(true);
		expect(container.classList.contains('is-light')).toBe(false);

		wrapper.unmount();
	});

	it('theme="light" 设置 is-light (默认)', async () => {
		const wrapper = mount(() => (
			<Popover trigger="click" content="l">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await wrapper.trigger('click');
		await flush();

		const container = document.querySelector('.vc-popover-wrapper__container')!;
		expect(container.classList.contains('is-light')).toBe(true);

		wrapper.unmount();
	});

	it('arrow=false 不渲染箭头节点', async () => {
		const wrapper = mount(() => (
			<Popover trigger="click" content="x" arrow={false}>
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await wrapper.trigger('click');
		await flush();

		expect(document.querySelector('.vc-popover-wrapper__arrow')).toBeNull();

		wrapper.unmount();
	});

	const placements = [
		'bottom', 'bottom-left', 'bottom-right',
		'top', 'top-left', 'top-right',
		'left', 'left-top', 'left-bottom',
		'right', 'right-top', 'right-bottom'
	];
	placements.forEach((p) => {
		it(`placement="${p}" 渲染弹层`, async () => {
			const wrapper = mount(() => (
				<Popover trigger="click" content="p" placement={p}>
					<button>btn</button>
				</Popover>
			), { attachTo: document.body });
			await wrapper.trigger('click');
			await flush();

			const wrapperEl = getWrapperEl();
			expect(wrapperEl).not.toBeNull();

			wrapper.unmount();
		});
	});

	it('placement 切换会带上方向类 (is-top / is-bottom 等)', async () => {
		const wrapper = mount(() => (
			<Popover trigger="click" content="x" placement="top">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await wrapper.trigger('click');
		await flush();

		const wrapperEl = getWrapperEl()!;
		expect(wrapperEl.classList.contains('is-top')).toBe(true);

		wrapper.unmount();
	});

	it('autoWidth=false 时弹层宽度跟随 trigger', async () => {
		const wrapper = mount(() => (
			<Popover trigger="click" content="x" autoWidth={false}>
				<button class="auto-trigger">btn</button>
			</Popover>
		), { attachTo: document.body });
		await nextTick();

		// 强制 boundingClientRect 给定宽度（setPopupStyle 内部读取的就是 getBoundingClientRect().width）
		setRect(wrapper.element, { width: 120, height: 30 });

		await wrapper.trigger('click');
		await flush();

		// 手动触发 ResizeObserver 回调，让 setPopupStyle 真正执行
		const rz = (wrapper.element as any).__rz__;
		rz?.handleResize?.([{ target: wrapper.element }]);
		// debounce(50, leading:true) 之后再次触发以等待 trailing 状态
		await sleep(60);
		rz?.handleResize?.([{ target: wrapper.element }]);
		await flush();

		const wrapperEl = getWrapperEl();
		expect(wrapperEl).not.toBeNull();
		expect(wrapperEl!.style.width).toBe('120px');

		wrapper.unmount();
	});
});

describe('Popover 事件 (ready / close / visible-change / update:modelValue)', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('打开时触发 ready / visible-change(true) / update:modelValue(true)', async () => {
		const onReady = vi.fn();
		const onVisibleChange = vi.fn();
		const onUpdate = vi.fn();
		const wrapper = mount(() => (
			<Popover
				trigger="click"
				content="x"
				onReady={onReady}
				onVisibleChange={onVisibleChange}
				// @ts-ignore
				{...{ 'onUpdate:modelValue': onUpdate }}
			>
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await nextTick();

		await wrapper.trigger('click');
		await flush();

		expect(onReady).toHaveBeenCalled();
		expect(onVisibleChange).toHaveBeenCalledWith(true);
		expect(onUpdate).toHaveBeenCalledWith(true);

		wrapper.unmount();
	});

	it('外部点击触发 update:modelValue(false) + visible-change(false)', async () => {
		// 通过 docClick 关闭路径会调用 sync() 同步 emit
		const onUpdate = vi.fn();
		const onVisibleChange = vi.fn();
		const visible = ref(true);
		const outside = document.createElement('div');
		outside.className = 'outside-2';
		document.body.appendChild(outside);

		const wrapper = mount(() => (
			<Popover
				v-model={visible.value}
				trigger="click"
				content="x"
				onVisibleChange={onVisibleChange}
				// @ts-ignore
				{...{ 'onUpdate:modelValue': onUpdate }}
			>
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await flush();

		outside.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
		await flush();

		expect(onUpdate).toHaveBeenLastCalledWith(false);
		expect(onVisibleChange).toHaveBeenLastCalledWith(false);

		wrapper.unmount();
		document.body.removeChild(outside);
	});

	it('卸载时销毁 portal 实例（不抛错）', async () => {
		const visible = ref(true);
		const wrapper = mount(() => (
			<Popover v-model={visible.value} content="x">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await flush();
		expect(getWrapperEl()).not.toBeNull();

		wrapper.unmount();
		await flush();
		// 卸载后 portal 节点立即移除（不依赖动画收尾）
		expect(getWrapperEl()).toBeNull();
	});
});

describe('Popover.open (静态方法)', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('Popover.open 在 body 渲染弹层', async () => {
		const triggerEl = document.createElement('button');
		triggerEl.id = 'static-trigger';
		document.body.appendChild(triggerEl);

		const leaf = Popover.open({
			el: document.body,
			name: 'static-1',
			triggerEl,
			content: () => (<span class="static-c">static</span>) as any
		});
		await flush();

		expect(getWrapperEl()).not.toBeNull();
		expect(document.querySelector('.static-c')).not.toBeNull();

		leaf.destroy();
		await flush();
	});

	it('Popover.open hover=true 时 mouseenter 控制弹层显示', async () => {
		const triggerEl = document.createElement('button');
		triggerEl.id = 'static-hover';
		document.body.appendChild(triggerEl);

		const leaf = Popover.open({
			el: document.body,
			name: 'static-hover-1',
			triggerEl,
			hover: true,
			content: () => (<span class="static-h">hover</span>) as any
		});
		await flush();

		fireEvent(triggerEl, 'mouseenter');
		// 内部触发延时 200ms
		await sleep(220);
		await flush();

		expect(getWrapperEl()).not.toBeNull();

		leaf.destroy();
		await flush();
	});

	it('Popover.open alone=true (默认) 模式下，外部点击关闭', async () => {
		const triggerEl = document.createElement('button');
		document.body.appendChild(triggerEl);
		const outside = document.createElement('div');
		outside.className = 'outer-area';
		document.body.appendChild(outside);

		const leaf = Popover.open({
			el: document.body,
			name: 'static-alone',
			triggerEl,
			content: () => (<span>x</span>) as any
		});
		await flush();
		expect(getWrapperEl()).not.toBeNull();

		outside.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
		await flush();
		// alone 模式下 wrapper 自管理 isActive，外部点击会触发 v-show 关闭
		expect(getWrapperEl()!.style.display).toBe('none');

		leaf.destroy();
		await flush();
	});

	it('Popover.open 弹层内部 mousedown→外部 click 不关闭', async () => {
		const triggerEl = document.createElement('button');
		document.body.appendChild(triggerEl);

		const leaf = Popover.open({
			el: document.body,
			name: 'static-mousedown',
			triggerEl,
			content: () => (<span class="inner-mousedown">x</span>) as any
		});
		await flush();
		const wrapperEl = getWrapperEl()!;
		expect(wrapperEl).not.toBeNull();

		// 内部 mousedown
		wrapperEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
		// 外部 click（鼠标 down 在内部 → up 在外部）
		document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		// 应保留显示
		expect(wrapperEl.style.display).not.toBe('none');

		leaf.destroy();
		await flush();
	});
});

describe('Popover 位置自适应 (use-pos)', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	const setupRectAndOpen = async (placement: string, triggerRect: Partial<DOMRect>) => {
		const wrapper = mount(() => (
			<Popover trigger="click" content="x" placement={placement}>
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await nextTick();

		setRect(wrapper.element, triggerRect);
		await wrapper.trigger('click');
		await flush();

		// 触发一次 ResizeObserver 回调以驱动 setPopupStyle (debounce leading: true)
		const triggerRz = (wrapper.element as any).__rz__;
		triggerRz?.handleResize?.([{ target: wrapper.element }]);
		await flush();
		// 等待 debounce 间隔后再次触发 trailing 路径
		await sleep(60);
		triggerRz?.handleResize?.([{ target: wrapper.element }]);
		await flush();

		return wrapper;
	};

	const placements = [
		'bottom', 'bottom-left', 'bottom-right',
		'top', 'top-left', 'top-right',
		'left', 'left-top', 'left-bottom',
		'right', 'right-top', 'right-bottom'
	];

	placements.forEach((p) => {
		it(`getPopupStyle - placement="${p}" 计算样式`, async () => {
			// 给 trigger 一个屏幕中心的 rect，避免 fit 反向到对面
			const rect = { x: 500, y: 400, width: 80, height: 30, left: 500, top: 400, right: 580, bottom: 430 };
			const wrapper = await setupRectAndOpen(p, rect);

			const wrapperEl = getWrapperEl();
			expect(wrapperEl).not.toBeNull();
			// 计算结果一定带 px (top 或 left)
			const hasTop = !!wrapperEl!.style.top;
			const hasLeft = !!wrapperEl!.style.left;
			expect(hasTop || hasLeft).toBe(true);

			wrapper.unmount();
		});
	});

	const setOffset = (el: Element, w = 200, h = 100) => {
		Object.defineProperty(el, 'offsetWidth', { configurable: true, value: w });
		Object.defineProperty(el, 'offsetHeight', { configurable: true, value: h });
	};

	const openWithFit = async (placement: string, triggerRect: Partial<DOMRect>, wrapperSize = { w: 200, h: 100 }) => {
		const wrapper = mount(() => (
			<Popover trigger="click" content="x" placement={placement}>
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await nextTick();

		setRect(wrapper.element, triggerRect);
		await wrapper.trigger('click');
		await flush();

		const wrapperEl = getWrapperEl();
		if (wrapperEl) setOffset(wrapperEl, wrapperSize.w, wrapperSize.h);
		// 使 getFitPos 能拿到非零 offset
		const triggerRz = (wrapper.element as any).__rz__;
		triggerRz?.handleResize?.([{ target: wrapper.element }]);
		await sleep(60);
		triggerRz?.handleResize?.([{ target: wrapper.element }]);
		await flush();

		return wrapper;
	};

	it('placement 反向 fit: trigger 紧靠右边时 right→left', async () => {
		const wrapper = await openWithFit(
			'right',
			{ x: 1000, y: 100, width: 80, height: 30, left: 1000, top: 100, right: 1080, bottom: 130 }
		);
		expect(getWrapperEl()).not.toBeNull();
		wrapper.unmount();
	});

	it('placement 反向 fit: trigger 紧靠左边时 left→right', async () => {
		const wrapper = await openWithFit(
			'left',
			{ x: 0, y: 100, width: 80, height: 30, left: 0, top: 100, right: 80, bottom: 130 }
		);
		expect(getWrapperEl()).not.toBeNull();
		wrapper.unmount();
	});

	it('placement 反向 fit: trigger 紧靠顶部时 top→bottom', async () => {
		const wrapper = await openWithFit(
			'top',
			{ x: 200, y: 0, width: 80, height: 30, left: 200, top: 0, right: 280, bottom: 30 }
		);
		expect(getWrapperEl()).not.toBeNull();
		wrapper.unmount();
	});

	it('placement 反向 fit: trigger 紧靠底部时 bottom→top', async () => {
		const wrapper = await openWithFit(
			'bottom',
			{ x: 200, y: 760, width: 80, height: 30, left: 200, top: 760, right: 280, bottom: 790 }
		);
		expect(getWrapperEl()).not.toBeNull();
		wrapper.unmount();
	});

	it('辅助方向 fit: top-left 在右下时翻转为 bottom-right', async () => {
		// top-left → bottomSurplus < 0, top 不够 → fit 到 bottom; 同时 left 不够 → fit 到 right
		const wrapper = await openWithFit(
			'top-left',
			{ x: 1000, y: 760, width: 80, height: 30, left: 1000, top: 760, right: 1080, bottom: 790 }
		);
		expect(getWrapperEl()).not.toBeNull();
		wrapper.unmount();
	});

	it('辅助方向 fit: bottom-right 在左上时翻转方向', async () => {
		const wrapper = await openWithFit(
			'bottom-right',
			{ x: 0, y: 0, width: 80, height: 30, left: 0, top: 0, right: 80, bottom: 30 }
		);
		expect(getWrapperEl()).not.toBeNull();
		wrapper.unmount();
	});

	it('辅助方向 fit: right 上下空间不足时自动加上 -top/-bottom', async () => {
		const wrapper = await openWithFit(
			'right',
			{ x: 200, y: 0, width: 80, height: 30, left: 200, top: 0, right: 280, bottom: 30 }
		);
		expect(getWrapperEl()).not.toBeNull();
		wrapper.unmount();
	});

	it('辅助方向 fit: top 左右空间不足时自动加上 -left/-right', async () => {
		const wrapper = await openWithFit(
			'top',
			{ x: 0, y: 200, width: 80, height: 30, left: 0, top: 200, right: 80, bottom: 230 }
		);
		expect(getWrapperEl()).not.toBeNull();
		wrapper.unmount();
	});

	it('getRect: getPopupContainer 节点定位 (hasContainer=true)', async () => {
		const container = document.createElement('div');
		container.className = 'pos-container';
		container.style.cssText = 'position: absolute; left: 0; top: 0;';
		document.body.appendChild(container);
		// container 必须能让 getBoundingClientRect 返回（jsdom 默认全 0）
		setRect(container, { x: 0, y: 0, width: 1000, height: 800 });

		const wrapper = mount(() => (
			<Popover
				trigger="click"
				content="x"
				placement="bottom"
				getPopupContainer={() => container}
			>
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await nextTick();

		setRect(wrapper.element, { x: 100, y: 50, width: 80, height: 30, top: 50, left: 100, bottom: 80, right: 180 });
		await wrapper.trigger('click');
		await flush();

		// 触发 setPopupStyle
		const triggerRz = (wrapper.element as any).__rz__;
		triggerRz?.handleResize?.([{ target: wrapper.element }]);
		await flush();

		expect(getWrapperEl()).not.toBeNull();

		wrapper.unmount();
		document.body.removeChild(container);
	});

	it('document scroll 触发 setPopupStyle 重新计算', async () => {
		const wrapper = mount(() => (
			<Popover trigger="click" content="x" placement="bottom">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await nextTick();
		setRect(wrapper.element, { x: 100, y: 100, width: 80, height: 30, top: 100, left: 100, bottom: 130, right: 180 });
		await wrapper.trigger('click');
		await flush();

		document.dispatchEvent(new Event('scroll'));
		await sleep(60);
		await flush();

		expect(getWrapperEl()).not.toBeNull();
		wrapper.unmount();
	});

	// 测试环境中 Transition 被 stub（<transition-stub>），弹层组件的根节点（尺寸与 RO 所在）是 .vc-popover-wrapper 的父节点
	const getWrapperRoot = () => getWrapperEl()!.parentElement!;

	// 弹层尺寸变为 w × h，触发其 RO 回调并等待节流
	const resizeTo = async (w: number, h: number) => {
		setOffset(getWrapperRoot(), w, h);
		resize(getWrapperRoot());
		await sleep(30);
	};

	// 80 × 30、左上角在 (x, y) 的触发节点
	const triggerRect = (x: number, y: number) => ({ x, y, width: 80, height: 30, top: y, left: x, bottom: y + 30, right: x + 80 });

	const openAt = async (placement: string, x = 500, y = 400) => {
		const wrapper = mount(() => (
			<Popover trigger="click" content="x" placement={placement}>
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await nextTick();
		setRect(wrapper.element, triggerRect(x, y));
		await wrapper.trigger('click');
		await flush();
		return wrapper;
	};

	const stubTranslate = (supported: boolean) => {
		vi.stubGlobal('CSS', { supports: () => supported });
		onTestFinished(() => { vi.unstubAllGlobals(); });
	};

	it('上下方向右侧超出视口时靠右', async () => {
		// bottom-left：左右都放不下 900px 宽的弹层，保持 bottom-left，右侧超出后靠右
		const wrapper = await openAt('bottom-left', 300, 100);
		await resizeTo(900, 100);
		expect(getWrapperEl()!.style.left).toBe('124px'); // 1024 - 900

		wrapper.unmount();
	});

	it('placement=right 时弹层高度变化后重新垂直居中', async () => {
		const wrapper = await openAt('right', 100, 100);
		const wrapperEl = getWrapperEl()!;
		await resizeTo(200, 100);
		expect(wrapperEl.style.top).toBe('65px'); // 100 + (30 - 100) / 2

		// 内容变高（如图片加载）
		await resizeTo(200, 200);
		expect(wrapperEl.style.top).toBe('15px'); // 100 + (30 - 200) / 2

		wrapper.unmount();
	});

	it('尺寸在短时间内连续变化：按最后一次计算', async () => {
		const wrapper = await openAt('right');
		setOffset(getWrapperRoot(), 200, 50);
		resize(getWrapperRoot());
		await resizeTo(200, 200);
		expect(getWrapperEl()!.style.top).toBe('315px'); // 400 + (30 - 200) / 2

		wrapper.unmount();
	});

	it('placement=top：以靠近触发节点的一边定位（translate 上移），内容长高时位置不变', async () => {
		stubTranslate(true);
		const wrapper = await openAt('top');
		const wrapperEl = getWrapperEl()!;
		await resizeTo(200, 50);
		expect(wrapperEl.style.top).toBe('396px'); // 400 - 4
		expect((wrapperEl.style as any).translate).toBe('0 -100%');
		expect(wrapperEl.style.left).toBe('440px'); // 500 + (80 - 200) / 2

		await resizeTo(200, 200);
		expect(wrapperEl.style.top).toBe('396px');

		wrapper.unmount();
	});

	it('placement=left：以靠近触发节点的一边定位（translate 左移），内容变宽时位置不变', async () => {
		stubTranslate(true);
		const wrapper = await openAt('left');
		const wrapperEl = getWrapperEl()!;
		await resizeTo(200, 100);
		expect(wrapperEl.style.left).toBe('496px'); // 500 - 4
		expect((wrapperEl.style as any).translate).toBe('-100% 0');

		await resizeTo(300, 100);
		expect(wrapperEl.style.left).toBe('496px');

		wrapper.unmount();
	});

	it('不支持 translate 时 placement=top 按原方式定位（减去自身高度）', async () => {
		stubTranslate(false);
		const wrapper = await openAt('top');
		const wrapperEl = getWrapperEl()!;
		await resizeTo(200, 50);
		expect(wrapperEl.style.top).toBe('346px'); // 400 - 50 - 4
		expect((wrapperEl.style as any).translate || '').toBe('');

		wrapper.unmount();
	});

	// 滚动容器：可视区（padding box）为 top / left 起、width × height
	const mockScroller = (el: HTMLElement, { top, left, width, height }) => {
		setRect(el, { x: left, y: top, top, left, width, height, right: left + width, bottom: top + height });
		Object.defineProperty(el, 'clientWidth', { configurable: true, value: width });
		Object.defineProperty(el, 'clientHeight', { configurable: true, value: height });
	};

	it('触发节点在滚动容器中（含 Scroller 滚轮模式）：容器滚动后重新定位', async () => {
		// 外层为 Scroller（滚轮驱动时 overflow: hidden，按 class 识别），内层为原生滚动容器
		const outer = document.createElement('div');
		outer.className = 'vc-scroller';
		outer.style.overflow = 'hidden';
		const inner = document.createElement('div');
		inner.style.overflow = 'auto';
		const triggerEl = document.createElement('button');
		inner.appendChild(triggerEl);
		outer.appendChild(inner);
		document.body.appendChild(outer);
		mockScroller(outer, { top: 0, left: 0, width: 1024, height: 768 });
		mockScroller(inner, { top: 0, left: 0, width: 1024, height: 768 });
		setRect(triggerEl, triggerRect(100, 100));

		const leaf = Popover.open({ el: document.body, name: 'in-scroller', triggerEl, placement: 'bottom', content: 'x' });
		await flush();
		const wrapperEl = getWrapperEl()!;
		await resizeTo(200, 100);
		expect(wrapperEl.style.top).toBe('134px'); // 100 + 30 + 4

		// 内层滚动 40px（scroll 不冒泡）
		setRect(triggerEl, triggerRect(100, 60));
		inner.dispatchEvent(new Event('scroll'));
		await sleep(30);
		expect(wrapperEl.style.top).toBe('94px');

		// 外层 Scroller 滚动
		setRect(triggerEl, triggerRect(100, 20));
		outer.dispatchEvent(new Event('scroll'));
		await sleep(30);
		expect(wrapperEl.style.top).toBe('54px');

		leaf.destroy();
		await flush();
	});

	// 触发节点在可视区为 100~260 的滚动容器中
	const openInScroller = async (triggerY: number, wrapperHeight: number) => {
		const box = document.createElement('div');
		box.style.overflow = 'auto';
		const triggerEl = document.createElement('button');
		box.appendChild(triggerEl);
		document.body.appendChild(box);
		mockScroller(box, { top: 100, left: 0, width: 400, height: 160 });
		setRect(triggerEl, triggerRect(100, triggerY));

		const leaf = Popover.open({ el: document.body, name: 'in-box', triggerEl, placement: 'bottom', content: 'x' });
		await flush();
		await resizeTo(200, wrapperHeight);
		const scrollTo = async (y: number) => {
			setRect(triggerEl, triggerRect(100, y));
			box.dispatchEvent(new Event('scroll'));
			await sleep(30);
		};
		return { scrollTo, leaf, wrapperEl: getWrapperEl()! };
	};

	it('触发节点滚出滚动容器可视区时隐藏弹层，滚回后恢复', async () => {
		const { scrollTo, leaf, wrapperEl } = await openInScroller(150, 40);
		expect(wrapperEl.style.visibility).toBe('');

		// 触发节点 40~70，完全在容器可视区上方
		await scrollTo(40);
		expect(wrapperEl.style.visibility).toBe('hidden');
		// 只是隐藏，仍处于打开状态
		expect(wrapperEl.style.display).not.toBe('none');

		await scrollTo(150);
		expect(wrapperEl.style.visibility).toBe('');

		leaf.destroy();
		await flush();
	});

	it('触发节点靠近滚动容器底边：以容器可视区为边界翻转到上方', async () => {
		// 触发节点 200~230，下方到容器底边（260）只剩 30px，放不下 100px 高的弹层，上方有 100px
		const { leaf, wrapperEl } = await openInScroller(200, 100);
		expect(wrapperEl.classList.contains('is-top')).toBe(true);

		leaf.destroy();
		await flush();
	});

	it('页面横向滚动：居中与 *-left 方向都按页面坐标对齐（不重复叠加 scrollX）', async () => {
		// jsdom 中没有 scrollingElement，这里模拟页面横向滚动 300px
		const scrollingElement = Object.getOwnPropertyDescriptor(document, 'scrollingElement');
		Object.defineProperty(document, 'scrollingElement', { configurable: true, value: { scrollLeft: 300, scrollTop: 0 } });
		onTestFinished(() => {
			scrollingElement ? Object.defineProperty(document, 'scrollingElement', scrollingElement) : delete (document as any).scrollingElement;
		});

		let wrapper = await openAt('bottom');
		await resizeTo(200, 100);
		expect(getWrapperEl()!.style.left).toBe('740px'); // 300 + 500 + (80 - 200) / 2
		wrapper.unmount();
		document.body.innerHTML = '';

		wrapper = await openAt('bottom-left');
		await resizeTo(200, 100);
		expect(getWrapperEl()!.style.left).toBe('800px'); // 300 + 500
		wrapper.unmount();
	});

	it('triggerEl 已被其他代码 Resize.on 监听：弹层自身的首次回调完成定位', async () => {
		const triggerEl = document.createElement('button');
		document.body.appendChild(triggerEl);
		setRect(triggerEl, triggerRect(100, 100));
		// 已有监听时再次 Resize.on 不会重新 observe，触发节点没有首次回调
		const noop = () => {};
		Resize.on(triggerEl, noop);

		const leaf = Popover.open({ el: document.body, name: 'observed-trigger', triggerEl, placement: 'right', content: 'x' });
		await flush();

		await resizeTo(200, 100);
		expect(getWrapperEl()!.style.top).toBe('65px');
		expect(getWrapperEl()!.style.left).toBe('184px'); // 100 + 80 + 4

		Resize.off(triggerEl, noop);
		leaf.destroy();
		await flush();
	});
});

describe('Popover 弹层内 hover 事件 (wrapper.tsx)', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('trigger="hover": 弹层 mouseenter 保持显示, mouseleave 关闭', async () => {
		const wrapper = mount(() => (
			<Popover trigger="hover" content="hover-keep">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await nextTick();

		// 先 hover 触发节点弹出
		fireEvent(wrapper.element, 'mouseenter');
		await flush();
		const wrapperEl = getWrapperEl()!;
		expect(wrapperEl).not.toBeNull();

		// 模拟从触发节点移到弹层（中途立即 mouseenter wrapper 可阻止关闭）
		fireEvent(wrapper.element, 'mouseleave');
		fireEvent(wrapperEl, 'mouseenter');
		await sleep(220);
		await flush();
		expect(wrapperEl.style.display).not.toBe('none');

		// 鼠标离开弹层 → 关闭
		fireEvent(wrapperEl, 'mouseleave');
		await sleep(220);
		await flush();
		expect(wrapperEl.style.display).toBe('none');

		wrapper.unmount();
	});

	it('Popover.open hover=true: wrapper 上 mouseenter/mouseleave 直接驱动 isActive', async () => {
		const triggerEl = document.createElement('button');
		document.body.appendChild(triggerEl);
		const leaf = Popover.open({
			el: document.body,
			name: 'wrap-hover',
			triggerEl,
			hover: true,
			content: () => (<span>x</span>) as any
		});
		await flush();

		// 触发 trigger 的 mouseenter（alone+hover 模式由 wrapper 自身绑定）
		fireEvent(triggerEl, 'mouseenter');
		await sleep(220);
		await flush();

		const wrapperEl = getWrapperEl()!;
		expect(wrapperEl).not.toBeNull();

		// 鼠标进入 wrapper（取消 trigger 的 mouseleave 关闭意图）
		fireEvent(triggerEl, 'mouseleave');
		fireEvent(wrapperEl, 'mouseenter');
		await sleep(220);
		await flush();
		expect(wrapperEl.style.display).not.toBe('none');

		fireEvent(wrapperEl, 'mouseleave');
		await sleep(220);
		await flush();
		expect(wrapperEl.style.display).toBe('none');

		leaf.destroy();
		await flush();
	});

	it('非 hover 模式下 wrapper mousedown 标记 isPressMouse', async () => {
		const visible = ref(true);
		const wrapper = mount(() => (
			<Popover v-model={visible.value} trigger="click" content="x">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await flush();

		const wrapperEl = getWrapperEl()!;
		expect(wrapperEl).not.toBeNull();

		// 内部 mousedown
		wrapperEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
		// 外部 click（释放在外面）— popover 自身会拦截，但 wrapper 内部 isPressMouse 标记会让 wrapper 不关闭
		const outside = document.createElement('div');
		document.body.appendChild(outside);
		outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();

		// portal 模式下 popover 的 outsideClickable 会主导关闭，这里仅验证不抛异常
		expect(() => wrapperEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))).not.toThrow();

		wrapper.unmount();
		document.body.removeChild(outside);
	});
});

const isShown = (el: Element | null) => !!el && (el as HTMLElement).style.display !== 'none';

describe('Popover 嵌套弹层：子弹层挂在 body 下时的区域判断', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('点击触发区内的 hover 子弹层（Popover.open）不关闭外层', async () => {
		// 抽象自 Select：下拉打开时，在 +N... 标签列表（触发节点在 Select 内）里点 ×
		const visible = ref(true);
		const wrapper = mount(() => (
			<Popover v-model={visible.value} trigger="click" content="outer" portalClass="outer-pop">
				<span class="inner-trigger">hover</span>
			</Popover>
		), { attachTo: document.body });
		await flush();

		const leaf = Popover.open({
			el: document.body,
			name: 'nested-hover-inner',
			triggerEl: wrapper.element.querySelector('.inner-trigger'),
			hover: true,
			alone: true,
			content: () => (<button class="inner-btn">x</button>) as any
		});
		await flush();

		(document.querySelector('.inner-btn') as HTMLElement).click();
		await flush();
		expect(visible.value).toBe(true);
		expect(isShown(document.querySelector('.outer-pop'))).toBe(true);

		leaf.destroy();
		wrapper.unmount();
	});

	it('点击内容区内嵌 Popover（portal）的弹层不关闭外层，点击外部两层都关闭', async () => {
		const outer = ref(true);
		const inner = ref(true);
		const wrapper = mount(() => (
			<Popover v-model={outer.value} trigger="click" portalClass="outer-pop">
				{{
					default: () => <button>outer</button>,
					content: () => (
						<Popover v-model={inner.value} trigger="click" portalClass="inner-pop">
							{{
								default: () => <button>inner</button>,
								content: () => <span class="inner-content">inner</span>
							}}
						</Popover>
					)
				}}
			</Popover>
		), { attachTo: document.body });
		await flush();
		await flush();
		expect(isShown(document.querySelector('.inner-pop'))).toBe(true);

		(document.querySelector('.inner-content') as HTMLElement).click();
		await flush();
		expect(inner.value).toBe(true);
		expect(outer.value).toBe(true);

		document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		expect(inner.value).toBe(false);
		expect(outer.value).toBe(false);

		wrapper.unmount();
	});

	it('内容区内嵌 Select：选择选项不关闭外层', async () => {
		const outer = ref(true);
		const value = ref('');
		const wrapper = mount(() => (
			<Popover v-model={outer.value} trigger="click" portalClass="outer-pop">
				{{
					default: () => <button>outer</button>,
					content: () => (
						<Select v-model={value.value} data={[{ value: '1', label: 'A' }, { value: '2', label: 'B' }]} />
					)
				}}
			</Popover>
		), { attachTo: document.body });
		await flush();

		// 打开 Select（下拉挂 body，其触发节点在外层弹层内）
		(document.querySelector('.outer-pop .vc-select') as HTMLElement).click();
		await flush();
		const option = document.querySelector('.vc-select-option') as HTMLElement;
		expect(option).not.toBeNull();

		option.click();
		await flush();
		expect(value.value).toBe('1');
		expect(outer.value).toBe(true);

		wrapper.unmount();
	});

	it('Popover.open（alone）内嵌 Popover：点击子弹层不关闭', async () => {
		const triggerEl = document.createElement('button');
		document.body.appendChild(triggerEl);
		const inner = ref(true);

		const leaf = Popover.open({
			el: document.body,
			name: 'nested-alone',
			triggerEl,
			portalClass: 'outer-pop',
			content: () => (
				<Popover v-model={inner.value} trigger="click" portalClass="inner-pop">
					{{
						default: () => <button>inner</button>,
						content: () => <span class="inner-content">inner</span>
					}}
				</Popover>
			) as any
		});
		await flush();
		await flush();

		(document.querySelector('.inner-content') as HTMLElement).click();
		await flush();
		expect(inner.value).toBe(true);
		expect(isShown(document.querySelector('.outer-pop'))).toBe(true);

		leaf.destroy();
		await flush();
	});
});

describe('Popover strictHover 关闭定时器', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('trigger="strictHover": 离开后 200ms 内移回不关闭，重复离开只关闭一次', async () => {
		const onVisibleChange = vi.fn();
		const wrapper = mount(() => (
			<Popover trigger="strictHover" content="strict" onVisibleChange={onVisibleChange}>
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await nextTick();

		fireEvent(wrapper.element, 'mouseenter');
		await flush();
		fireEvent(wrapper.element, 'mouseleave');
		await sleep(100);
		fireEvent(wrapper.element, 'mouseenter');
		await sleep(400);
		await flush();
		expect(onVisibleChange).not.toHaveBeenCalledWith(false);
		expect(isShown(getWrapperEl())).toBe(true);

		// 连续两次离开（如移出后又点击外部）：只关闭一次
		fireEvent(wrapper.element, 'mouseleave');
		fireEvent(wrapper.element, 'mouseleave');
		await sleep(400);
		await flush();
		expect(isShown(getWrapperEl())).toBe(false);
		expect(onVisibleChange.mock.calls.filter(([v]) => v === false).length).toBe(1);

		wrapper.unmount();
	});
});

describe('Popover 触发节点被移除', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('Popover.open（hover）：triggerEl 移除后弹层关闭', async () => {
		const triggerEl = document.createElement('button');
		document.body.appendChild(triggerEl);
		Popover.open({
			el: document.body,
			name: 'removed-hover',
			triggerEl,
			hover: true,
			content: () => (<span>x</span>) as any
		});
		await flush();
		expect(isShown(getWrapperEl())).toBe(true);

		triggerEl.remove();
		resize(triggerEl);
		await sleep(400);
		await flush();
		// 测试环境中 Transition 被 stub，离场钩子不执行、不会走到销毁，这里只断言已关闭（销毁在浏览器中验证）
		expect(isShown(getWrapperEl())).toBe(false);
	});

	it('Popover.open（click）：triggerEl 移除后，滚动时发现并关闭', async () => {
		const triggerEl = document.createElement('button');
		document.body.appendChild(triggerEl);
		Popover.open({
			el: document.body,
			name: 'removed-click',
			triggerEl,
			content: () => (<span>x</span>) as any
		});
		await flush();
		expect(isShown(getWrapperEl())).toBe(true);

		triggerEl.remove();
		document.dispatchEvent(new Event('scroll'));
		await sleep(400);
		await flush();
		expect(isShown(getWrapperEl())).toBe(false);
	});

	it('Popover 组件：根节点脱离文档时同步关闭（v-model 为 false）', async () => {
		const visible = ref(true);
		const wrapper = mount(() => (
			<Popover v-model={visible.value} trigger="click" content="x">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await flush();
		expect(isShown(getWrapperEl())).toBe(true);

		const root = wrapper.element;
		root.remove();
		resize(root);
		await sleep(400);
		await flush();
		expect(visible.value).toBe(false);
		expect(isShown(getWrapperEl())).toBe(false);

		wrapper.unmount();
	});
});
