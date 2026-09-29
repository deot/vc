// @vitest-environment jsdom

import { mount, enableAutoUnmount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { enUS, zhCN } from '@deot/vc-locale';
import { VcInstance } from '../../vc';
import { Upload } from '..';
import { MUpload } from '../index.m';
import { UploadTaskView } from '../task';
import type { UploadTaskExposed } from '../task/types';
import type { UploadExposed } from '../types';

enableAutoUnmount(afterEach);
const originalLocale = VcInstance.options.locale;
afterEach(() => VcInstance.configure({ locale: originalLocale }));

describe('Upload locale', () => {
	it('keeps string leaves and placeholders aligned', () => {
		const zh = zhCN.vc.Upload as Record<string, string>;
		const en = enUS.vc.Upload as Record<string, string>;
		expect(Object.keys(zh)).toEqual(Object.keys(en));
		for (const key of Object.keys(zh)) {
			expect(typeof zh[key]).toBe('string');
			expect(typeof en[key]).toBe('string');
			expect(zh[key].match(/\{\w+\}/g)).toEqual(en[key].match(/\{\w+\}/g));
		}
	});

	it('updates visible task labels, states and results when locale changes', async () => {
		VcInstance.configure({ locale: zhCN });
		const wrapper = mount(UploadTaskView);
		const task = wrapper.vm as unknown as UploadTaskExposed;
		task.show([
			{ uploadId: 'one', name: 'one.txt', size: 1024, percent: 0 },
			{ uploadId: 'two', name: 'two.txt', size: 2048, percent: 0 }
		]);
		task.start('two');
		await nextTick();
		expect(wrapper.text()).toContain('等待中');
		expect(wrapper.text()).toContain('上传中');
		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(wrapper.get('section').attributes('aria-label')).toBe('Upload tasks');
		expect(wrapper.text()).toContain('Current upload progress');
		expect(wrapper.text()).toContain('Waiting');
		expect(wrapper.text()).toContain('Uploading');
		expect(wrapper.text()).toContain('File name');
		task.success('one');
		task.error('two', 'Custom error');
		task.complete();
		await nextTick();
		expect(wrapper.text()).toContain('Succeeded: 1, failed: 1, total: 2');
		VcInstance.configure({ locale: zhCN });
		await nextTick();
		expect(wrapper.text()).toContain('上传结束，成功：1，失败：1，总数：2');
		expect(wrapper.text()).toContain('Custom error');
	});

	it.each([Upload, MUpload])('translates preflight cancellation for both platforms', async (component) => {
		VcInstance.configure({ locale: enUS });
		const wrapper = mount(component, {
			props: { showTask: true, onFileBefore: () => false } as any
		});
		(wrapper.vm as unknown as UploadExposed).uploadFiles([new File(['test'], 'test.txt')]);
		for (let i = 0; i < 8; i++) await nextTick();
		expect(document.body.textContent).toContain('Upload canceled');
		expect(document.body.textContent).toContain('Succeeded: 0, failed: 1, total: 1');
		wrapper.unmount();
	});
});
