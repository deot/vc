// @vitest-environment jsdom

import { Carousel, CarouselItem } from '@deot/vc-components';
import { MCarousel, MCarouselItem } from '../index.m';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

const MARKUP = '<b class="inner">text</b>';

describe('CarouselItem label', () => {
	it('指示器文字按文本渲染，支持渲染函数与 { type, value }', async () => {
		const cases: any[] = [[Carousel, CarouselItem, '.vc-carousel__button'], [MCarousel, MCarouselItem, '.vcm-carousel__button']];
		for (const [Parent, Item, selector] of cases) {
			const wrapper = mount(() => (
				<Parent height={100} autoplay={false} dots="bottom">
					<Item label={MARKUP}>A</Item>
					<Item label={{ type: 'html', value: MARKUP }}>B</Item>
					<Item label={() => (<i class="render">label</i>)}>C</Item>
					<Item>D</Item>
				</Parent>
			), { attachTo: document.body });
			await nextTick();
			await nextTick();

			const [text, html, render, empty] = wrapper.findAll(`${selector} > span`);
			expect(text.find('.inner').exists()).toBe(false);
			expect(text.text()).toBe(MARKUP);
			expect(html.find('.inner').exists()).toBe(true);
			expect(render.find('.render').exists()).toBe(true);
			// 其它项有文字时，没有文字的项仍保留占位的 span
			expect(empty.element.innerHTML).toBe('');
			// 文字节点上没有透传的属性
			expect(text.attributes()).toEqual({});
			wrapper.unmount();
		}
	});
});
