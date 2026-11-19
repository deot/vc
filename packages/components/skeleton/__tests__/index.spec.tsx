// @vitest-environment jsdom

import { Skeleton, SkeletonItem } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import * as path from 'node:path';
import * as sass from 'sass';
import { MSkeleton, MSkeletonItem } from '../index.m';

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Skeleton).toBe('object');
		expect(typeof SkeletonItem).toBe('object');
	});

	it('预设：标题 + 3 行段落，默认闪光，根节点 aria-busy', () => {
		const wrapper = mount(() => (<Skeleton />));

		expect(wrapper.classes()).toEqual(['vc-skeleton', 'is-animated']);
		expect(wrapper.attributes('aria-busy')).toBe('true');
		expect(wrapper.findAll('.vc-skeleton__group')).toHaveLength(1);
		expect(wrapper.find('.vc-skeleton__group').attributes('aria-hidden')).toBe('true');
		expect(wrapper.find('.vc-skeleton__title').classes()).toEqual(['vc-skeleton-item', 'is-square', 'vc-skeleton__title']);
		expect(wrapper.findAll('.vc-skeleton__row')).toHaveLength(3);
		expect(wrapper.find('.vc-skeleton__image').exists()).toBe(false);
	});

	it('animated=false', () => {
		expect(mount(() => (<Skeleton animated={false} />)).classes()).toEqual(['vc-skeleton', 'is-static']);
	});

	it('title：false 不渲染，数字 / 字符串为宽度', () => {
		expect(mount(() => (<Skeleton title={false} />)).find('.vc-skeleton__title').exists()).toBe(false);
		expect(mount(() => (<Skeleton title={120} />)).find('.vc-skeleton__title').attributes('style')).toBe('width: 120px;');
		expect(mount(() => (<Skeleton title="50%" />)).find('.vc-skeleton__title').attributes('style')).toBe('width: 50%;');
		expect(mount(() => (<Skeleton title />)).find('.vc-skeleton__title').attributes('style')).toBeUndefined();
	});

	it('rows：数字为行数，数组为逐行宽度；0 行且无标题时不渲染内容区', () => {
		const rows = mount(() => (<Skeleton rows={['100%', 200, '30%']} />)).findAll('.vc-skeleton__row');

		expect(rows.map(row => row.attributes('style'))).toEqual(['width: 100%;', 'width: 200px;', 'width: 30%;']);
		expect(mount(() => (<Skeleton rows={5} />)).findAll('.vc-skeleton__row')).toHaveLength(5);
		expect(mount(() => (<Skeleton rows={0} />)).find('.vc-skeleton__rows').exists()).toBe(false);
		expect(mount(() => (<Skeleton rows={0} title={false} image />)).find('.vc-skeleton__content').exists()).toBe(false);
	});

	it('image：true 为默认方形，对象可设尺寸与形状', () => {
		expect(mount(() => (<Skeleton image />)).find('.vc-skeleton__image').classes()).toContain('is-square');

		const image = mount(() => (<Skeleton image={{ size: 40, shape: 'circle' }} />)).find('.vc-skeleton__image');
		expect(image.classes()).toContain('is-circle');
		expect(image.attributes('style')).toBe('width: 40px; height: 40px;');
	});

	it('repeat + placeholder 插槽', () => {
		const wrapper = mount(() => (
			<Skeleton repeat={3}>
				{{ placeholder: ({ index }: { index: number }) => (<SkeletonItem class="custom">{ index }</SkeletonItem>) }}
			</Skeleton>
		));

		const groups = wrapper.findAll('.vc-skeleton__group');
		expect(groups).toHaveLength(3);
		expect(groups[0].classes()).toContain('is-custom');
		expect(wrapper.findAll('.custom')).toHaveLength(3);
		expect(wrapper.find('.vc-skeleton__title').exists()).toBe(false);
	});

	it('loading=false：只渲染默认插槽，切回 true 显示骨架', async () => {
		const loading = ref(false);
		const wrapper = mount(() => (<div><Skeleton loading={loading.value}><p class="content">内容</p></Skeleton></div>));

		expect(wrapper.find('.content').exists()).toBe(true);
		expect(wrapper.find('.vc-skeleton').exists()).toBe(false);

		loading.value = true;
		await nextTick();
		expect(wrapper.find('.content').exists()).toBe(false);
		expect(wrapper.find('.vc-skeleton').exists()).toBe(true);
	});

	describe('delay', () => {
		beforeEach(() => vi.useFakeTimers());
		afterEach(() => vi.useRealTimers());

		it('首次加载：delay 内为空，超过后显示骨架；短请求不出骨架', async () => {
			const loading = ref(true);
			const wrapper = mount(() => (<div><Skeleton loading={loading.value} delay={300}><p class="content">内容</p></Skeleton></div>));

			expect(wrapper.find('.vc-skeleton').exists()).toBe(false);
			expect(wrapper.find('.content').exists()).toBe(false);

			vi.advanceTimersByTime(300);
			await nextTick();
			expect(wrapper.find('.vc-skeleton').exists()).toBe(true);

			loading.value = false;
			await nextTick();
			expect(wrapper.find('.content').exists()).toBe(true);

			// 再次加载：delay 内保留已有内容，结束得早就不出骨架
			loading.value = true;
			await nextTick();
			expect(wrapper.find('.content').exists()).toBe(true);
			vi.advanceTimersByTime(200);
			loading.value = false;
			await nextTick();
			vi.advanceTimersByTime(500);
			await nextTick();
			expect(wrapper.find('.vc-skeleton').exists()).toBe(false);
			expect(wrapper.find('.content').exists()).toBe(true);
		});

		it('卸载时清除定时器', () => {
			const wrapper = mount(() => (<Skeleton delay={300} />));
			wrapper.unmount();
			expect(vi.getTimerCount()).toBe(0);
		});
	});

	it('SkeletonItem：单独使用默认闪光，在 Skeleton 内不传则跟随外层', () => {
		const item = mount(() => (<SkeletonItem width={80} height="2em" shape="circle" />));

		expect(item.classes()).toEqual(['vc-skeleton-item', 'is-circle', 'is-animated']);
		expect(item.attributes('style')).toBe('width: 80px; height: 2em;');
		expect(mount(() => (<SkeletonItem animated={false} />)).classes()).toContain('is-static');

		const inside = mount(() => (
			<Skeleton animated={false}>
				{{ placeholder: () => [<SkeletonItem class="a" />, <SkeletonItem class="b" animated />] }}
			</Skeleton>
		));
		expect(inside.find('.a').classes()).toEqual(['vc-skeleton-item', 'is-square', 'a']);
		expect(inside.find('.b').classes()).toContain('is-animated');
	});

	it('样式：尺寸为局部变量，闪光走继承的动画变量，减弱动态效果时停止', () => {
		const css = sass.compile(path.resolve(process.cwd(), 'packages/components/skeleton/style.scss')).css;

		expect(css).toContain('height: var(--vc-skeleton-row-height, 16px)');
		expect(css).toContain('background-color: var(--vc-skeleton-color, var(--vc-color-neutral-light))');
		expect(css).toContain('animation: var(--vc-skeleton-shimmer, none)');
		expect(css).toContain('--vc-skeleton-shimmer: vc-skeleton var(--vc-skeleton-duration, 1.4s) ease infinite');
		expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\.vc-skeleton-item::after\s*\{\s*animation: none/);
	});
});

describe('index.m.ts', () => {
	it('MSkeleton：与 Skeleton 结构相同，根节点另有 vcm-skeleton，数字长度为 750 稿', () => {
		const wrapper = mount(() => (<MSkeleton title={200} image={{ size: 96 }} />));

		expect(wrapper.classes()).toEqual(['vc-skeleton', 'vcm-skeleton', 'is-animated']);
		expect(wrapper.find('.vc-skeleton__title').attributes('style')).toBe('width: calc(var(--vc-rem) * 200);');
		expect(wrapper.find('.vc-skeleton__image').attributes('style')).toContain('width: calc(var(--vc-rem) * 96)');
		// 预设块不带 vcm-skeleton-item，尺寸取自根节点
		expect(wrapper.find('.vcm-skeleton-item').exists()).toBe(false);
	});

	it('MSkeletonItem', () => {
		const item = mount(() => (<MSkeletonItem width={160} />));

		expect(item.classes()).toEqual(['vc-skeleton-item', 'vcm-skeleton-item', 'is-square', 'is-animated']);
		expect(item.attributes('style')).toBe('width: calc(var(--vc-rem) * 160);');
	});

	it('样式：只覆盖局部变量；MSkeleton 内的 MSkeletonItem 跟随根节点', () => {
		const css = sass.compile(path.resolve(process.cwd(), 'packages/components/skeleton/mobile/style.scss')).css;

		expect(css).toContain('--vc-skeleton-row-height: calc(var(--vc-rem) * 36)');
		expect(css).toMatch(/\.vcm-skeleton \.vcm-skeleton-item \{\s*--vc-skeleton-row-height: inherit;/);
	});
});
