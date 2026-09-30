// @vitest-environment jsdom

import { FilePreview, ImagePreview, MFilePreview, MImagePreview } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { zhCN, enUS } from '@deot/vc-locale';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import { VcInstance } from '../../vc';
import { getFileExtension, getFileName, getFileType, normalize, resolveFileName, resolveFileType } from '../utils';
import { VideoPreview } from '../preview/video';
import { AudioPreview } from '../preview/audio';

const photo = 'https://cdn.test/photo.jpg';
const banner = 'https://cdn.test/banner.png';
const movie = 'https://cdn.test/movie.mp4';
const sound = 'https://cdn.test/sound.mp3';
const report = 'https://cdn.test/report.pdf';
const readme = 'https://cdn.test/readme';

const lightbox = vi.hoisted(() => ({ init: vi.fn(), loadAndOpen: vi.fn() }));
vi.mock('photoswipe/lightbox', () => ({
	default: vi.fn(function (this: any) {
		Object.assign(this, lightbox);
	})
}));

const kindOf = (el: Element) => el.className.match(/is-(image|video|audio|file)/)![1];

afterEach(() => {
	VcInstance.configure({ locale: zhCN });
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

	it('gets upper-case file extensions', () => {
		expect(getFileExtension('合同.pdf?x=1')).toBe('PDF');
		expect(getFileExtension('https://cdn.test/a.b/report.xlsx#page')).toBe('XLSX');
		expect(getFileExtension('photo.jpg!4-4')).toBe('');
		expect(getFileExtension('')).toBe('');
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

	it('renders mix items in data order with thumbnails for images', async () => {
		const wrapper = mount(FilePreview, {
			props: {
				data: [
					{ source: photo, thumbnail: banner },
					report,
					{ source: movie, thumbnail: banner },
					sound,
					'https://cdn.test/clip.mov'
				]
			}
		});
		const root = wrapper.find('.vc-file-preview');
		expect(root.classes()).toEqual(expect.arrayContaining(['is-mix', 'is-medium']));
		expect(root.classes()).not.toContain('is-vertical');
		expect(wrapper.findAll('.vc-file-preview__group')).toHaveLength(0);
		expect(wrapper.findAll('.vc-file-preview__square')).toHaveLength(0);

		const items = wrapper.findAll('.vc-file-preview__item');
		expect(items.map(i => kindOf(i.element))).toEqual(['image', 'file', 'video', 'audio', 'video']);
		expect(items.map(i => i.attributes('title'))).toEqual(['photo.jpg', 'report.pdf', 'movie.mp4', 'sound.mp3', 'clip.mov']);
		expect(items.every(i => i.classes('is-previewable'))).toBe(true);
		expect(wrapper.findAll('.vc-file-preview__card')).toHaveLength(5);
		expect(wrapper.findAll('.vc-file-preview__extension')).toHaveLength(0);
		expect(wrapper.findAll('.vc-file-preview__dot')).toHaveLength(0);

		const images = wrapper.findAllComponents({ name: 'vc-image' });
		expect(images.map(i => [i.props('src'), i.props('thumbnail'), i.props('previewable')])).toEqual([
			[photo, banner, false],
			[banner, undefined, false]
		]);

		await wrapper.setProps({ size: 'large', vertical: true, data: report });
		expect(root.classes()).toEqual(expect.arrayContaining(['is-large', 'is-vertical']));
		expect(wrapper.findAll('.vc-file-preview__item')).toHaveLength(1);
	});

	it('renders group items by file type with squares, dots and extensions', () => {
		const wrapper = mount(FilePreview, {
			props: {
				type: 'group',
				size: 'mini',
				data: [
					report,
					photo,
					sound,
					movie,
					{ source: readme, type: 'file' },
					banner,
					{ source: 'https://cdn.test/cover.mp4', thumbnail: banner }
				]
			}
		});
		expect(wrapper.find('.vc-file-preview').classes()).toEqual(expect.arrayContaining(['is-group', 'is-mini']));

		const groups = wrapper.findAll('.vc-file-preview__group');
		expect(groups.map(g => kindOf(g.element))).toEqual(['image', 'video', 'audio', 'file']);
		expect(groups.map(g => g.findAll('.vc-file-preview__item').length)).toEqual([2, 2, 1, 2]);

		expect(groups[0].findAll('.vc-file-preview__square')).toHaveLength(2);
		expect(groups[0].findAll('.vc-file-preview__play')).toHaveLength(0);
		expect(groups[1].findAll('.vc-file-preview__square')).toHaveLength(2);
		expect(groups[1].findAll('.vc-file-preview__play')).toHaveLength(2);
		expect(groups[1].find('video').attributes()).toEqual(expect.objectContaining({ src: movie, preload: 'metadata' }));
		expect(groups[1].findComponent({ name: 'vc-image' }).props('src')).toBe(banner);
		expect(groups[2].findAll('.vc-file-preview__dot')).toHaveLength(1);
		expect(groups[3].findAll('.vc-file-preview__extension').map(i => i.text())).toEqual(['PDF']);
		expect(groups[3].findAll('.vc-file-preview__name').map(i => i.text())).toEqual(['report.pdf', 'readme']);
	});

	it('keeps the original data index when previewing grouped items', async () => {
		const open = vi.spyOn(ImagePreview, 'open').mockResolvedValue(undefined);
		const windowOpen = vi.spyOn(window, 'open').mockReturnValue(null);
		const wrapper = mount(FilePreview, {
			props: { type: 'group', data: [photo, report, banner] }
		});

		await wrapper.findAll('.vc-file-preview__item')[1].trigger('click');
		expect(open).toHaveBeenCalledWith({ current: 1, data: [photo, banner] });

		await wrapper.findAll('.vc-file-preview__item')[2].trigger('click');
		expect(windowOpen).toHaveBeenCalledWith(report, '_blank', 'noopener');
	});

	it('passes the component instance to the enhancer', async () => {
		const enhancer = vi.fn(() => true);
		VcInstance.options.FilePreview!.enhancer = enhancer;
		const wrapper = mount(FilePreview, { props: { data: [report, photo] } });

		await wrapper.findAll('.vc-file-preview__item')[1].trigger('click');
		expect(enhancer).toHaveBeenCalledWith(expect.objectContaining({
			current: 1,
			instance: wrapper.vm.$
		}));
	});

	it('does not preview when previewable is false', async () => {
		const open = vi.spyOn(ImagePreview, 'open').mockResolvedValue(undefined);
		const wrapper = mount(FilePreview, { props: { data: [photo], previewable: false } });
		const item = wrapper.find('.vc-file-preview__item');

		expect(item.classes()).not.toContain('is-previewable');
		await item.trigger('click');
		expect(open).not.toHaveBeenCalled();
	});

	it('hands preview to the default slot instead of binding clicks', async () => {
		const open = vi.spyOn(ImagePreview, 'open').mockResolvedValue(undefined);
		const enhancer = vi.fn(() => false);
		VcInstance.options.FilePreview!.enhancer = enhancer;
		const scopes: any[] = [];
		const data = ref<any[]>([report, photo]);
		const wrapper = mount(() => (
			<FilePreview data={data.value} previewable={false}>
				{{
					default: (scope: any) => {
						scopes.push(scope);
						return <button class="custom" onClick={scope.preview}>{scope.row.name}</button>;
					}
				}}
			</FilePreview>
		));

		expect(wrapper.findAll('.custom').map(i => i.text())).toEqual(['report.pdf', 'photo.jpg']);
		expect(wrapper.findAll('.vc-file-preview__card')).toHaveLength(0);
		expect(wrapper.findAll('.vc-file-preview__item.is-previewable')).toHaveLength(0);
		expect(scopes[1]).toEqual(expect.objectContaining({ index: 1, row: expect.objectContaining({ type: 'image', source: photo }) }));

		await wrapper.findAll('.vc-file-preview__item')[1].trigger('click');
		expect(enhancer).not.toHaveBeenCalled();

		await wrapper.findAll('.custom')[1].trigger('click');
		await nextTick();
		expect(enhancer).toHaveBeenCalledWith(expect.objectContaining({ current: 1 }));
		expect(open).toHaveBeenCalledWith({ current: 0, data: [photo] });

		data.value = [movie];
		await nextTick();
		expect(wrapper.findAll('.custom').map(i => i.text())).toEqual(['movie.mp4']);
	});

	it('validates type and size', () => {
		const { type, size } = (FilePreview as any).props;
		expect(['mix', 'group'].map(type.validator)).toEqual([true, true]);
		expect(type.validator('image')).toBe(false);
		expect(['mini', 'small', 'medium', 'large'].map(size.validator)).toEqual([true, true, true, true]);
		expect(size.validator('default')).toBe(false);
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

	it('uses the current locale for each image preview and preserves explicit overrides', async () => {
		const data = [{ src: photo, width: 100, height: 100 }];
		await ImagePreview.open({ data });
		expect(PhotoSwipeLightbox).toHaveBeenLastCalledWith(expect.objectContaining({
			closeTitle: '关闭(Esc)', zoomTitle: '缩放', arrowPrevTitle: '上一张',
			arrowNextTitle: '下一张', errorMsg: '网络异常 图片加载失败'
		}));

		VcInstance.configure({ locale: enUS });
		await ImagePreview.open({ data });
		expect(PhotoSwipeLightbox).toHaveBeenLastCalledWith(expect.objectContaining({
			closeTitle: 'Close (Esc)', zoomTitle: 'Zoom', arrowPrevTitle: 'Previous image',
			arrowNextTitle: 'Next image', errorMsg: 'Failed to load image'
		}));

		await ImagePreview.open({ data, closeTitle: '', zoomTitle: 'Custom zoom', errorMsg: '' });
		expect(PhotoSwipeLightbox).toHaveBeenLastCalledWith(expect.objectContaining({
			closeTitle: '', zoomTitle: 'Custom zoom', errorMsg: ''
		}));
	});

	it('updates media close button labels when the locale changes', async () => {
		const video = mount(VideoPreview.wrapper as any, { props: { src: movie } });
		const audio = mount(AudioPreview.wrapper as any, { props: { src: sound } });
		await nextTick();
		for (const wrapper of [video, audio]) {
			expect(wrapper.find('button').attributes('aria-label')).toBe('关闭');
			expect(wrapper.find('button').attributes('type')).toBe('button');
		}

		VcInstance.configure({ locale: enUS });
		await nextTick();
		for (const wrapper of [video, audio]) {
			expect(wrapper.find('button').attributes('aria-label')).toBe('Close');
			wrapper.unmount();
		}
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
