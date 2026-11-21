// @vitest-environment jsdom

import { Image, ImagePreview } from '@deot/vc-components';
import { enUS, zhCN } from '@deot/vc-locale';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import * as path from 'node:path';
import * as sass from 'sass';
import { afterEach, beforeEach, vi } from 'vitest';
import { VcInstance } from '../../vc';
import { Measuring } from '../../measuring';
import IMGStore from '../store';

class ErrorImage {
	onload: ((event: Event) => void) | null = null;
	onerror: ((event: Event) => void) | null = null;

	setAttribute() {}

	set src(_value: string) {
		this.onerror?.(new Event('error'));
	}
}

beforeEach(() => {
	vi.stubGlobal('Image', ErrorImage);
	VcInstance.configure({ locale: zhCN });
});

afterEach(() => {
	vi.unstubAllGlobals();
	VcInstance.configure({ locale: zhCN });
});

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Image).toBe('object');
	});
	it('create', async () => {
		const wrapper = mount(() => (<Image />));

		expect(wrapper.classes()).toContain('vc-image');
	});

	it('uses the current locale for the default error content', async () => {
		const wrapper = mount(Image, { props: { src: 'error.png' } });

		await nextTick();
		expect(wrapper.find('.vc-image__error').text()).toBe('加载失败');

		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.find('.vc-image__error').text()).toBe('Failed to load image');
	});

	it('passes itself to the preview, so a link around it does not become the zoom origin', async () => {
		class LoadImage {
			onload: ((event: Event) => void) | null = null;
			onerror: ((event: Event) => void) | null = null;
			setAttribute() {}
			set src(_value: string) {
				setTimeout(() => this.onload?.(new Event('load')));
			}
		}
		vi.stubGlobal('Image', LoadImage);
		const open = vi.spyOn(ImagePreview, 'open').mockImplementation(() => undefined as any);
		const wrapper = mount(() => (<a href="#"><Image src="preview.png" previewable /></a>), { attachTo: document.body });
		await new Promise(resolve => setTimeout(resolve, 10));
		await nextTick();
		const img = wrapper.find('img');
		await img.trigger('click');
		expect(open).toHaveBeenCalledWith({ data: [{ src: 'preview.png', element: img.element }] });
		open.mockRestore();
		wrapper.unmount();
	});

	describe('formatter', () => {
		afterEach(() => {
			VcInstance.configure({ Image: { formatter: void 0 } });
		});

		it('receives a single object and falls back to the original path on empty result', async () => {
			const formatter = vi.fn(({ value, type }) => (type === 'thumbnail' ? `/thumbnail/${value}` : ''));
			VcInstance.configure({ Image: { formatter } });

			const wrapper = mount(Image, { props: { src: 'a.png', thumbnail: 'b.png' } });
			await nextTick();

			expect(formatter.mock.calls[0]).toHaveLength(1);
			expect(formatter.mock.calls[0][0]).toMatchObject({ value: 'b.png', type: 'thumbnail' });
			expect(formatter.mock.calls[0][0].instance.type.name).toBe('vc-image');
			wrapper.unmount();

			const wrapper$ = mount(Image, { props: { src: 'a.png' } });
			await nextTick();
			expect(formatter.mock.calls.at(-1)![0]).toMatchObject({ value: 'a.png', type: 'src' });
			wrapper$.unmount();
		});

		it('prefers the prop over the global option', async () => {
			const formatter = vi.fn(({ value }) => value);
			const formatter$ = vi.fn(({ value }) => value);
			VcInstance.configure({ Image: { formatter } });

			const wrapper = mount(Image, { props: { src: 'a.png', formatter: formatter$ } });
			await nextTick();

			expect(formatter$).toHaveBeenCalled();
			// 其它用例里仍挂载着的 Image 也会响应全局配置，只看当前这张图
			expect(formatter.mock.calls.some(([data]) => data.value === 'a.png')).toBe(false);
			wrapper.unmount();
		});
	});

	describe('lazy', () => {
		class MockObserver {
			static instances: MockObserver[] = [];
			callback: IntersectionObserverCallback;
			options: IntersectionObserverInit;
			targets = new Set<Element>();

			constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit) {
				this.callback = callback;
				this.options = options;
				MockObserver.instances.push(this);
			}

			observe(el: Element) {
				this.targets.add(el);
			}

			unobserve(el: Element) {
				this.targets.delete(el);
			}

			disconnect() {
				this.targets.clear();
			}
		}

		const observerOf = (el: Element) => MockObserver.instances.find(i => i.targets.has(el));
		const loaders: string[] = [];

		beforeEach(() => {
			MockObserver.instances = [];
			loaders.length = 0;
			vi.stubGlobal('IntersectionObserver', MockObserver);
			vi.stubGlobal('Image', class {
				onload = null;
				onerror = null;
				setAttribute() {}
				set src(value: string) {
					loaders.push(value);
				}
			});
		});

		it('loads once it enters the nearest scroller, including a wheel-driven Scroller', async () => {
			const wrapper = mount(() => (
				<div class="vc-scroller is-wheel" style="overflow: hidden;">
					<Image src="a.png" lazy />
				</div>
			), { attachTo: document.body });
			const el = wrapper.find('.vc-image').element;
			const observer = observerOf(el)!;

			expect(observer.options.root).toBe(wrapper.element);
			expect(loaders).toEqual([]);

			observer.callback([{ target: el, isIntersecting: false, intersectionRatio: 0 } as any], observer as any);
			expect(loaders).toEqual([]);

			observer.callback([{ target: el, isIntersecting: true, intersectionRatio: 0.2 } as any], observer as any);
			await nextTick();
			expect(loaders).toEqual(['a.png']);
			// 加载后停止监听
			expect(observerOf(el)).toBeUndefined();
			wrapper.unmount();
		});

		it('stops observing on unmount and loads directly without IntersectionObserver', async () => {
			const wrapper = mount(() => (<Image src="a.png" lazy />), { attachTo: document.body });
			const el = wrapper.element;
			expect(observerOf(el)!.options.root).toBe(null);
			wrapper.unmount();
			expect(observerOf(el)).toBeUndefined();

			vi.stubGlobal('IntersectionObserver', undefined);
			const wrapper$ = mount(() => (<Image src="b.png" lazy />), { attachTo: document.body });
			await nextTick();
			expect(loaders).toEqual(['b.png']);
			wrapper$.unmount();
		});
	});

	describe('pending preload', () => {
		// 请求一直不返回的图片：记录每次创建的实例，检查回调与 src 是否被取消
		class PendingImage {
			static instances: PendingImage[] = [];
			onload: ((event: Event) => void) | null = null;
			onerror: ((event: Event) => void) | null = null;
			src = '';

			constructor() {
				PendingImage.instances.push(this);
			}

			setAttribute() {}
		}

		beforeEach(() => {
			PendingImage.instances = [];
			vi.stubGlobal('Image', PendingImage);
		});

		it('cancels the pending preload on unmount', async () => {
			const wrapper = mount(Image, { props: { src: 'a.png' } });
			await nextTick();
			const [loader] = PendingImage.instances;
			expect(loader.src).toBe('a.png');
			expect(loader.onload).toBeTypeOf('function');

			// 回调持有组件实例：不摘掉的话请求结束前整棵已卸载的子树都无法回收
			wrapper.unmount();
			expect(loader.onload).toBeNull();
			expect(loader.onerror).toBeNull();
			expect(loader.src).toBe('');
		});

		it('cancels the previous preload when src changes', async () => {
			const onLoad = vi.fn();
			const wrapper = mount(Image, { props: { src: 'a.png', onLoad } });
			await nextTick();
			await wrapper.setProps({ src: 'b.png' });

			const [previous, current] = PendingImage.instances;
			expect(previous.onload).toBeNull();
			expect(previous.src).toBe('');
			expect(current.src).toBe('b.png');

			// 当前这张加载完才算加载完成，状态以它为准
			current.onload!(new Event('load'));
			await nextTick();
			expect(onLoad).toHaveBeenCalledTimes(1);
			expect(wrapper.find('.vc-image__inner').attributes('src')).toBe('b.png');
			wrapper.unmount();
		});

		it('does not request the image inside the measure pool', async () => {
			// 虚拟列表的隐藏测量池只为量尺寸：只占位，不发请求
			const wrapper = mount(() => (<Measuring><Image src="pool.png" /></Measuring>), { attachTo: document.body });
			await nextTick();
			expect(PendingImage.instances.length).toBe(0);
			expect(wrapper.find('.vc-image__placeholder').exists()).toBe(true);
			wrapper.unmount();
		});
	});

	describe('mount cost', () => {
		beforeEach(() => {
			IMGStore.map.clear();
		});

		it('does not look up the scroll container or the cached size when nothing is cached', async () => {
			const getComputedStyle = vi.spyOn(window, 'getComputedStyle');
			const getSize = vi.spyOn(IMGStore, 'getSize');
			const wrapper = mount(Image, { props: { src: 'plain.png' }, attachTo: document.body });
			await nextTick();

			// 非懒加载不需要滚动容器（逐级 getComputedStyle 查找）；没有缓存过原始尺寸也算不出占位尺寸
			expect(getComputedStyle).not.toHaveBeenCalled();
			expect(getSize).not.toHaveBeenCalled();
			wrapper.unmount();
		});

		it('uses the cached size for the placeholder', async () => {
			vi.stubGlobal('Image', class {
				onload: any = null;
				onerror: any = null;
				src = '';
				setAttribute() {}
			});
			vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(50);
			IMGStore.add('cached.png', { originW: 200, originH: 100 });
			const wrapper = mount(Image, { props: { src: 'cached.png' }, attrs: { style: 'width: 50px' }, attachTo: document.body });
			await nextTick();

			// 只给了宽度：占位高度按缓存的原始比例算出
			const style = wrapper.find('.vc-image__placeholder').attributes('style');
			expect(style).toContain('width: 50px');
			expect(style).toContain('height: 25px');
			wrapper.unmount();
			vi.restoreAllMocks();
		});
	});

	describe('IMGStore', () => {
		beforeEach(() => {
			IMGStore.map.clear();
		});

		it('keeps sizes in memory only', () => {
			const setItem = vi.spyOn(Storage.prototype, 'setItem');
			IMGStore.add('a.png', { originW: 10, originH: 20 });
			expect(IMGStore.has('a.png')).toBe(true);
			expect(IMGStore.getSize('a.png', { style: {} })).toEqual({ w: 10, h: 20 });
			expect(setItem).not.toHaveBeenCalled();
		});

		it('does not cache inline data URLs', () => {
			IMGStore.add('data:image/png;base64,AAAA', { originW: 10, originH: 20 });
			expect(IMGStore.map.size).toBe(0);
		});

		it('ignores entries without a size', () => {
			IMGStore.add('a.png');
			IMGStore.add('b.png', { originW: 10 });
			expect(IMGStore.map.size).toBe(0);
		});

		it('evicts the least recently added entry beyond the limit', () => {
			for (let i = 0; i < 500; i++) IMGStore.add(`${i}.png`, { originW: 1, originH: 1 });
			// 再次写入会排到最近
			IMGStore.add('0.png', { originW: 2, originH: 2 });
			IMGStore.add('new.png', { originW: 1, originH: 1 });

			expect(IMGStore.map.size).toBe(500);
			expect(IMGStore.has('0.png')).toBe(true);
			expect(IMGStore.has('1.png')).toBe(false);
			expect(IMGStore.has('new.png')).toBe(true);
		});
	});

	it('样式：加载占位与 Skeleton 共用闪光（动画已定义，减弱动态效果时停止）', () => {
		const css = sass.compile(path.resolve(process.cwd(), 'packages/components/image/style.scss')).css;

		expect(css).toContain('background-color: var(--vc-skeleton-color, var(--vc-color-neutral-light))');
		expect(css).toContain('animation: vc-skeleton var(--vc-skeleton-duration, 1.4s) ease infinite');
		expect(css).toContain('@keyframes vc-skeleton');
		expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\.vc-image__placeholder::after\s*\{\s*animation: none/);
	});
});
