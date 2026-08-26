// @vitest-environment jsdom

import { ImagePreview, MUploadPicker, Upload, UploadPicker } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { getAvailableIndex, getAvailableValues, getFileType } from '../utils';
import type { PickerType } from '../types';
import { VideoPreview } from '../preview/video';
import { AudioPreview } from '../preview/audio';
import { ImageItem } from '../item/image';
import { VideoItem } from '../item/video';
import { AudioItem } from '../item/audio';
import { FileItem } from '../item/file';
import { MImageItem } from '../mobile/item/image';
import { MVideoItem } from '../mobile/item/video';
import { MAudioItem } from '../mobile/item/audio';
import { MFileItem } from '../mobile/item/file';

const files = [
	{ type: 'image', label: 'photo.jpg', value: 'https://cdn.test/photo.jpg' },
	{ type: 'video', label: 'movie.mp4', value: 'https://cdn.test/movie.mp4' },
	{ type: 'audio', label: 'sound.mp3', value: 'https://cdn.test/sound.mp3' },
	{ type: 'file', label: 'report.pdf', value: 'https://cdn.test/report.pdf' }
];

describe('UploadPicker', () => {
	it('exports desktop and mobile components', () => {
		expect(typeof UploadPicker).toBe('object');
		expect(typeof MUploadPicker).toBe('object');
	});

	it('keeps image as the default picker and preserves image model updates', async () => {
		const wrapper = mount(UploadPicker, {
			props: { modelValue: [files[0]] }
		});

		expect(wrapper.findComponent({ name: 'vc-image' }).props('src')).toContain('photo.jpg');
		expect(wrapper.find('input[type="file"]').attributes('accept')).toBe('image/*');
		expect(wrapper.find('.vc-upload-picker__box').text()).toBe('上传');

		await wrapper.find('.vc-upload-picker__delete').trigger('click');
		expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([]);
	});

	it('renders all item types and upload accepts', () => {
		const wrapper = mount(UploadPicker, {
			props: {
				modelValue: files,
				picker: ['image', 'video', 'audio', 'file']
			}
		});

		expect(wrapper.find('.vc-upload-image-item').exists()).toBe(true);
		expect(wrapper.find('.vc-upload-picker-video-item video').attributes('src')).toContain('movie.mp4');
		expect(wrapper.find('.vc-upload-picker-audio-item audio').attributes('src')).toContain('sound.mp3');
		expect(wrapper.find('.vc-upload-picker-file-item__title').text()).toBe('report.pdf');
		expect(wrapper.findAll('input[type="file"]').map(i => i.attributes('accept'))).toEqual([
			'image/*',
			'video/*',
			'audio/*',
			expect.stringContaining('application/pdf')
		]);
		expect(wrapper.findAll('button').map(i => i.attributes('aria-label'))).toEqual(['预览视频', '预览音频']);
	});

	it('opens desktop and mobile media previews', async () => {
		const videoPopup = vi.spyOn(VideoPreview, 'popup').mockReturnValue({} as any);
		const audioPopup = vi.spyOn(AudioPreview, 'popup').mockReturnValue({} as any);

		for (const Component of [UploadPicker, MUploadPicker]) {
			const wrapper = mount(Component, {
				props: { modelValue: [files[1], files[2]], picker: ['video', 'audio'] }
			});

			await wrapper.find('button[aria-label="预览视频"]').trigger('click');
			await wrapper.find('button[aria-label="预览音频"]').trigger('click');
		}

		expect(videoPopup).toHaveBeenCalledTimes(2);
		expect(videoPopup).toHaveBeenLastCalledWith({ src: files[1].value });
		expect(audioPopup).toHaveBeenCalledTimes(2);
		expect(audioPopup).toHaveBeenLastCalledWith({ src: files[2].value });
		videoPopup.mockRestore();
		audioPopup.mockRestore();
	});

	it('renders and closes video and audio preview views', async () => {
		const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
		const video = mount(VideoPreview.wrapper as any, { props: { src: files[1].value } });
		const audio = mount(AudioPreview.wrapper as any, { props: { src: files[2].value } });
		await nextTick();

		expect(video.find('video').attributes('src')).toBe(files[1].value);
		expect(audio.find('audio').attributes('src')).toBe(files[2].value);
		await video.find('.vc-video-preview__close').trigger('click');
		await audio.find('.vc-audio-preview__close').trigger('click');
		expect(pause).toHaveBeenCalledTimes(2);

		video.findComponent({ name: 'vc-popup' }).vm.$emit('close');
		audio.findComponent({ name: 'vc-popup' }).vm.$emit('close');
		expect(video.emitted('portal-fulfilled')).toHaveLength(1);
		expect(audio.emitted('portal-fulfilled')).toHaveLength(1);
		pause.mockRestore();
	});

	it('previews desktop and mobile images with filtered data', () => {
		const open = vi.spyOn(ImagePreview, 'open').mockReturnValue({} as any);
		const data = [files[0], { ...files[0], value: '', errorFlag: true }];

		for (const Component of [ImageItem, MImageItem]) {
			const wrapper = mount(Component, {
				props: {
					row: data[0],
					data,
					index: 0,
					keyValue: { label: 'label', value: 'value' },
					imagePreviewOptions: { enhancer: () => false }
				}
			});
			const image = wrapper.findComponent({ name: 'vc-image' });
			(image.vm.$.vnode.props as any).onClick(new MouseEvent('click'));
		}

		expect(open).toHaveBeenCalledTimes(2);
		expect(open).toHaveBeenLastCalledWith(expect.objectContaining({
			current: 0,
			data: [files[0].value]
		}));
		open.mockRestore();
	});

	it('provides safe item defaults and unavailable indexes', () => {
		for (const Component of [
			ImageItem,
			VideoItem,
			AudioItem,
			FileItem,
			MImageItem,
			MVideoItem,
			MAudioItem,
			MFileItem
		]) {
			const wrapper = mount(Component, {
				props: { keyValue: { label: 'label', value: 'value' } },
				slots: { default: ({ current }) => <span class="current">{current}</span> }
			});
			expect(wrapper.find('.current').text()).toBe('-1');
		}

		const row = { value: '/same.jpg' };
		expect(getAvailableIndex(row, [row], 'invalid', 'value')).toBe(0);
		expect(getAvailableValues([row, { value: '/failed.jpg', errorFlag: true }], 'value')).toEqual(['/same.jpg']);
	});

	it('uses mobile classes and mobile upload button', () => {
		const wrapper = mount(MUploadPicker, {
			props: {
				modelValue: files,
				picker: ['image', 'video', 'audio', 'file']
			}
		});

		expect(wrapper.classes()).toContain('vcm-upload-picker');
		expect(wrapper.find('.vcm-upload-image-item').exists()).toBe(true);
		expect(wrapper.find('.vcm-upload-picker-video-item').exists()).toBe(true);
		expect(wrapper.find('.vcm-upload-picker-audio-item').exists()).toBe(true);
		expect(wrapper.find('.vcm-upload-picker-file-item').exists()).toBe(true);
		expect(wrapper.find('.vcm-upload-picker__box').text()).toBe('');
	});

	it('supports custom item and upload slots', () => {
		const wrapper = mount(UploadPicker, {
			props: {
				modelValue: [files[1]],
				picker: ['video']
			},
			slots: {
				default: ({ row, type, index, typeIndex }) => (
					<div class="custom-item">{`${type}:${row.label}:${index}:${typeIndex}`}</div>
				),
				upload: ({ type }) => (
					<button class="custom-upload">
						选择
						{type}
					</button>
				)
			}
		});

		expect(wrapper.find('.custom-item').text()).toBe('video:movie.mp4:0:0');
		expect(wrapper.find('.custom-upload').text()).toBe('选择video');
	});

	it('distinguishes preview index from type index on desktop and mobile', async () => {
		const verify = async (Component: any) => {
			const wrapper = mount(Component, {
				props: {
					modelValue: [files[2]],
					picker: ['audio']
				},
				slots: {
					default: ({ index, typeIndex }) => (
						<div class="custom-index">{`${index}:${typeIndex}`}</div>
					)
				}
			});
			const upload = wrapper.findComponent(Upload);
			const failedFile = { uploadId: 'failed-audio', name: 'failed.mp3', percent: 0 };

			upload.vm.$emit('file-start', failedFile);
			upload.vm.$emit('file-error', {}, failedFile, { error: 1 });
			await nextTick();

			expect(wrapper.findAll('.custom-index').map(i => i.text())).toEqual(['0:0', '-1:1']);
		};

		await verify(UploadPicker);
		await verify(MUploadPicker);
	});

	it('keeps preview indexes correct for pending and duplicate values', () => {
		const wrapper = mount(UploadPicker, {
			props: {
				modelValue: [files[0], { ...files[0], label: 'photo-copy.jpg' }],
				picker: ['image']
			},
			slots: {
				default: ({ index, typeIndex }) => (
					<div class="custom-index">{`${index}:${typeIndex}`}</div>
				)
			}
		});

		expect(wrapper.findAll('.custom-index').map(i => i.text())).toEqual(['0:0', '1:1']);
	});

	it('passes every picker type to the unified desktop and mobile upload slot', () => {
		const props = {
			modelValue: [],
			picker: ['image', 'video', 'audio', 'file'] as PickerType[]
		};
		const upload = ({ type }) => <span class="custom-upload-type">{type}</span>;
		const desktop = mount(UploadPicker, { props, slots: { upload } });
		const mobile = mount(MUploadPicker, { props, slots: { upload } });
		const expected = ['image', 'video', 'audio', 'file'];

		expect(desktop.findAll('.custom-upload-type').map(i => i.text())).toEqual(expected);
		expect(mobile.findAll('.custom-upload-type').map(i => i.text())).toEqual(expected);
	});

	it('synchronizes a sorted category', async () => {
		const wrapper = mount(UploadPicker, {
			props: { modelValue: [files[1], { ...files[1], label: 'movie-2.mp4', value: '/movie-2.mp4' }], picker: ['video'], sortable: true }
		});
		const sorted = [
			{ ...files[1], label: 'movie-2.mp4', value: '/movie-2.mp4', percent: null, errorFlag: false },
			{ ...files[1], percent: null, errorFlag: false }
		];

		wrapper.findComponent({ name: 'vc-sort-list' }).vm.$emit('change', sorted);
		await nextTick();
		expect((wrapper.emitted('update:modelValue')?.at(-1)?.[0] as any[]).map(i => i.value)).toEqual([
			'/movie-2.mp4',
			'https://cdn.test/movie.mp4'
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
		const upload = wrapper.findComponent(Upload);
		const vFile = { uploadId: 'upload-1', name: 'raw.pdf', percent: 0 };

		upload.vm.$emit('file-start', vFile);
		await nextTick();
		expect(wrapper.find('.vc-upload-picker-file-item').exists()).toBe(true);

		upload.vm.$emit('file-progress', { percent: 45 }, vFile);
		await nextTick();
		expect(wrapper.find('.vc-progress').exists()).toBe(true);

		upload.vm.$emit('file-success', { url: '/formatted.pdf' }, vFile, { success: 1 });
		upload.vm.$emit('complete', { success: 1 });
		await nextTick();

		expect(formatter).toHaveBeenCalledWith({ url: '/formatted.pdf' }, vFile, 'file');
		expect(wrapper.emitted('file-success')).toHaveLength(1);
		expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([
			{ type: 'file', label: 'formatted.pdf', value: '/formatted.pdf' }
		]);
	});

	it('keeps failed upload internally and excludes it from model value', async () => {
		const verify = async (Component: any, selector: string) => {
			const wrapper = mount(Component, {
				props: { modelValue: [], picker: ['audio'] }
			});
			const upload = wrapper.findComponent(Upload);
			const vFile = { uploadId: `upload-error-${selector}`, name: 'broken.mp3', percent: 0 };

			upload.vm.$emit('file-start', vFile);
			upload.vm.$emit('file-error', {}, vFile, { error: 1 });
			upload.vm.$emit('complete', { error: 1 });
			await nextTick();

			expect(wrapper.find(selector).classes()).toContain('is-error');
			expect(wrapper.find(selector).text()).toContain('上传失败');
			expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([]);
		};

		await verify(UploadPicker, '.vc-upload-picker-audio-item');
		await verify(MUploadPicker, '.vcm-upload-picker-audio-item');
	});

	it('ignores unsupported picker values at runtime', () => {
		const wrapper = mount(UploadPicker, {
			props: {
				modelValue: [files[0]],
				picker: ['unknown', 'image'] as any
			}
		});

		expect(wrapper.find('.vc-upload-image-item').exists()).toBe(true);
		expect(wrapper.findAll('input[type="file"]')).toHaveLength(1);
	});

	it('deletes items after remove-before and exposes reset', async () => {
		const onRemoveBefore = vi.fn(async () => {});
		const wrapper = mount(UploadPicker, {
			props: { modelValue: [files[3]], picker: ['file'], onRemoveBefore }
		});

		await wrapper.find('.vc-upload-picker__delete').trigger('click');
		expect(onRemoveBefore).toHaveBeenCalledWith(0, 'file');
		expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([]);

		(wrapper.vm as any).reset([files[3]]);
		await nextTick();
		expect(wrapper.find('.vc-upload-picker-file-item').exists()).toBe(true);
	});

	it('deletes every item type on desktop and mobile', async () => {
		for (const [Component, selector] of [
			[UploadPicker, '.vc-upload-picker__delete'],
			[MUploadPicker, '.vcm-upload-picker__delete']
		] as const) {
			const wrapper = mount(Component, {
				props: { modelValue: files, picker: ['image', 'video', 'audio', 'file'] }
			});

			for (let i = 0; i < files.length; i++) {
				await wrapper.find(selector).trigger('click');
			}
			expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual([]);
		}
	});

	it('exposes add, remove and reset for all picker types', async () => {
		const wrapper = mount(UploadPicker, {
			props: { modelValue: [], picker: ['image', 'video', 'audio', 'file'] }
		});

		(wrapper.vm as any).add(files);
		await nextTick();
		expect(wrapper.findAll('.vc-upload-picker__item')).toHaveLength(4);

		await (wrapper.vm as any).remove(0, 'video');
		await nextTick();
		expect(wrapper.find('.vc-upload-picker-video-item').exists()).toBe(false);

		(wrapper.vm as any).reset([files[3]]);
		await nextTick();
		expect(wrapper.findAll('.vc-upload-picker__item')).toHaveLength(1);
		expect(() => (wrapper.vm as any).reset('invalid')).toThrow('reset参数要为字符串数组');
	});

	it('runs file-before and the desktop upload enhancer', async () => {
		const onFileBefore = vi.fn();
		const enhancer = vi.fn(() => true);
		const wrapper = mount(UploadPicker, {
			props: { modelValue: [], onFileBefore, enhancer }
		});
		const vFile = { uploadId: 'before-image', name: 'before.jpg', percent: 0 };

		wrapper.findComponent(Upload).vm.$emit('file-before', vFile, [vFile]);
		await wrapper.find('.vc-upload-picker__box').trigger('click');
		await nextTick();

		expect(onFileBefore).toHaveBeenCalledWith(vFile, [vFile], 'image');
		expect(enhancer).toHaveBeenCalledWith(expect.anything(), 'image');
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

	it('recognizes normal and query-string URLs', () => {
		expect(getFileType('PHOTO.HEIC?x=1')).toBe('image');
		expect(getFileType('movie.mov#time=2')).toBe('video');
		expect(getFileType('sound.m4a')).toBe('audio');
		expect(getFileType('archive.zip')).toBe('file');
	});
});
