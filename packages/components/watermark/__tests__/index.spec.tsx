// @vitest-environment jsdom

import { vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { Watermark, MWatermark } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';
import { installImageMock } from '../../image-processor/__tests__/fixtures/image';

// 组件更新、MutationObserver 回调与图片加载（setTimeout 0，失败后还会重试一次）都落地
const flush = async () => {
	for (let i = 0; i < 4; i++) {
		await nextTick();
		await Utils.sleep(0);
	}
};

const getLayers = (root: ParentNode = document) => Array.from(root.querySelectorAll<HTMLElement>('.vc-watermark__layer'));
const getLayer = (root?: ParentNode) => getLayers(root)[0];
const getSize = (el: HTMLElement) => el.style.backgroundSize.split(' ').map(parseFloat);

const createBox = (style = '') => {
	const el = document.createElement('div');
	el.setAttribute('style', style);
	document.body.appendChild(el);
	return el;
};

const addStyle = (css: string) => {
	const el = document.createElement('style');
	el.textContent = css;
	document.head.appendChild(el);
	return el;
};

// 加载完成的图片：一块 120×48 的画布
const createImage = () => Object.assign(document.createElement('canvas'), { width: 120, height: 48 });

// 测试环境不加载组件样式：补上外层的定位，与实际一致
beforeEach(() => {
	addStyle('.vc-watermark { position: relative; }');
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	document.body.innerHTML = '';
	document.head.querySelectorAll('style').forEach(el => el.remove());
});

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Watermark).toBe('object');
		expect(MWatermark).toBe(Watermark);
	});

	it('wraps the default slot and draws the text as a repeated background', async () => {
		const wrapper = mount(() => (<Watermark value="text"><p class="content">content</p></Watermark>), { attachTo: document.body });
		await flush();

		const layer = getLayer();
		expect(wrapper.classes()).toEqual(['vc-watermark']);
		expect(wrapper.find('.content').exists()).toBe(true);
		expect(layer.parentElement).toBe(wrapper.element);
		expect(layer.style.backgroundImage).toMatch(/^url\("?data:image\/png;base64,/);
		expect(layer.style.backgroundPosition).toBe('0px 0px');
		// 未传 zIndex 时层级由样式决定
		expect(layer.style.zIndex).toBe('');
		// 外层已由样式定位，不写内联 position
		expect((wrapper.element as HTMLElement).style.position).toBe('');
		wrapper.unmount();
	});

	it('draws nothing without value or src', async () => {
		const wrapper = mount(() => (<Watermark><p>content</p></Watermark>), { attachTo: document.body });
		await flush();

		expect(getLayer().style.backgroundImage).toBe('');
		wrapper.unmount();
	});

	it('binds class, style and other attributes to the layer instead of the wrapper', async () => {
		const wrapper = mount(
			() => (<Watermark value="text" class="custom" style={{ opacity: 0.5 }} data-id="mark"><p>content</p></Watermark>),
			{ attachTo: document.body }
		);
		await flush();

		const layer = getLayer();
		expect(wrapper.attributes('class')).toBe('vc-watermark');
		expect(wrapper.attributes('style')).toBeUndefined();
		expect(wrapper.attributes('data-id')).toBeUndefined();
		expect(layer.className).toBe('vc-watermark__layer custom');
		expect(layer.style.opacity).toBe('0.5');
		expect(layer.dataset.id).toBe('mark');
		wrapper.unmount();
	});

	it('uses width and height as the size before rotation', async () => {
		const rotate = ref(0);
		const wrapper = mount(
			() => (<Watermark value="text" width={80} height={20} rotate={rotate.value}><p>content</p></Watermark>),
			{ attachTo: document.body }
		);
		await flush();
		expect(getLayer().style.backgroundSize).toBe('180px 120px');

		// 旋转 90° 后包围盒宽高互换
		rotate.value = 90;
		await flush();
		expect(getLayer().style.backgroundSize).toBe('120px 180px');

		rotate.value = 30;
		await flush();
		const [width, height] = getSize(getLayer());
		expect(width).toBe(Math.ceil(80 * Math.cos(Math.PI / 6) + 20 * Math.sin(Math.PI / 6)) + 100);
		expect(height).toBe(Math.ceil(80 * Math.sin(Math.PI / 6) + 20 * Math.cos(Math.PI / 6)) + 100);
		wrapper.unmount();
	});

	it('sizes the tile from the text when width and height are omitted', async () => {
		const value = ref<string | string[]>('text');
		const wrapper = mount(() => (<Watermark value={value.value} rotate={0}><p>content</p></Watermark>), { attachTo: document.body });
		await flush();
		const single = getSize(getLayer());

		value.value = 'a much longer text';
		await flush();
		const longer = getSize(getLayer());
		expect(longer[0]).toBeGreaterThan(single[0]);
		expect(longer[1]).toBe(single[1]);

		// 多行：每行一个行高（测试环境不加载组件样式，字号为浏览器默认的 16 × 1.2），空行忽略
		value.value = ['text', 'text', ''];
		await flush();
		const lines = getSize(getLayer());
		expect(lines[0]).toBe(single[0]);
		expect(single[1]).toBe(Math.ceil(16 * 1.2) + 100);
		expect(lines[1]).toBe(Math.ceil(16 * 1.2 * 2) + 100);
		wrapper.unmount();
	});

	it('applies gap to the tile and offset to the background position', async () => {
		const gap = ref<number | number[]>(100);
		const offset = ref<number | number[] | undefined>();
		const wrapper = mount(
			() => (<Watermark value="text" width={80} height={20} rotate={0} gap={gap.value} offset={offset.value}><p>content</p></Watermark>),
			{ attachTo: document.body }
		);
		await flush();
		const image = getLayer().style.backgroundImage;
		expect(getLayer().style.backgroundSize).toBe('180px 120px');

		// offset 只平移，不重绘
		offset.value = 0;
		await flush();
		expect(getLayer().style.backgroundPosition).toBe('-50px -50px');
		expect(getLayer().style.backgroundImage).toBe(image);

		offset.value = [20, 80];
		await flush();
		expect(getLayer().style.backgroundPosition).toBe('-30px 30px');

		offset.value = [70];
		await flush();
		expect(getLayer().style.backgroundPosition).toBe('20px 20px');

		offset.value = undefined;
		gap.value = [160, 40];
		await flush();
		expect(getLayer().style.backgroundSize).toBe('240px 60px');
		expect(getLayer().style.backgroundPosition).toBe('0px 0px');

		gap.value = [40];
		await flush();
		expect(getLayer().style.backgroundSize).toBe('120px 60px');
		wrapper.unmount();
	});

	it('scales the bitmap by devicePixelRatio', async () => {
		vi.stubGlobal('devicePixelRatio', 2);
		const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');
		const wrapper = mount(
			() => (<Watermark value="text" width={80} height={20} rotate={0}><p>content</p></Watermark>),
			{ attachTo: document.body }
		);
		await flush();

		const canvas = toDataURL.mock.contexts[0] as HTMLCanvasElement;
		expect([canvas.width, canvas.height]).toEqual([360, 240]);
		expect(getLayer().style.backgroundSize).toBe('180px 120px');
		wrapper.unmount();
	});

	it('reads the font from the layer and lets style override zIndex', async () => {
		const context = document.createElement('canvas').getContext('2d')!;
		const fillText = vi.spyOn(Object.getPrototypeOf(context), 'fillText');
		const wrapper = mount(
			() => (
				<Watermark value="text" zIndex={9} style={{ color: 'rgb(255, 0, 0)', fontSize: '20px', fontWeight: 'bold', zIndex: 20 }}>
					<p>content</p>
				</Watermark>
			),
			{ attachTo: document.body }
		);
		await flush();

		const drawn = fillText.mock.contexts[0] as CanvasRenderingContext2D;
		expect(drawn.fillStyle).toBe('#ff0000');
		expect(drawn.font).toContain('700');
		expect(drawn.font).toContain('20px');
		expect(getLayer().style.zIndex).toBe('20');
		wrapper.unmount();
	});

	it('keeps the layer untouched when re-rendered with equal values', async () => {
		const outer = ref(0);
		const inner = ref(0);
		const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');
		const wrapper = mount(
			() => (
				<div data-tick={outer.value}>
					<Watermark value={['text']} gap={[100, 100]} offset={[50, 50]} class={{ custom: true }} style={{ opacity: 0.5 }}>
						<p>{inner.value}</p>
					</Watermark>
				</div>
			),
			{ attachTo: document.body }
		);
		await flush();
		const layer = getLayer();
		const count = toDataURL.mock.calls.length;

		// 只有插槽内容更新
		inner.value++;
		await flush();
		// 外部重新渲染：数组、对象字面量都是新引用，值不变
		outer.value++;
		await flush();

		expect(wrapper.find('p').text()).toBe('1');
		expect(wrapper.attributes('data-tick')).toBe('1');
		expect(getLayer()).toBe(layer);
		expect(toDataURL.mock.calls.length).toBe(count);
		wrapper.unmount();
	});

	it('redraws when class or style changes the font', async () => {
		addStyle('.is-large { font-size: 32px; }');
		const isLarge = ref(false);
		const fontSize = ref<string>();
		const wrapper = mount(
			() => (
				<Watermark value="text" rotate={0} class={{ 'is-large': isLarge.value }} style={{ fontSize: fontSize.value }}>
					<p>content</p>
				</Watermark>
			),
			{ attachTo: document.body }
		);
		await flush();
		const base = getSize(getLayer());

		isLarge.value = true;
		await flush();
		const large = getSize(getLayer());
		expect(large[0]).toBeGreaterThan(base[0]);
		expect(large[1]).toBe(Math.ceil(32 * 1.2) + 100);

		isLarge.value = false;
		fontSize.value = '32px';
		await flush();
		expect(getSize(getLayer())).toEqual(large);
		wrapper.unmount();
	});

	it('redraws after a transition on the layer when the computed font changed', async () => {
		const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');
		const wrapper = mount(() => (<Watermark value="text" rotate={0}><p>content</p></Watermark>), { attachTo: document.body });
		await flush();
		const base = getSize(getLayer());
		const count = toDataURL.mock.calls.length;

		// 字体未变化：不重绘
		getLayer().dispatchEvent(new Event('transitionend'));
		await flush();
		expect(toDataURL.mock.calls.length).toBe(count);

		// 外部样式（如主题）改变了水印层的字体
		addStyle('.vc-watermark__layer { font-size: 32px; line-height: 40px; }');
		getLayer().dispatchEvent(new Event('transitionend'));
		await flush();
		const next = getSize(getLayer());
		expect(next[0]).toBeGreaterThan(base[0]);
		expect(next[1]).toBe(40 + 100);
		wrapper.unmount();
	});

	it('draws the image from src with priority over value', async () => {
		const { requests } = installImageMock(createImage);
		const src = ref('https://example.com/a.png');
		const size = ref<{ width?: number; height?: number }>({});
		const wrapper = mount(
			() => (<Watermark value="text" src={src.value} rotate={0} {...size.value}><p>content</p></Watermark>),
			{ attachTo: document.body }
		);
		await flush();

		// 默认宽 100，高按 120×48 的比例
		expect(getLayer().style.backgroundSize).toBe('200px 140px');
		// 按原地址加载，可命中浏览器缓存
		expect(requests).toEqual([{ crossOrigin: 'anonymous', src: 'https://example.com/a.png' }]);

		size.value = { height: 24 };
		await flush();
		expect(getLayer().style.backgroundSize).toBe('160px 124px');

		size.value = { width: 60 };
		await flush();
		expect(getLayer().style.backgroundSize).toBe('160px 124px');

		size.value = { width: 60, height: 60 };
		await flush();
		expect(getLayer().style.backgroundSize).toBe('160px 160px');
		// 重绘复用已加载的图片
		expect(requests).toHaveLength(1);

		src.value = 'data:image/png;base64,AAAA';
		await flush();
		expect(requests).toHaveLength(2);
		expect(requests[1]).toEqual({ crossOrigin: '', src: 'data:image/png;base64,AAAA' });
		wrapper.unmount();
	});

	it('retries with a cache stamp when the image fails to load from its own address', async () => {
		const { requests } = installImageMock(createImage, src => !src.includes('_='));
		const wrapper = mount(
			() => (<Watermark value="text" src="https://example.com/a.png" rotate={0}><p>content</p></Watermark>),
			{ attachTo: document.body }
		);
		await flush();

		expect(requests).toHaveLength(2);
		expect(requests[1].src).toMatch(/^https:\/\/example\.com\/a\.png\?_=\d+$/);
		expect(getLayer().style.backgroundSize).toBe('200px 140px');
		wrapper.unmount();
	});

	it('falls back to value when the image fails to load', async () => {
		const { requests } = installImageMock(createImage, true);
		const rotate = ref(0);
		const value = ref<string | undefined>('text');
		const wrapper = mount(
			() => (
				<Watermark value={value.value} src="https://example.com/a.png" width={80} height={20} rotate={rotate.value}>
					<p>content</p>
				</Watermark>
			),
			{ attachTo: document.body }
		);
		await flush();
		expect(getLayer().style.backgroundSize).toBe('180px 120px');

		// 原地址与带时间戳各请求一次，之后重绘不再请求
		expect(requests).toHaveLength(2);
		rotate.value = 90;
		await flush();
		expect(getLayer().style.backgroundSize).toBe('120px 180px');
		expect(requests).toHaveLength(2);

		value.value = undefined;
		await flush();
		expect(getLayer().style.backgroundImage).toBe('');
		wrapper.unmount();
	});

	it('discards an image that finishes loading after src changed', async () => {
		installImageMock(createImage);
		const src = ref<string | undefined>('https://example.com/a.png');
		const wrapper = mount(
			() => (<Watermark value="text" src={src.value} width={80} height={20} rotate={0}><p>content</p></Watermark>),
			{ attachTo: document.body }
		);
		await nextTick();
		// 图片还在加载时改为文字
		src.value = undefined;
		await flush();

		expect(getLayer().style.backgroundSize).toBe('180px 120px');
		wrapper.unmount();
	});

	it('does not draw after being unmounted while the image is loading', async () => {
		installImageMock(createImage);
		const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');
		const wrapper = mount(() => (<Watermark src="https://example.com/a.png"><p>content</p></Watermark>), { attachTo: document.body });
		await nextTick();
		wrapper.unmount();
		await flush();

		expect(toDataURL).not.toHaveBeenCalled();
	});

	it('renders nothing drawable when the canvas context is unavailable', async () => {
		installImageMock(createImage);
		vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
		const src = ref<string | undefined>();
		const wrapper = mount(() => (<Watermark value="text" src={src.value}><p>content</p></Watermark>), { attachTo: document.body });
		await flush();
		expect(getLayer().style.backgroundImage).toBe('');

		src.value = 'https://example.com/a.png';
		await flush();
		expect(getLayer().style.backgroundImage).toBe('');
		wrapper.unmount();
	});

	it('teleports the layer to the target and restores the container afterwards', async () => {
		const a = createBox();
		const b = createBox('position: absolute;');
		a.id = 'watermark-a';
		const to = ref<string | HTMLElement | undefined>('#watermark-a');
		const wrapper = mount(() => (<Watermark value="text" to={to.value} />), { attachTo: document.body });
		await flush();

		expect(getLayers(a)).toHaveLength(1);
		expect(getLayer(a).style.backgroundImage).not.toBe('');
		// 未定位的容器被写入 relative
		expect(a.style.position).toBe('relative');

		// 换到已定位的容器：不改写它，原容器还原
		to.value = b;
		await flush();
		expect(getLayers(a)).toHaveLength(0);
		expect(a.style.position).toBe('');
		expect(getLayers(b)).toHaveLength(1);
		expect(getLayer(b).style.backgroundImage).not.toBe('');
		expect(b.style.position).toBe('absolute');

		// 目标不存在：不渲染
		to.value = '#watermark-none';
		await flush();
		expect(getLayers()).toHaveLength(0);

		to.value = '#watermark-a';
		await flush();
		expect(getLayers(a)).toHaveLength(1);
		expect(a.style.position).toBe('relative');

		wrapper.unmount();
		expect(getLayers()).toHaveLength(0);
		expect(a.style.position).toBe('');
	});

	it('redraws for changes made while the target was missing', async () => {
		const a = createBox();
		a.id = 'watermark-a';
		const to = ref('#watermark-a');
		const size = ref(80);
		const wrapper = mount(
			() => (<Watermark value="text" to={to.value} width={size.value} height={20} rotate={0} />),
			{ attachTo: document.body }
		);
		await flush();
		expect(getLayer(a).style.backgroundSize).toBe('180px 120px');

		to.value = '#watermark-none';
		await flush();
		size.value = 60;
		await flush();

		to.value = '#watermark-a';
		await flush();
		expect(getLayer(a).style.backgroundSize).toBe('160px 120px');
		wrapper.unmount();
	});

	it('stays in place and covers the parent without a slot or target', async () => {
		const box = createBox();
		const wrapper = mount(() => (<Watermark value="text" />), { attachTo: box });
		await flush();

		const layer = getLayer(box);
		const parent = layer.parentElement!;
		expect(wrapper.element).toBe(layer);
		expect(layer.style.backgroundImage).not.toBe('');
		expect(parent.style.position).toBe('relative');

		wrapper.unmount();
		expect(parent.style.position).toBe('');
	});

	it('ignores the target when the default slot is used', async () => {
		const a = createBox();
		const wrapper = mount(() => (<Watermark value="text" to={a}><p>content</p></Watermark>), { attachTo: document.body });
		await flush();

		expect(getLayers(a)).toHaveLength(0);
		expect(getLayer().parentElement).toBe(wrapper.element);
		wrapper.unmount();
	});

	it('rebuilds the layer after it is removed or modified', async () => {
		const wrapper = mount(() => (<Watermark value="text" class="custom"><p class="content">content</p></Watermark>), { attachTo: document.body });
		await flush();
		const image = getLayer().style.backgroundImage;

		const expectRebuilt = async (modify: (el: HTMLElement) => void) => {
			const layer = getLayer();
			modify(layer);
			await flush();
			expect(getLayers()).toHaveLength(1);
			expect(getLayer()).not.toBe(layer);
			expect(getLayer().parentElement).toBe(wrapper.element);
			expect(getLayer().className).toBe('vc-watermark__layer custom');
			expect(getLayer().style.display).toBe('');
			expect(getLayer().style.backgroundImage).toBe(image);
		};

		await expectRebuilt(el => el.remove());
		await expectRebuilt(el => (el.style.display = 'none'));
		await expectRebuilt(el => el.classList.add('is-hidden'));
		await expectRebuilt(el => el.removeAttribute('class'));

		// 容器内其它节点的变化不影响水印层
		const layer = getLayer();
		wrapper.find('.content').element.remove();
		wrapper.element.appendChild(document.createElement('span'));
		await flush();
		expect(getLayer()).toBe(layer);
		wrapper.unmount();
	});

	it('rebuilds the teleported layer even if the target is emptied', async () => {
		const a = createBox();
		const wrapper = mount(() => (<Watermark value="text" to={a} />), { attachTo: document.body });
		await flush();
		const layer = getLayer(a);

		a.innerHTML = '';
		await flush();
		expect(getLayers(a)).toHaveLength(1);
		expect(getLayer(a)).not.toBe(layer);
		expect(getLayer(a).style.backgroundImage).not.toBe('');
		wrapper.unmount();
		expect(getLayers()).toHaveLength(0);
	});

	it('rebuilds the in-place layer after it is removed', async () => {
		const box = createBox();
		const wrapper = mount(() => (<Watermark value="text" />), { attachTo: box });
		await flush();
		const layer = getLayer(box);

		layer.remove();
		await flush();
		expect(getLayers(box)).toHaveLength(1);
		expect(getLayer(box)).not.toBe(layer);
		expect(getLayer(box).style.backgroundImage).not.toBe('');
		wrapper.unmount();
		expect(getLayers()).toHaveLength(0);
	});

	it('writes zIndex inline only when it is passed', async () => {
		const zIndex = ref<number | undefined>();
		const wrapper = mount(() => (<Watermark value="text" zIndex={zIndex.value}><p>content</p></Watermark>), { attachTo: document.body });
		await flush();
		expect(getLayer().style.zIndex).toBe('');

		zIndex.value = 9;
		await flush();
		expect(getLayer().style.zIndex).toBe('9');
		wrapper.unmount();
	});

	it('fullscreen: fixes the layer to the viewport under body by default', async () => {
		const box = createBox();
		const wrapper = mount(() => (<Watermark fullscreen value="text" />), { attachTo: box });
		await flush();

		const layer = getLayer();
		expect(layer.parentElement).toBe(document.body);
		expect(layer.className).toBe('vc-watermark__layer is-fullscreen');
		expect(layer.style.backgroundImage).not.toBe('');
		expect(layer.style.zIndex).toBe('');
		// 相对视口定位，不改写容器
		expect(document.body.style.position).toBe('');

		// 被移除后在 body 下重建
		layer.remove();
		await flush();
		expect(getLayers()).toHaveLength(1);
		expect(getLayer()).not.toBe(layer);
		expect(getLayer().parentElement).toBe(document.body);

		wrapper.unmount();
		expect(getLayers()).toHaveLength(0);
	});

	it('fullscreen: explicit to and zIndex take priority', async () => {
		const a = createBox();
		const wrapper = mount(() => (<Watermark fullscreen to={a} zIndex={1} value="text" />), { attachTo: document.body });
		await flush();

		expect(getLayers(a)).toHaveLength(1);
		expect(getLayer(a).className).toContain('is-fullscreen');
		expect(getLayer(a).style.zIndex).toBe('1');
		expect(a.style.position).toBe('');
		wrapper.unmount();
	});

	it('fullscreen: switching moves the layer and restores the previous container', async () => {
		const box = createBox();
		const fullscreen = ref(false);
		const wrapper = mount(() => (<Watermark fullscreen={fullscreen.value} value="text" />), { attachTo: box });
		await flush();
		const parent = getLayer(box).parentElement!;
		expect(parent.style.position).toBe('relative');

		fullscreen.value = true;
		await flush();
		expect(getLayers(box)).toHaveLength(0);
		expect(parent.style.position).toBe('');
		expect(getLayer().parentElement).toBe(document.body);
		expect(getLayer().style.backgroundImage).not.toBe('');

		fullscreen.value = false;
		await flush();
		expect(getLayers()).toHaveLength(1);
		expect(getLayer(box).parentElement).toBe(parent);
		expect(getLayer(box).className).toBe('vc-watermark__layer');
		expect(parent.style.position).toBe('relative');
		wrapper.unmount();
	});

	it('fullscreen: leaves the wrapper and goes to body when the default slot is used', async () => {
		const wrapper = mount(() => (<Watermark fullscreen value="text"><p class="content">content</p></Watermark>), { attachTo: document.body });
		await flush();

		expect(wrapper.classes()).toEqual(['vc-watermark']);
		expect(wrapper.find('.content').exists()).toBe(true);
		expect(getLayers(wrapper.element)).toHaveLength(0);
		expect(getLayer().parentElement).toBe(document.body);
		wrapper.unmount();
		expect(getLayers()).toHaveLength(0);
	});

	it('stops guarding the layer once unmounted', async () => {
		const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
		const wrapper = mount(() => (<Watermark value="text"><p>content</p></Watermark>), { attachTo: document.body });
		await flush();
		disconnect.mockClear();

		wrapper.unmount();
		await flush();
		expect(disconnect).toHaveBeenCalled();
		expect(getLayers()).toHaveLength(0);
	});
});
