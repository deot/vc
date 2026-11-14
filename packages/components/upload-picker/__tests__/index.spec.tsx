// @vitest-environment jsdom

import {
	MActionSheet,
	MUpload,
	MUploadPicker,
	Upload,
	UploadPicker
} from '@deot/vc-components';
import type { UploadPickerCallback } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import type { UploadCallback } from '../../upload/types';
import { isDoneItem } from '../utils';
import type { PickerType } from '../types';
import { Portal } from '../../portal';
import { VcInstance } from '../../vc';
import { enUS, zhCN } from '@deot/vc-locale';

const files = [
	{ type: 'image', label: 'photo.jpg', value: 'https://cdn.test/photo.jpg' },
	{ type: 'video', label: 'movie.mp4', value: 'https://cdn.test/movie.mp4' },
	{ type: 'audio', label: 'sound.mp3', value: 'https://cdn.test/sound.mp3' },
	{ type: 'file', label: 'report.pdf', value: 'https://cdn.test/report.pdf' }
];

const ALL: PickerType[] = ['image', 'video', 'audio', 'file'];

const sleep = (ms = 0) => new Promise<void>(resolve => setTimeout(resolve, ms));

// 隐藏的各类型 Upload，顺序同 picker（不含桌面端的入口）
const uploadersOf = (wrapper: VueWrapper<any>, mobile = false) => (wrapper.findAllComponents((mobile ? MUpload : Upload) as any) as any[])
	.filter(item => item.classes('vc-upload-picker__uploader'));

// 模拟一个文件上传失败
const fail = async (upload: any, file: Record<string, any>) => {
	upload.vm.$emit('file-start', { file });
	upload.vm.$emit('file-error', { stage: 'upload', cause: {}, message: '上传失败', file, result: {} });
	await nextTick();
};

// 在桌面端的选择框里选好文件
const choose = async (wrapper: VueWrapper<any>, list: File[]) => {
	const input = wrapper.find('.vc-upload-picker__upload > input[type="file"]');
	Object.defineProperty(input.element, 'files', { value: list, configurable: true });
	await input.trigger('change');
};

describe('UploadPicker', () => {
	it('updates built-in labels and item states when locale changes', async () => {
		const originalLocale = VcInstance.options.locale;
		const wrappers: VueWrapper<any>[] = [];
		try {
			VcInstance.configure({ locale: zhCN });
			for (const [Component, mobile] of [[UploadPicker, false], [MUploadPicker, true]] as const) {
				const wrapper = mount(Component, { props: { picker: ['image', 'file'] } });
				wrappers.push(wrapper);
				const [image, file] = uploadersOf(wrapper, mobile);
				await fail(image, { uploadId: 'locale-image', name: 'a.jpg', percent: 0 });
				await fail(file, { uploadId: 'locale-file', name: 'a.pdf', percent: 0 });
				image.vm.$emit('file-start', { file: { uploadId: 'locale-receiving', name: 'b.jpg', percent: 0 } });
				image.vm.$emit('file-progress', { file: { uploadId: 'locale-receiving' }, progress: { percent: 100 } });
				await nextTick();
				expect(wrapper.find('.vc-upload-picker__trigger').text()).toBe('上传');
				expect(wrapper.findAll('.vc-upload-picker__failed').map(i => i.text())).toEqual(['上传失败', '上传失败']);
				expect(wrapper.find('.vc-upload-picker__receiving').text()).toBe('服务器正在接收...');
			}
			VcInstance.configure({ locale: enUS });
			await nextTick();
			for (const wrapper of wrappers) {
				expect(wrapper.find('.vc-upload-picker__trigger').text()).toBe('Upload');
				expect(wrapper.findAll('.vc-upload-picker__failed').map(i => i.text())).toEqual(['Upload failed', 'Upload failed']);
				expect(wrapper.find('.vc-upload-picker__receiving').text()).toBe('Receiving on server...');
			}
		} finally {
			wrappers.forEach(wrapper => wrapper.unmount());
			VcInstance.configure({ locale: originalLocale });
		}
	});

	it('exports desktop and mobile components', () => {
		const onFileStart: UploadPickerCallback['onFileStart'] = ({ type }) => type;

		for (const Component of [UploadPicker, MUploadPicker]) {
			expect(typeof Component).toBe('object');
			expect(Reflect.get(Component, 'props')).not.toHaveProperty('onFileBefore');
			expect(Reflect.get(Component, 'props')).not.toHaveProperty('columns');
			expect(Reflect.get(Component, 'props')).toHaveProperty('showError');
			expect(Reflect.get(Component, 'props')).toHaveProperty('type');
			expect(Reflect.get(Component, 'props')).toHaveProperty('size');
			expect(Array.isArray(Reflect.get(Component, 'emits'))).toBe(true);
		}
		expect(typeof onFileStart).toBe('function');
	});

	it('将 showError 作为内层 Upload 默认值且允许类型配置覆盖', async () => {
		const desktop = mount(UploadPicker);
		const mobile = mount(MUploadPicker);

		expect(uploadersOf(desktop)[0].props('showError')).toBe(false);
		expect(uploadersOf(mobile, true)[0].props('showError')).toBe(false);

		await desktop.setProps({ showError: true });
		await mobile.setProps({ showError: true });
		expect(uploadersOf(desktop)[0].props('showError')).toBe(true);
		expect(uploadersOf(mobile, true)[0].props('showError')).toBe(true);

		await desktop.setProps({
			uploadOptions: {
				image: { showError: false }
			}
		});
		expect(uploadersOf(desktop)[0].props('showError')).toBe(false);
	});

	it('keeps image as the default picker: a grid with the add tile at the end', async () => {
		const wrapper = mount(UploadPicker, {
			props: { modelValue: [files[0]] }
		});

		expect(wrapper.classes()).toEqual(expect.arrayContaining(['vc-file-items', 'is-grid', 'is-tile-small', 'is-row-medium']));
		expect(wrapper.findComponent({ name: 'vc-image' }).props('src')).toContain('photo.jpg');
		// 入口在一个 Upload 里（不占位置），添加方格在列表末尾
		const grid = wrapper.find('.vc-file-grid');
		expect(grid.element.lastElementChild!.matches('.vc-upload-picker__upload')).toBe(true);
		expect(grid.element.lastElementChild!.querySelector('.vc-upload-picker__box')).not.toBeNull();
		expect(wrapper.find('.vc-upload-picker__box').text()).toBe('上传');
		// 入口的选择框与隐藏的图片 Upload，accept 都是图片
		expect(wrapper.findAll('input[type="file"]').map(i => i.attributes('accept'))).toEqual(['image/*', 'image/*']);

		await wrapper.find('.vc-upload-picker__delete').trigger('click');
		expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([]);
	});

	it('shows one entry for every type and groups media tiles before rows', () => {
		for (const Component of [UploadPicker, MUploadPicker]) {
			const wrapper = mount(Component, { props: { modelValue: [files[3], files[0], files[2], files[1]], picker: ALL } });

			expect(wrapper.classes()).toContain('is-group');
			// 只有一个入口，在列表上方
			expect(wrapper.findAll('.vc-upload-picker__trigger, .vc-upload-picker__box')).toHaveLength(1);
			const first = wrapper.element.firstElementChild!;
			expect(first.matches('.vc-upload-picker__trigger') || !!first.querySelector('.vc-upload-picker__trigger')).toBe(true);
			expect(wrapper.findAll('.vc-file-grid > .vc-file-tile').map(i => i.attributes('title'))).toEqual(['photo.jpg', 'movie.mp4']);
			expect(wrapper.findAll('.vc-file-list > .vc-file-row').map(i => i.attributes('title'))).toEqual(['report.pdf', 'sound.mp3']);
			expect(wrapper.find('.vc-file-tile.is-video video').attributes('src')).toContain('movie.mp4');
			// 每种类型仍各有一个隐藏的 Upload
			const accepts = uploadersOf(wrapper, Component === MUploadPicker).map(i => i.props('accept'));
			expect(accepts.slice(0, 3)).toEqual(['image/*', 'video/*', 'audio/*']);
			expect(accepts[3]).toContain('application/pdf');
			wrapper.unmount();
		}
	});

	it('picks the layout from picker and lets type override it', () => {
		const layoutOf = (props: Record<string, any>) => {
			const wrapper = mount(UploadPicker, { props });
			const classes = wrapper.classes();
			return ['is-list', 'is-grid', 'is-group'].find(i => classes.includes(i));
		};
		expect(layoutOf({ picker: ['image', 'video'] })).toBe('is-grid');
		expect(layoutOf({ picker: ['audio', 'file'] })).toBe('is-list');
		expect(layoutOf({ picker: ['image', 'file'] })).toBe('is-group');
		expect(layoutOf({ picker: ['image', 'file'], type: 'grid' })).toBe('is-grid');

		// list：图片、视频为带缩略图的整行；grid：音频、文件为方格
		const list = mount(UploadPicker, { props: { modelValue: files, picker: ALL, type: 'list' } });
		expect(list.findAll('.vc-file-row')).toHaveLength(4);
		expect(list.findAll('.vc-file-row__media')).toHaveLength(2);
		expect(list.find('.vc-upload-picker__trigger').exists()).toBe(true);
		const grid = mount(UploadPicker, { props: { modelValue: files, picker: ALL, type: 'grid' } });
		expect(grid.findAll('.vc-file-tile')).toHaveLength(4);
		expect(grid.findAll('.vc-file-tile__name').map(i => i.text())).toEqual(['sound.mp3', 'report.pdf']);
		expect(grid.find('.vc-file-grid .vc-upload-picker__box').exists()).toBe(true);
	});

	it('sets the tile and row size', () => {
		const wrapper = mount(UploadPicker, { props: { picker: ALL, size: 'large' } });
		expect(wrapper.classes()).toEqual(expect.arrayContaining(['is-tile-large', 'is-row-large']));
	});

	it('distributes files chosen in the desktop entry to the uploader of each type', async () => {
		const onError = vi.fn();
		const wrapper = mount(UploadPicker, {
			props: { modelValue: [files[0]], picker: ['image', 'file'], max: 3, onError }
		});
		const input = wrapper.find('.vc-upload-picker__upload > input[type="file"]');
		expect(input.attributes('accept')).toBe(`image/*,${uploadersOf(wrapper)[1].props('accept')}`);
		expect(input.attributes('multiple')).toBeDefined();

		const [image, file] = uploadersOf(wrapper);
		const uploadImages = vi.fn();
		const uploadDocs = vi.fn();
		image.vm.$.exposed.uploadFiles = uploadImages;
		file.vm.$.exposed.uploadFiles = uploadDocs;
		const photo = new File(['x'], 'a.png', { type: 'image/png' });
		const doc = new File(['x'], 'a.pdf', { type: 'application/pdf' });
		const zip = new File(['x'], 'a.zip', { type: 'application/zip' });

		await choose(wrapper, [doc, zip, photo]);
		// 不支持的文件被忽略，其余按类型分组
		expect(uploadImages).toHaveBeenCalledWith([photo]);
		expect(uploadDocs).toHaveBeenCalledWith([doc]);

		// 都不支持、超出总数时由入口拒绝
		await choose(wrapper, [zip]);
		await choose(wrapper, [doc, photo, photo]);
		expect(uploadImages).toHaveBeenCalledTimes(1);
		expect(onError.mock.calls.map(([payload]) => payload.cause.message)).toEqual([
			expect.stringContaining('文件格式限制'),
			'可选文件数量不能超过2个'
		]);
	});

	it('chooses the type first on mobile and opens the native picker of that type', async () => {
		const enhancer = vi.fn(() => false);
		const wrapper = mount(MUploadPicker, {
			props: { picker: ['image', 'file'], enhancer },
			attachTo: document.body
		});
		try {
			// 移动端没有多类型的选择框
			expect(wrapper.find('.vc-upload-picker__upload').exists()).toBe(false);
			const [, file] = uploadersOf(wrapper, true);
			const click = vi.spyOn(file.element as HTMLElement, 'click');

			await wrapper.find('.vc-upload-picker__trigger').trigger('click');
			await sleep(0);
			const actions = Array.from(document.querySelectorAll('.vcm-action-sheet__item'));
			expect(actions.map(i => i.textContent)).toEqual(['图片', '文件']);
			expect(document.querySelector('.vcm-action-sheet__cancel')?.textContent).toBe('取消');

			(actions[1] as HTMLElement).click();
			expect(enhancer).toHaveBeenCalledWith({ instance: expect.anything(), type: 'file', types: ['image', 'file'] });
			expect(click).toHaveBeenCalledTimes(1);
		} finally {
			MActionSheet.destroy();
			wrapper.unmount();
		}
	});

	it('opens the only type that still has room without choosing', async () => {
		const wrapper = mount(MUploadPicker, {
			props: { modelValue: [files[0]], picker: ['image', 'file'], max: { image: 1, file: 2 } }
		});
		const [, file] = uploadersOf(wrapper, true);
		const click = vi.spyOn(file.element as HTMLElement, 'click');
		await wrapper.find('.vc-upload-picker__trigger').trigger('click');
		await sleep(0);
		expect(document.querySelector('.vcm-action-sheet__item')).toBeNull();
		expect(click).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('runs the enhancer before opening the native picker on desktop', async () => {
		const enhancer = vi.fn(() => true);
		const single = mount(UploadPicker, { props: { enhancer } });
		const click = vi.spyOn(uploadersOf(single)[0].element as HTMLElement, 'click');
		await single.find('.vc-upload-picker__box').trigger('click');
		expect(enhancer).toHaveBeenLastCalledWith({ instance: expect.anything(), type: 'image', types: ['image'] });
		// 返回真值表示已自行处理
		expect(click).not.toHaveBeenCalled();

		const multiple = mount(UploadPicker, { props: { picker: ['image', 'file'], enhancer } });
		await multiple.find('.vc-upload-picker__trigger').trigger('click');
		expect(enhancer).toHaveBeenLastCalledWith({ instance: expect.anything(), type: undefined, types: ['image', 'file'] });
	});

	it('hides the entry when disabled or full', () => {
		expect(mount(UploadPicker, { props: { disabled: true } }).find('.vc-upload-picker__box').exists()).toBe(false);
		expect(mount(UploadPicker, { props: { modelValue: [files[0]], max: 1 } }).find('.vc-upload-picker__box').exists()).toBe(false);
		// 禁用时成功项不能删除
		expect(mount(UploadPicker, { props: { modelValue: [files[0]], disabled: true } }).find('.vc-upload-picker__delete').exists()).toBe(false);
	});

	it('previews every uploaded item in list order', async () => {
		for (const Component of [UploadPicker, MUploadPicker]) {
			const wrapper = mount(Component, {
				props: { modelValue: [files[3], files[0], files[1]], picker: ALL }
			});
			const [image] = uploadersOf(wrapper, Component === MUploadPicker);
			await fail(image, { uploadId: 'preview-failed', name: 'failed.jpg', percent: 0 });

			// group 里图片排在前面，但查看器按列表顺序，且不含失败项
			await wrapper.find('.vc-file-tile.is-image').trigger('click');
			await nextTick();
			expect(document.querySelector('.vc-file-viewer__counter')?.textContent).toBe('2 / 3');
			Portal.clear(true);

			await wrapper.find('.vc-file-tile.is-video').trigger('click');
			await nextTick();
			expect(document.querySelector('.vc-video-slide video')?.getAttribute('src')).toBe(files[1].value);
			Portal.clear(true);

			// 失败项点击不预览
			await wrapper.find('.vc-upload-picker__item.is-error').trigger('click');
			await nextTick();
			expect(document.querySelector('.vc-file-viewer')).toBeNull();
			wrapper.unmount();
		}
	});

	it('opens files in the viewer: a new-window link on desktop, copy link on mobile', async () => {
		for (const Component of [UploadPicker, MUploadPicker]) {
			const wrapper = mount(Component, {
				props: { modelValue: [files[3]], picker: ['file'] }
			});
			await wrapper.find('.vc-file-row').trigger('click');
			await nextTick();
			expect(document.querySelector('.vc-file-slide__frame')?.getAttribute('src')).toBe(files[3].value);
			// MUploadPicker 打开移动端查看器：只保留关闭按钮，文件页为「复制链接」
			const isMobile = Component === MUploadPicker;
			if (isMobile) {
				expect(document.querySelector('.vc-file-slide__open')).toBeNull();
				expect(document.querySelector('.vc-file-slide__copy')).not.toBeNull();
			} else {
				const link = document.querySelector('.vc-file-slide__open') as HTMLAnchorElement;
				expect([link.getAttribute('href'), link.target, link.rel]).toEqual([files[3].value, '_blank', 'noopener noreferrer']);
			}
			expect(document.querySelector('.vc-file-viewer')!.classList.contains('vcm-file-viewer')).toBe(isMobile);
			expect(!!document.querySelector('.vc-file-viewer__close')).toBe(true);
			Portal.clear(true);
			wrapper.unmount();
		}
	});

	it('lets the global FilePreview enhancer take over previews', async () => {
		const enhancer = vi.fn(() => true);
		VcInstance.options.FilePreview!.enhancer = enhancer;
		Portal.clear(true);
		try {
			const wrapper = mount(UploadPicker, {
				props: {
					modelValue: [files[1], { ...files[1], label: 'clip.mp4', value: 'https://cdn.test/clip.mp4' }],
					picker: ['video']
				}
			});
			await wrapper.findAll('.vc-file-tile')[1].trigger('click');
			await nextTick();

			expect(enhancer).toHaveBeenCalledWith({
				current: 1,
				mobile: false,
				instance: wrapper.vm.$,
				data: [
					expect.objectContaining({ type: 'video', source: files[1].value, name: 'movie.mp4' }),
					expect.objectContaining({ type: 'video', source: 'https://cdn.test/clip.mp4', name: 'clip.mp4' })
				]
			});
			expect(document.querySelector('.vc-file-viewer')).toBeNull();
		} finally {
			VcInstance.options.FilePreview!.enhancer = undefined;
			Portal.clear(true);
		}
	});

	it('types model values with the global getFileType', () => {
		VcInstance.options.FilePreview!.getFileType = ({ source }) => (/!4-4$/.test(source) ? 'image' : undefined);
		try {
			const wrapper = mount(UploadPicker, {
				props: {
					modelValue: ['https://cdn.test/photo.jpg!4-4', files[3].value],
					picker: ['image', 'file']
				}
			});

			expect(wrapper.findAll('.vc-file-tile.is-image')).toHaveLength(1);
			expect(wrapper.findAll('.vc-file-row.is-file')).toHaveLength(1);
		} finally {
			VcInstance.options.FilePreview!.getFileType = undefined;
		}
	});

	it('treats items with a string address and no failure as done', () => {
		const row = { value: '/same.jpg' };
		expect([row, { value: '/failed.jpg', errorFlag: true }, { value: 1 }].filter(i => isDoneItem(i, 'value'))).toEqual([row]);
	});

	it('uses the mobile marker and the corner delete badge', () => {
		const wrapper = mount(MUploadPicker, {
			props: { modelValue: files, picker: ALL }
		});

		expect(wrapper.classes()).toEqual(expect.arrayContaining(['vc-upload-picker', 'vcm-upload-picker']));
		expect(wrapper.findAll('.vc-upload-picker__delete')).toHaveLength(4);
		expect(wrapper.find('.vc-upload-picker__delete').classes()).toContain('vc-icon');
		// 完成后不显示状态
		expect(wrapper.find('.vc-upload-picker__percent, .vc-upload-picker__failed').exists()).toBe(false);
	});

	it('shows progress on tiles and rows', async () => {
		for (const Component of [UploadPicker, MUploadPicker]) {
			const wrapper = mount(Component, { props: { picker: ['image', 'file'] } });
			const [image, file] = uploadersOf(wrapper, Component === MUploadPicker);
			for (const [upload, uploadId] of [[image, 'p-image'], [file, 'p-file']] as const) {
				upload.vm.$emit('file-start', { file: { uploadId, name: uploadId, percent: 0 } });
				upload.vm.$emit('file-progress', { file: { uploadId }, progress: { percent: 45 } });
			}
			await nextTick();
			// 方格为百分比与带轨道的细进度条；整行为右侧百分比与底部进度条
			const tile = wrapper.find('.vc-file-tile.is-loading');
			expect(tile.find('.vc-upload-picker__percent').text()).toBe('45%');
			expect((tile.find('.vc-upload-picker__meter .vc-upload-picker__bar').element as HTMLElement).style.transform).toBe('scaleX(0.45)');
			const row = wrapper.find('.vc-file-row.is-loading');
			expect(row.find('.vc-upload-picker__percent').text()).toBe('45%');
			expect((row.find('.vc-upload-picker__bar').element as HTMLElement).style.transform).toBe('scaleX(0.45)');
			wrapper.unmount();
		}
	});

	it('supports custom item and upload slots', () => {
		const wrapper = mount(UploadPicker, {
			props: {
				modelValue: [files[1], files[3]],
				picker: ['video', 'file']
			},
			slots: {
				default: ({ row, type, index, position }) => (
					<div class="custom-item">{`${type}:${row.label}:${index}:${position}`}</div>
				),
				upload: ({ types }) => <button class="custom-upload">{types.join(',')}</button>
			}
		});

		expect(wrapper.findAll('.custom-item').map(i => i.text())).toEqual(['video:movie.mp4:0:0', 'file:report.pdf:1:1']);
		// upload 插槽替换整个入口，只有一个
		expect(wrapper.findAll('.custom-upload').map(i => i.text())).toEqual(['video,file']);
		expect(wrapper.find('.vc-upload-picker__trigger').exists()).toBe(false);
	});

	it('distinguishes preview index from position on desktop and mobile', async () => {
		for (const Component of [UploadPicker, MUploadPicker]) {
			const wrapper = mount(Component, {
				props: { modelValue: [files[2]], picker: ['audio'] },
				slots: {
					default: ({ index, position }) => <div class="custom-index">{`${index}:${position}`}</div>
				}
			});
			await fail(uploadersOf(wrapper, Component === MUploadPicker)[0], { uploadId: 'failed-audio', name: 'failed.mp3', percent: 0 });
			expect(wrapper.findAll('.custom-index').map(i => i.text())).toEqual(['0:0', '-1:1']);
			wrapper.unmount();
		}
	});

	it('keeps preview indexes correct for duplicate values', () => {
		const wrapper = mount(UploadPicker, {
			props: {
				modelValue: [files[0], { ...files[0], label: 'photo-copy.jpg' }],
				picker: ['image']
			},
			slots: {
				default: ({ index, position }) => <div class="custom-index">{`${index}:${position}`}</div>
			}
		});

		expect(wrapper.findAll('.custom-index').map(i => i.text())).toEqual(['0:0', '1:1']);
	});

	it('outputs items in the order they were added', async () => {
		const wrapper = mount(UploadPicker, { props: { picker: ['image', 'file'] } });
		const [image, file] = uploadersOf(wrapper);
		const steps = [[image, 'a.png'], [file, 'b.pdf'], [image, 'c.png']] as const;
		for (const [upload, name] of steps) {
			upload.vm.$emit('file-start', { file: { uploadId: name, name, percent: 0 } });
			upload.vm.$emit('file-success', { response: { value: `/${name}` }, file: { uploadId: name, name } });
		}
		image.vm.$emit('complete', { result: {} });
		await nextTick();
		expect((wrapper.emitted('update:modelValue')?.at(-1)?.[0] as any[]).map(i => `${i.type}:${i.value}`)).toEqual([
			'image:/a.png',
			'file:/b.pdf',
			'image:/c.png'
		]);
	});

	it('sorts inside a group block and keeps the other items in place', async () => {
		const second = { ...files[0], label: 'second.jpg', value: '/second.jpg' };
		const wrapper = mount(UploadPicker, {
			props: { modelValue: [files[0], files[3], second], picker: ['image', 'file'], sortable: true }
		});
		const lists = wrapper.findAllComponents({ name: 'vc-sort-list' });
		expect(lists).toHaveLength(2);
		const media = lists[0].props('modelValue') as any[];
		lists[0].vm.$emit('change', [media[1], media[0]]);
		await nextTick();
		expect((wrapper.emitted('update:modelValue')?.at(-1)?.[0] as any[]).map(i => i.value)).toEqual([
			'/second.jpg',
			files[3].value,
			files[0].value
		]);
	});

	it('sorts duplicate values as independent items', async () => {
		const wrapper = mount(UploadPicker, {
			props: {
				modelValue: [files[0], { ...files[0], label: 'photo-copy.jpg' }],
				picker: ['image'],
				sortable: true,
				mask: true
			}
		});
		const items = wrapper.findAll('.vc-sort-list__item');
		await items[1].find('.vc-sort-list__mask').findAll('span')[0].trigger('click');
		const sorted = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as any[];

		expect(sorted).toHaveLength(2);
		expect(sorted.map(i => i.label)).toEqual(['photo-copy.jpg', 'photo.jpg']);
	});

	it('tracks progress, formats success and synchronizes model value', async () => {
		const formatter = vi.fn(response => ({ value: response.url, label: 'formatted.pdf' }));
		const wrapper = mount(UploadPicker, {
			props: { modelValue: [], picker: ['file'], formatter }
		});
		const upload = uploadersOf(wrapper)[0];
		const vFile = { uploadId: 'upload-1', name: 'raw.pdf', percent: 0 };

		upload.vm.$emit('file-start', { file: vFile });
		await nextTick();
		expect(wrapper.find('.vc-file-row.is-file.is-loading').exists()).toBe(true);

		const result = { total: 1, completed: 1, succeeded: 1, failed: 0, responses: [], queues: [] };
		upload.vm.$emit('file-success', {
			response: { url: '/formatted.pdf' },
			file: vFile,
			result
		});
		upload.vm.$emit('complete', { result });
		await nextTick();

		expect(formatter).toHaveBeenCalledWith({ url: '/formatted.pdf' }, vFile, 'file');
		expect(wrapper.emitted('file-start')?.[0][0]).toEqual({ file: vFile, type: 'file' });
		expect(wrapper.emitted('file-success')?.[0][0]).toEqual({
			response: { url: '/formatted.pdf' },
			file: vFile,
			result,
			type: 'file'
		});
		expect(wrapper.emitted('complete')?.[0][0]).toEqual({ result, type: 'file' });
		expect(wrapper.emitted('file-progress')).toBeUndefined();
		expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([
			{ type: 'file', label: 'formatted.pdf', value: '/formatted.pdf' }
		]);
	});

	it('retries failed uploads with the original file on desktop and mobile', async () => {
		for (const Component of [UploadPicker, MUploadPicker]) {
			for (const type of ['file', 'image'] as const) {
				const wrapper = mount(Component, { props: { modelValue: [], picker: ['image', 'file'] } });
				const uploads = uploadersOf(wrapper, Component === MUploadPicker);
				const upload = uploads[type === 'image' ? 0 : 1];
				const uploadFiles = vi.fn();
				upload.vm.$.exposed.uploadFiles = uploadFiles;

				const target = new File(['x'], 'a.pdf');
				await fail(upload, { uploadId: `retry-${type}`, name: 'a.pdf', percent: 0, target });

				await wrapper.find('.vc-upload-picker__retry').trigger('click');
				await nextTick();
				await nextTick();
				// 失败项被移除，原始文件重新交给该类型的 Upload
				expect(wrapper.find('.is-error').exists()).toBe(false);
				expect(uploadFiles).toHaveBeenCalledTimes(1);
				expect(uploadFiles).toHaveBeenCalledWith([target]);
				wrapper.unmount();
			}
		}
	});

	it('keeps failed and uploading items when v-model echoes the synced value', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<UploadPicker v-model={value.value} picker={['file']} />
		));
		const upload = uploadersOf(wrapper)[0];
		const failed = { uploadId: 'echo-failed', name: 'a.pdf', percent: 0, target: new File(['x'], 'a.pdf') };
		const done = { uploadId: 'echo-done', name: 'b.pdf', percent: 0 };
		upload.vm.$emit('file-start', { file: failed });
		upload.vm.$emit('file-start', { file: done });
		upload.vm.$emit('file-error', { stage: 'upload', cause: {}, message: '上传失败', file: failed, result: {} });
		upload.vm.$emit('file-success', { response: { value: '/b.pdf' }, file: done });
		upload.vm.$emit('complete', { result: {} });
		await nextTick();
		await nextTick();

		// 外层收到的只有成功项；回写后列表不重建，失败项与重试仍在
		expect(value.value.map(i => i.value)).toEqual(['/b.pdf']);
		expect(wrapper.findAll('.vc-file-row')).toHaveLength(2);
		expect(wrapper.find('.vc-file-row.is-error .vc-upload-picker__retry').exists()).toBe(true);

		// 外层换成别的值时照常重建
		value.value = [{ type: 'file', label: 'c.pdf', value: '/c.pdf' }];
		await nextTick();
		expect(wrapper.findAll('.vc-file-row')).toHaveLength(1);
	});

	it('reconciles external model changes without dropping uploads or remounting items', async () => {
		const value = ref<any>('https://cdn.test/a.png');
		const wrapper = mount(() => (
			<UploadPicker v-model={value.value} picker={['image']} output="string" />
		));
		const upload = uploadersOf(wrapper)[0];
		const done = { uploadId: 'r-done', name: '上传的名字.png', percent: 0 };
		upload.vm.$emit('file-start', { file: done });
		upload.vm.$emit('file-success', { response: { value: 'https://cdn.test/b.png' }, file: done });
		upload.vm.$emit('complete', { result: {} });
		await nextTick();
		await nextTick();
		expect(value.value).toBe('https://cdn.test/a.png,https://cdn.test/b.png');
		// 字符串回写后，上传时得到的名称仍在
		expect(wrapper.findAll('.vc-file-tile').map(i => i.attributes('title'))).toEqual(['a.png', '上传的名字.png']);
		const first = wrapper.find('.vc-file-tile').element;

		// 上传中外层改值：上传中的项留在原位，同地址的项不重新挂载
		upload.vm.$emit('file-start', { file: { uploadId: 'r-pending', name: 'c.png', percent: 0 } });
		await nextTick();
		value.value = 'https://cdn.test/a.png';
		await nextTick();
		expect(wrapper.findAll('.vc-file-tile').map(i => i.attributes('title'))).toEqual(['a.png', 'c.png']);
		expect(wrapper.find('.vc-file-tile').element).toBe(first);
	});

	it('does not duplicate uploading items when one type completes and v-model echoes', async () => {
		const value = ref<any[]>([]);
		const wrapper = mount(() => (
			<UploadPicker v-model={value.value} picker={['image', 'file']} />
		));
		const [image, file] = uploadersOf(wrapper);
		image.vm.$emit('file-start', { file: { uploadId: 'e-image', name: 'a.png', percent: 0 } });
		file.vm.$emit('file-start', { file: { uploadId: 'e-file', name: 'b.pdf', percent: 0 } });
		image.vm.$emit('file-success', { response: { value: '/a.png' }, file: { uploadId: 'e-image', name: 'a.png' } });
		image.vm.$emit('complete', { result: {} });
		await nextTick();
		await nextTick();
		expect(wrapper.findAll('.vc-upload-picker__item')).toHaveLength(2);
		file.vm.$emit('file-success', { response: { value: '/b.pdf' }, file: { uploadId: 'e-file', name: 'b.pdf' } });
		file.vm.$emit('complete', { result: {} });
		await nextTick();
		await nextTick();
		expect(value.value.map(i => i.value)).toEqual(['/a.png', '/b.pdf']);
		expect(wrapper.findAll('.vc-upload-picker__item')).toHaveLength(2);
	});

	it('accepts files dropped on the desktop entry and distributes them by type', async () => {
		const wrapper = mount(UploadPicker, { props: { picker: ['image', 'file'] } });
		const [image, file] = uploadersOf(wrapper);
		const uploadImages = vi.fn();
		const uploadDocs = vi.fn();
		image.vm.$.exposed.uploadFiles = uploadImages;
		file.vm.$.exposed.uploadFiles = uploadDocs;
		const photo = new File(['x'], 'a.png', { type: 'image/png' });
		const doc = new File(['x'], 'a.pdf', { type: 'application/pdf' });
		await wrapper.find('.vc-upload-picker__trigger').trigger('drop', { dataTransfer: { files: [photo, doc] } });
		expect(uploadImages).toHaveBeenCalledWith([photo]);
		expect(uploadDocs).toHaveBeenCalledWith([doc]);
	});

	it('hides retry when the failed item has no original file', async () => {
		for (const Component of [UploadPicker, MUploadPicker]) {
			const wrapper = mount(Component, { props: { modelValue: [], picker: ['file'] } });
			await fail(uploadersOf(wrapper, Component === MUploadPicker)[0], { uploadId: 'no-target', name: 'a.pdf', percent: 0 });
			expect(wrapper.find('.is-error').exists()).toBe(true);
			expect(wrapper.find('.vc-upload-picker__retry').exists()).toBe(false);
			wrapper.unmount();
		}
	});

	it('keeps failed upload internally and excludes it from model value', async () => {
		for (const Component of [UploadPicker, MUploadPicker]) {
			const wrapper = mount(Component, {
				props: { modelValue: [], picker: ['audio'] }
			});
			const upload = uploadersOf(wrapper, Component === MUploadPicker)[0];
			const vFile = { uploadId: 'upload-error', name: 'broken.mp3', percent: 0 };

			const result = { total: 1, completed: 1, succeeded: 0, failed: 1, responses: [], queues: [] };
			upload.vm.$emit('file-start', { file: vFile });
			upload.vm.$emit('file-error', {
				stage: 'upload',
				cause: {},
				message: '上传失败',
				file: vFile,
				result
			});
			upload.vm.$emit('error', { cause: { message: '上传异常' } });
			upload.vm.$emit('complete', { result });
			await nextTick();

			const item = wrapper.find('.vc-upload-picker__item.is-audio');
			expect(item.classes()).toContain('is-error');
			expect(item.text()).toContain('上传失败');
			expect(wrapper.emitted('file-error')?.[0][0]).toEqual({
				stage: 'upload',
				cause: {},
				message: '上传失败',
				file: vFile,
				result,
				type: 'audio'
			});
			expect(wrapper.emitted('error')?.[0][0]).toEqual({
				cause: { message: '上传异常' },
				type: 'audio'
			});
			expect(wrapper.emitted('complete')?.[0][0]).toEqual({ result, type: 'audio' });
			expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([]);
			wrapper.unmount();
		}
	});

	it('ignores unsupported picker values at runtime', () => {
		const wrapper = mount(UploadPicker, {
			props: {
				modelValue: [files[0]],
				picker: ['unknown', 'image'] as any
			}
		});

		expect(wrapper.find('.vc-file-tile.is-image').exists()).toBe(true);
		expect(uploadersOf(wrapper)).toHaveLength(1);
	});

	it('deletes items after remove-before and exposes reset', async () => {
		const onRemoveBefore = vi.fn(async () => {});
		const wrapper = mount(UploadPicker, {
			props: { modelValue: [files[0], files[3]], picker: ['image', 'file'], onRemoveBefore }
		});

		await wrapper.find('.vc-file-row .vc-upload-picker__delete').trigger('click');
		expect(onRemoveBefore).toHaveBeenCalledWith(1, 'file');
		expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([expect.objectContaining({ value: files[0].value })]);

		(wrapper.vm as any).reset([files[3]]);
		await nextTick();
		expect(wrapper.find('.vc-file-row.is-file').exists()).toBe(true);
	});

	it('deletes every item type on desktop and mobile', async () => {
		for (const Component of [UploadPicker, MUploadPicker]) {
			const wrapper = mount(Component, {
				props: { modelValue: files, picker: ALL }
			});

			for (let i = 0; i < files.length; i++) {
				await wrapper.find('.vc-upload-picker__delete').trigger('click');
			}
			expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([]);
		}
	});

	it('exposes add, remove and reset', async () => {
		const wrapper = mount(UploadPicker, {
			props: { modelValue: [], picker: ALL }
		});

		(wrapper.vm as any).add(files);
		await nextTick();
		expect(wrapper.findAll('.vc-upload-picker__item')).toHaveLength(4);

		await (wrapper.vm as any).remove(1);
		await nextTick();
		expect(wrapper.find('.vc-file-tile.is-video').exists()).toBe(false);

		(wrapper.vm as any).reset([files[3]]);
		await nextTick();
		expect(wrapper.findAll('.vc-upload-picker__item')).toHaveLength(1);
		expect(() => (wrapper.vm as any).reset('invalid')).toThrow('reset参数要为字符串数组');
	});

	it('runs file-before with the type', async () => {
		const onFileBefore = vi.fn<UploadPickerCallback['onFileBefore']>(() => false);
		const wrapper = mount(UploadPicker, {
			props: { modelValue: [], onFileBefore }
		});
		const rawFile = new File(['image'], 'before.jpg', { type: 'image/jpeg' });
		const vFile = {
			uploadId: 'before-image',
			current: 1,
			total: 1,
			percent: 0,
			size: rawFile.size,
			name: rawFile.name,
			target: rawFile
		};

		const upload = uploadersOf(wrapper)[0];
		const payload = { file: vFile, rawFiles: [rawFile] };
		const onBefore = Reflect.get(
			upload.vm.$.vnode.props || {},
			'onFileBefore'
		) as UploadCallback['onFileBefore'] | undefined;
		if (!onBefore) throw new Error('UploadPicker 未绑定 onFileBefore');
		const processed = await onBefore(payload);

		expect(processed).toBe(false);
		expect(onFileBefore).toHaveBeenCalledWith({ ...payload, type: 'image' });
	});

	it('derives labels with getFileName and keeps explicit labels', () => {
		const wrapper = mount(UploadPicker, {
			props: {
				modelValue: ['https://cdn.test/a%20b.pdf?x=1', { value: 'https://cdn.test/c.pdf', label: '自定义.pdf' }],
				picker: ['file']
			}
		});
		expect(wrapper.findAll('.vc-file-row__name').map(i => i.text())).toEqual(['a b.pdf', '自定义.pdf']);

		VcInstance.options.FilePreview!.getFileName = ({ source }) => `name:${source.split('/').pop()}`;
		try {
			const configured = mount(UploadPicker, {
				props: { modelValue: ['https://cdn.test/download'], picker: ['file'] }
			});
			expect(configured.find('.vc-file-row__name').text()).toBe('name:download');
		} finally {
			VcInstance.options.FilePreview!.getFileName = undefined;
		}
	});

	it('preserves string and single-object model shapes', async () => {
		const stringWrapper = mount(UploadPicker, {
			props: { modelValue: 'a.mp3,b.mp3', picker: ['audio'], output: 'string' }
		});
		await stringWrapper.findAll('.vc-upload-picker__delete')[0].trigger('click');
		expect(stringWrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBe('b.mp3');

		const objectWrapper = mount(UploadPicker, {
			props: { modelValue: files[0], picker: ['image'], max: 1 }
		});
		await objectWrapper.find('.vc-upload-picker__delete').trigger('click');
		expect(objectWrapper.emitted('update:modelValue')?.at(-1)?.[0]).toBeNull();
	});
});
