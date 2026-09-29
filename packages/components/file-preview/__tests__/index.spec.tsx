// @vitest-environment jsdom

import { FilePreview, ImagePreview, MFilePreview, MImagePreview } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import { VcInstance } from '../../vc';
import { getFileName, getFileType, normalize, resolveFileName, resolveFileType } from '../utils';
import { VideoPreview } from '../preview/video';
import { AudioPreview } from '../preview/audio';

const photo = 'https://cdn.test/photo.jpg';
const banner = 'https://cdn.test/banner.png';
const movie = 'https://cdn.test/movie.mp4';
const sound = 'https://cdn.test/sound.mp3';
const report = 'https://cdn.test/report.pdf';

const lightbox = vi.hoisted(() => ({ init: vi.fn(), loadAndOpen: vi.fn() }));
vi.mock('photoswipe/lightbox', () => ({
	default: vi.fn(function (this: any) {
		Object.assign(this, lightbox);
	})
}));

afterEach(() => {
	VcInstance.options.FilePreview = { getFileType: undefined, getFileName: undefined, enhancer: undefined };
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('FilePreview', () => {
	it('exports the component, ImagePreview and mobile aliases', () => {
		expect(typeof FilePreview).toBe('object');
		expect(typeof FilePreview.open).toBe('function');
		expect(typeof ImagePreview.open).toBe('function');
		expect(MFilePreview).toBe(FilePreview);
		expect(MImagePreview).toBe(ImagePreview);

		const wrapper = mount(() => (<FilePreview />));
		expect(wrapper.classes()).toContain('vc-file-preview');
	});

	it('recognizes normal and query-string URLs', () => {
		expect(getFileType('PHOTO.HEIC?x=1')).toBe('image');
		expect(getFileType('movie.mov#time=2')).toBe('video');
		expect(getFileType('sound.m4a')).toBe('audio');
		expect(getFileType('archive.zip')).toBe('file');
	});

	it('resolves file types through the global getFileType first', () => {
		const oss = 'https://cdn.test/photo.jpg!4-4';
		expect(resolveFileType(oss)).toBe('file');

		VcInstance.options.FilePreview!.getFileType = v => (/\.jpg!/.test(v) ? 'image' : undefined);
		expect(resolveFileType(oss)).toBe('image');
		expect(resolveFileType(movie)).toBe('video');

		VcInstance.options.FilePreview!.getFileType = () => 'pdf' as any;
		expect(resolveFileType(report)).toBe('file');
	});

	it('gets decoded file names without query and hash', () => {
		expect(getFileName('https://cdn.test/a/%E5%90%88%E5%90%8C.pdf?x=1#y')).toBe('合同.pdf');
		expect(getFileName('https://cdn.test/a/%E0%A4%A.pdf')).toBe('%E0%A4%A.pdf');
		expect(getFileName('')).toBe('');
	});

	it('resolves file names through the global getFileName first', () => {
		const url = 'https://cdn.test/files/1695123_%E5%90%88%E5%90%8C.pdf?token=1';
		expect(resolveFileName(url)).toBe('1695123_合同.pdf');

		VcInstance.options.FilePreview!.getFileName = v => getFileName(v).replace(/^\d+_/, '');
		expect(resolveFileName(url)).toBe('合同.pdf');
		expect(normalize([url, { source: url, name: 'explicit.pdf' }]).map(i => i.name)).toEqual(['合同.pdf', 'explicit.pdf']);

		VcInstance.options.FilePreview!.getFileName = () => '';
		expect(resolveFileName(report)).toBe('report.pdf');
		VcInstance.options.FilePreview!.getFileName = () => 1 as any;
		expect(resolveFileName(report)).toBe('report.pdf');
	});

	it('normalizes strings, arrays and objects', () => {
		expect(normalize(` ${photo}, ,${report}`)).toEqual([
			{ source: photo, type: 'image', name: 'photo.jpg' },
			{ source: report, type: 'file', name: 'report.pdf' }
		]);

		expect(normalize([
			movie,
			{ source: sound, name: '会议录音', id: 1 },
			{ source: 'https://cdn.test/cover', type: 'image', thumbnail: banner },
			{ source: report, type: 'pdf' as any },
			{ name: 'no-source' } as any,
			null as any
		])).toEqual([
			{ source: movie, type: 'video', name: 'movie.mp4' },
			{ source: sound, type: 'audio', name: '会议录音', id: 1 },
			{ source: 'https://cdn.test/cover', type: 'image', name: 'cover', thumbnail: banner },
			{ source: report, type: 'file', name: 'report.pdf' }
		]);

		expect(normalize()).toEqual([]);
		expect(normalize({} as any)).toEqual([]);
	});

	it('opens images with only image items and the matching index', async () => {
		const open = vi.spyOn(ImagePreview, 'open').mockResolvedValue(undefined);

		await FilePreview.open({ data: [photo, report, banner], current: 2 });
		expect(open).toHaveBeenCalledWith({ current: 1, data: [photo, banner] });
	});

	it('opens video, audio and file previews by type', async () => {
		const videoPopup = vi.spyOn(VideoPreview, 'popup').mockReturnValue({} as any);
		const audioPopup = vi.spyOn(AudioPreview, 'popup').mockReturnValue({} as any);
		const windowOpen = vi.spyOn(window, 'open').mockReturnValue(null);
		const data = [movie, sound, report];

		await FilePreview.open({ data, current: 0 });
		await FilePreview.open({ data, current: 1 });
		await FilePreview.open({ data, current: 2 });
		await FilePreview.open({ data, current: 3 });
		await FilePreview.open({ data: [] });

		expect(videoPopup).toHaveBeenCalledWith({ src: movie });
		expect(audioPopup).toHaveBeenCalledWith({ src: sound });
		expect(windowOpen).toHaveBeenCalledTimes(1);
		expect(windowOpen).toHaveBeenCalledWith(report, '_blank', 'noopener');
	});

	it('lets the global enhancer take over before the built-in preview', async () => {
		const open = vi.spyOn(ImagePreview, 'open').mockResolvedValue(undefined);
		const instance = {} as any;
		const enhancer = vi.fn(() => true);
		VcInstance.options.FilePreview!.enhancer = enhancer;

		await FilePreview.open({ data: [report, photo], current: 1, instance });
		expect(enhancer).toHaveBeenCalledWith({
			current: 1,
			data: [
				{ source: report, type: 'file', name: 'report.pdf' },
				{ source: photo, type: 'image', name: 'photo.jpg' }
			],
			instance
		});
		expect(open).not.toHaveBeenCalled();

		VcInstance.options.FilePreview!.enhancer = () => Promise.resolve(true);
		await FilePreview.open({ data: [photo] });
		expect(open).not.toHaveBeenCalled();

		VcInstance.options.FilePreview!.enhancer = () => false;
		await FilePreview.open({ data: [photo] });
		VcInstance.options.FilePreview!.enhancer = () => Promise.resolve();
		await FilePreview.open({ data: [photo] });
		expect(open).toHaveBeenCalledTimes(2);
		expect(open).toHaveBeenLastCalledWith({ current: 0, data: [photo] });
	});

	it('opens photoswipe with fitted sizes', async () => {
		class FakeImage {
			naturalWidth = 0;
			naturalHeight = 0;
			onload: any;
			onerror: any;
			set src(v: string) {
				setTimeout(() => {
					const size = v.match(/(\d+)x(\d+)/);
					if (!size) return this.onerror();
					[this.naturalWidth, this.naturalHeight] = [Number(size[1]), Number(size[2])];
					this.onload();
				});
			}
		}
		vi.stubGlobal('Image', FakeImage);
		const onClose = vi.fn();

		await ImagePreview.open({
			current: 1,
			onClose,
			data: [
				'https://cdn.test/200x100.jpg',
				{ source: 'https://cdn.test/100x200.jpg', title: 'b' },
				{ value: 'https://cdn.test/broken.jpg' },
				{ src: 'https://cdn.test/c.jpg', width: 10, height: 20 }
			]
		});

		expect(PhotoSwipeLightbox).toHaveBeenCalledWith(expect.objectContaining({ onClose, initialZoomLevel: 'fit' }));
		const options = vi.mocked(PhotoSwipeLightbox).mock.calls.at(-1)![0] as any;
		expect(typeof (await options.pswpModule()).default).toBe('function');
		expect(lightbox.init).toHaveBeenCalled();
		const [current, data] = lightbox.loadAndOpen.mock.calls.at(-1)!;
		expect(current).toBe(1);
		expect(data).toEqual([
			{ src: 'https://cdn.test/200x100.jpg', width: 200, height: 100 },
			{ source: 'https://cdn.test/100x200.jpg', title: 'b', src: 'https://cdn.test/100x200.jpg', width: 100, height: 200 },
			{ value: 'https://cdn.test/broken.jpg', src: 'https://cdn.test/broken.jpg' },
			{ src: 'https://cdn.test/c.jpg', width: 10, height: 20 }
		]);

		await ImagePreview.open({ data: ['https://cdn.test/1x1.jpg'] });
		expect(lightbox.loadAndOpen.mock.calls.at(-1)![0]).toBe(0);
	});

	it('renders and closes video and audio preview views', async () => {
		const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
		const video = mount(VideoPreview.wrapper as any, { props: { src: movie } });
		const audio = mount(AudioPreview.wrapper as any, { props: { src: sound } });
		await nextTick();

		expect(video.find('video').attributes('src')).toBe(movie);
		expect(audio.find('audio').attributes('src')).toBe(sound);
		await video.find('.vc-video-preview__close').trigger('click');
		await audio.find('.vc-audio-preview__close').trigger('click');
		expect(pause).toHaveBeenCalledTimes(2);

		const reopened = mount(VideoPreview.wrapper as any, { props: { src: movie } });
		await nextTick();
		reopened.findComponent({ name: 'vc-popup' }).vm.$emit('update:modelValue', false);
		await nextTick();
		expect(pause).toHaveBeenCalledTimes(3);

		video.findComponent({ name: 'vc-popup' }).vm.$emit('close');
		audio.findComponent({ name: 'vc-popup' }).vm.$emit('close');
		expect(video.emitted('portal-fulfilled')).toHaveLength(1);
		expect(audio.emitted('portal-fulfilled')).toHaveLength(1);
	});
});
