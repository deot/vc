// @vitest-environment jsdom

import { Image } from '@deot/vc-components';
import { enUS, zhCN } from '@deot/vc-locale';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
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
});
