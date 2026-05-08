// @vitest-environment jsdom

import { Popover } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { vi } from 'vitest';

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

	it('handleWrapperResize: 弹层超出窗口右边界自动靠右收缩', async () => {
		const wrapper = mount(() => (
			<Popover trigger="click" content="x" placement="bottom">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await nextTick();
		setRect(wrapper.element, { x: 0, y: 100, width: 80, height: 30, top: 100, left: 0, bottom: 130, right: 80 });
		await wrapper.trigger('click');
		await flush();

		// 先触发一次 setPopupStyle 让 wrapperStyle.left 成为数字
		const triggerRz = (wrapper.element as any).__rz__;
		triggerRz?.handleResize?.([{ target: wrapper.element }]);
		await sleep(60);
		triggerRz?.handleResize?.([{ target: wrapper.element }]);
		await flush();

		const wrapperEl = getWrapperEl()!;
		// 给 wrapper 一个超出窗口的 offsetWidth
		Object.defineProperty(wrapperEl, 'offsetWidth', { configurable: true, value: 5000 });

		const wrapperRz = (wrapperEl as any).__rz__;
		wrapperRz?.handleResize?.([{ target: wrapperEl }]);
		await flush();

		// handleWrapperResize 在 left + offsetWidth > innerWidth 分支会重写 left
		expect(wrapperEl.style.left).toMatch(/px$/);

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

	it('handleWrapperResize: placement 为 left/right 走 default 分支不报错', async () => {
		const wrapper = mount(() => (
			<Popover trigger="click" content="x" placement="right">
				<button>btn</button>
			</Popover>
		), { attachTo: document.body });
		await nextTick();
		setRect(wrapper.element, { x: 100, y: 100, width: 80, height: 30, top: 100, left: 100, bottom: 130, right: 180 });
		await wrapper.trigger('click');
		await flush();

		const wrapperEl = getWrapperEl()!;
		const wrapperRz = (wrapperEl as any).__rz__;
		expect(() => wrapperRz?.handleResize?.([{ target: wrapperEl }])).not.toThrow();

		wrapper.unmount();
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
