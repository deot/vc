// @vitest-environment jsdom

import { Image } from '@deot/vc-components';
import { enUS, zhCN } from '@deot/vc-locale';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, beforeEach } from 'vitest';
import { VcInstance } from '../../vc';

class ErrorImage {
	onload: ((event: Event) => void) | null = null;
	onerror: ((event: Event) => void) | null = null;

	setAttribute() {}

	set src(_value: string) {
		this.onerror?.(new Event('error'));
	}
}

const NativeImage = window.Image;

beforeEach(() => {
	(window as any).Image = ErrorImage;
	(globalThis as any).Image = ErrorImage;
	VcInstance.configure({ locale: zhCN });
});

afterEach(() => {
	(window as any).Image = NativeImage;
	(globalThis as any).Image = NativeImage;
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
});
