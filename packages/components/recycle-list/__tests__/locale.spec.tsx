// @vitest-environment jsdom

import { mount, enableAutoUnmount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { enUS, zhCN } from '@deot/vc-locale';
import { VcInstance } from '../../vc';
import { Container } from '../container';
import { ScrollState } from '../scroll-state';

enableAutoUnmount(afterEach);
const originalLocale = VcInstance.options.locale;
beforeEach(() => VcInstance.configure({ locale: zhCN }));
afterEach(() => VcInstance.configure({ locale: originalLocale }));

describe('RecycleList locale', () => {
	it('keeps language keys and string leaves aligned', () => {
		expect(Object.keys(zhCN.vc.RecycleList)).toEqual(Object.keys(enUS.vc.RecycleList));
		for (const locale of [zhCN, enUS]) {
			expect(Object.values(locale.vc.RecycleList).every(value => typeof value === 'string')).toBe(true);
		}
	});

	it.each([true, false])('updates end state text when locale changes (empty=%s)', async (isEmpty) => {
		const wrapper = mount(ScrollState, {
			props: {
				loadState: { isEnd: true, isLoading: false, isSilentRefresh: false, isEmpty, loaded: isEmpty ? 0 : 3 },
				renderer: {}
			}
		});
		expect(wrapper.text()).toBe(isEmpty ? '暂无数据~' : '已全部加载~');
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.text()).toBe(isEmpty ? 'No data' : 'All loaded');
	});

	it('preserves slot and render overrides including empty content', () => {
		const props = {
			loadState: { isEnd: true, isLoading: false, isSilentRefresh: false, isEmpty: true, loaded: 0 },
			renderer: { empty: () => 'custom render' }
		};
		expect(mount(ScrollState, { props }).text()).toBe('custom render');
		expect(mount(ScrollState, { props, slots: { empty: () => 'custom slot' } }).text()).toBe('custom slot');
		expect(mount(ScrollState, { props: { ...props, renderer: { empty: () => '' } } }).text()).toBe('');
	});

	it.each([
		[true, false, '↓ 下拉刷新', '↓ Pull down to refresh', '↑ Release to refresh'],
		[true, true, '↑ 上拉刷新', '↑ Pull up to refresh', '↓ Release to refresh'],
		[false, false, '→ 右拉刷新', '→ Pull right to refresh', '← Release to refresh'],
		[false, true, '← 左拉刷新', '← Pull left to refresh', '→ Release to refresh']
	] as const)('translates pull, release and refresh states (%s, %s)', async (vertical, inverted, zhPull, enPull, enRelease) => {
		let finish!: () => void;
		const wrapper = mount(Container, {
			props: { pullable: true, vertical, inverted, onRefresh: () => new Promise<void>((resolve) => { finish = resolve; }) }
		});
		const touch = async (type: string, distance: number) => {
			const position = 100 + (inverted ? -distance : distance);
			await wrapper.trigger(type, {
				touches: [{ screenX: vertical ? 100 : position, screenY: vertical ? position : 100 }],
				targetTouches: []
			});
		};
		await touch('touchstart', 0);
		await touch('touchmove', 20);
		expect(wrapper.text()).toBe(zhPull);
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.text()).toBe(enPull);
		await touch('touchmove', 50);
		expect(wrapper.text()).toBe(enRelease);
		await touch('touchend', 50);
		expect(wrapper.text()).toBe('Loading...');
		finish();
		await nextTick();
		await nextTick();
		expect(wrapper.text()).toBe('~');
	});

	it('preserves custom refresh rendering', async () => {
		const wrapper = mount(Container, { props: { pullable: true, render: () => '' } });
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.text()).toBe('');
	});
});
