// @vitest-environment jsdom

import { FilePreview, ImagePreview, MFilePreview, MImagePreview } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { h, nextTick, ref } from 'vue';
import { zhCN, enUS } from '@deot/vc-locale';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Utils } from '@deot/dev-test';
import { VcInstance } from '../../vc';
import { Portal } from '../../portal';
import { getBaseScale, zoomAt } from '../viewer/image-slide/utils';
import { ImageSlide } from '../viewer/image-slide';
import { getFileViewer, getFrameSrc, getSourceUrl } from '../viewer/file-slide/utils';
import { getFileExtension, getFileName, getFileType, normalize, resolveFileName, resolveFileType } from '../utils';

const photo = 'https://cdn.test/photo.jpg';
const banner = 'https://cdn.test/banner.png';
const movie = 'https://cdn.test/movie.mp4';
const sound = 'https://cdn.test/sound.mp3';
const report = 'https://cdn.test/report.pdf';
const readme = 'https://cdn.test/readme';

const kindOf = (el: Element) => el.className.match(/is-(image|video|audio|file)/)![1];

const activeSlide = () => document.querySelector('.vc-file-viewer__slide.is-active');
const activeMedia = () => activeSlide()?.querySelector('.vc-image-slide__media') as HTMLElement;
const reveal = () => activeSlide()?.querySelector('.vc-reveal') as HTMLElement;
const revealBody = () => reveal().querySelector('.vc-reveal__body') as HTMLElement;
const viewerEl = () => document.querySelector('.vc-file-viewer') as HTMLElement;
const isOpen = () => viewerEl().classList.contains('is-open');
const stage = () => document.querySelector('.vc-file-viewer__stage') as HTMLElement;
const button = (name: string) => document.querySelector(`.vc-file-viewer__${name}`) as HTMLButtonElement;

// 过渡结束后的更新跨越多个 Promise，等几轮微任务
const flush = async () => {
	for (let i = 0; i < 4; i++) await nextTick();
};

const endTransition = async (el: Element) => {
	el.dispatchEvent(new Event('transitionend'));
	await flush();
};

// 当前页开合动画的起点和终点：窗口的 clip-path、画面的 transform；没有进行中的动画时为 undefined
const motion = () => {
	const [clip] = reveal().getAnimations();
	const [move] = revealBody().getAnimations();
	if (!clip || !move) return;
	const keyframes = (item: Animation) => (item.effect as KeyframeEffect).getKeyframes();
	return {
		clip: keyframes(clip).map(frame => frame.clipPath),
		transform: keyframes(move).map(frame => frame.transform)
	};
};

const endMotion = async () => {
	[reveal(), revealBody()].forEach(el => el.getAnimations().forEach(item => item.finish()));
	await flush();
};

// jsdom 不加载图片：给出尺寸并派发 load，图片就位后才从缩略图放大
const load = async (img: Element, width: number, height: number) => {
	Utils.def(img, 'naturalWidth', width);
	Utils.def(img, 'naturalHeight', height);
	img.dispatchEvent(new Event('load'));
	await flush();
};

// 拿到尺寸后，下一拍渲染起点
const loadVideo = (width: number, height: number) => {
	const video = activeSlide()?.querySelector('video') as HTMLVideoElement;
	Utils.def(video, 'videoWidth', width);
	Utils.def(video, 'videoHeight', height);
	video.dispatchEvent(new Event('loadedmetadata'));
};

const pointer = (target: EventTarget, type: string, x: number, y: number, init: PointerEventInit = {}) => {
	target.dispatchEvent(new PointerEvent(type, {
		bubbles: true,
		cancelable: true,
		button: 0,
		pointerId: 1,
		pointerType: 'mouse',
		clientX: x,
		clientY: y,
		...init
	}));
};

const key = (name: string, init: KeyboardEventInit = {}) => {
	document.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true, ...init }));
};

// 挂到文档上的触发元素，位置固定
const createTrigger = (tag: string, rect: DOMRect) => {
	const el = document.createElement(tag);
	el.getBoundingClientRect = () => rect;
	document.body.append(el);
	return el;
};

const rectOf = (left: number, top: number, width: number, height: number) => ({
	x: left,
	y: top,
	left,
	top,
	width,
	height,
	right: left + width,
	bottom: top + height,
	toJSON() { return {}; }
}) as DOMRect;

// jsdom 不排版：查看器的窗口和画面铺满 1024×768，拖动时跟着舞台走
const layout = HTMLElement.prototype.getBoundingClientRect;
beforeEach(() => {
	vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
		if (!this.matches('.vc-reveal, .vc-reveal__body')) return layout.call(this);
		const [, x = 0, y = 0] = /translate3d\((-?[\d.]+)px, (-?[\d.]+)px/.exec(stage()?.style.transform || '') || [];
		return rectOf(+x, +y, window.innerWidth, window.innerHeight);
	});
});

afterEach(() => {
	Portal.clear(true);
	document.body.innerHTML = '';
	VcInstance.configure({ locale: zhCN });
	VcInstance.options.FilePreview = { getFileType: undefined, getFileName: undefined, enhancer: undefined };
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.useRealTimers();
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

		const getFileType$ = vi.fn(({ source }) => (/\.jpg!/.test(source) ? 'image' : undefined));
		VcInstance.options.FilePreview!.getFileType = getFileType$ as any;
		expect(resolveFileType(oss)).toBe('image');
		expect(getFileType$).toHaveBeenCalledWith({ source: oss });
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

		const getFileName$ = vi.fn(({ source }) => getFileName(source).replace(/^\d+_/, ''));
		VcInstance.options.FilePreview!.getFileName = getFileName$;
		expect(resolveFileName(url)).toBe('合同.pdf');
		expect(getFileName$).toHaveBeenCalledWith({ source: url });
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

	it('opens a mixed viewer at the original index', async () => {
		FilePreview.open({ data: [photo, report, banner], current: 2 });
		await nextTick();

		expect(document.querySelectorAll('.vc-file-viewer__slide')).toHaveLength(3);
		expect(activeSlide()?.getAttribute('data-index')).toBe('2');
		expect(activeSlide()?.querySelector('img')?.getAttribute('src')).toBe(banner);
		expect(document.querySelector('.vc-file-slide iframe')).toBeNull();
	});

	it('opens video, audio and file in the same viewer', async () => {
		const data = [movie, sound, report];

		FilePreview.open({ data, current: 0 });
		await nextTick();
		expect(document.querySelector('.vc-video-slide video')?.getAttribute('src')).toBe(movie);
		expect(document.querySelector('.vc-video-slide video')?.getAttribute('controlslist')).toBe('nodownload');

		Portal.clear(true);
		FilePreview.open({ data, current: 1 });
		await nextTick();
		expect(document.querySelector('.vc-audio-slide audio')?.getAttribute('src')).toBe(sound);

		Portal.clear(true);
		FilePreview.open({ data, current: 2 });
		await nextTick();
		expect(document.querySelector('.vc-file-slide__frame')?.getAttribute('src')).toBe(report);
		expect(document.querySelector('.vc-file-slide__frame')?.hasAttribute('sandbox')).toBe(false);

		// current 越界时回退到第一项
		Portal.clear(true);
		expect(FilePreview.open({ data, current: 3 })).toBeTruthy();
		await nextTick();
		expect(activeSlide()?.getAttribute('data-index')).toBe('0');

		Portal.clear(true);
		expect(FilePreview.open({ data: [] })).toBeUndefined();
		expect(document.querySelector('.vc-file-viewer')).toBeNull();
	});

	it('lets the global enhancer take over before the built-in preview', async () => {
		const instance = {} as any;
		const enhancer = vi.fn(() => true);
		VcInstance.options.FilePreview!.enhancer = enhancer;

		expect(FilePreview.open({ data: [report, photo], current: 1, instance })).toBeUndefined();
		expect(enhancer).toHaveBeenCalledWith({
			current: 1,
			data: [
				{ source: report, type: 'file', name: 'report.pdf' },
				{ source: photo, type: 'image', name: 'photo.jpg' }
			],
			instance
		});
		expect(document.querySelector('.vc-file-viewer')).toBeNull();

		VcInstance.options.FilePreview!.enhancer = () => Promise.resolve(true);
		await FilePreview.open({ data: [photo] });
		expect(document.querySelector('.vc-file-viewer')).toBeNull();

		VcInstance.options.FilePreview!.enhancer = () => false;
		const leaf = FilePreview.open({ data: [photo] }) as any;
		await nextTick();
		expect(document.querySelector('.vc-image-slide__media')?.getAttribute('src')).toBe(photo);
		leaf.destroy();

		VcInstance.options.FilePreview!.enhancer = () => Promise.resolve();
		const opened = await FilePreview.open({ data: [banner] });
		await nextTick();
		expect(document.querySelector('.vc-image-slide__media')?.getAttribute('src')).toBe(banner);
		opened?.destroy();

		// enhancer 收到的 current 已回退
		const fallback = vi.fn(() => true);
		VcInstance.options.FilePreview!.enhancer = fallback;
		FilePreview.open({ data: [photo], current: 4 });
		expect(fallback).toHaveBeenCalledWith(expect.objectContaining({ current: 0 }));

		VcInstance.options.FilePreview!.enhancer = () => Promise.resolve();
		expect(await FilePreview.open({ data: [] })).toBeUndefined();
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
		const wrapper = mount(FilePreview, {
			props: { type: 'group', data: [photo, report, banner] }
		});

		await wrapper.findAll('.vc-file-preview__item')[1].trigger('click');
		await nextTick();
		expect(activeSlide()?.getAttribute('data-index')).toBe('2');
		expect(activeSlide()?.querySelector('img')?.getAttribute('src')).toBe(banner);

		Portal.clear(true);
		await wrapper.findAll('.vc-file-preview__item')[2].trigger('click');
		await nextTick();
		expect(activeSlide()?.getAttribute('data-index')).toBe('1');
		const link = document.querySelector('.vc-file-slide__open') as HTMLAnchorElement;
		const download = document.querySelector('.vc-file-slide__download') as HTMLAnchorElement;
		expect([link.tagName, link.getAttribute('href'), link.target, link.rel]).toEqual(['A', report, '_blank', 'noopener noreferrer']);
		expect([download.getAttribute('href'), download.getAttribute('download')]).toEqual([report, 'report.pdf']);
	});

	it('passes each item\'s visible element', async () => {
		const enhancer = vi.fn(() => true);
		VcInstance.options.FilePreview!.enhancer = enhancer;
		const wrapper = mount(FilePreview, {
			props: { type: 'group', data: [photo, report, { source: movie, thumbnail: banner }, sound] }
		});
		await wrapper.findAll('.vc-file-preview__item')[0].trigger('click');
		const { data } = (enhancer.mock.calls[0] as any)[0];
		// 方格用方格，卡片用这一项
		const squares = wrapper.findAll('.vc-file-preview__square').map(i => i.element);
		const itemOf = (name: string) => wrapper.find(`.vc-file-preview__item[title="${name}"]`).element;
		expect(data.map((row: any) => row.element)).toEqual([squares[0], itemOf('report.pdf'), squares[1], itemOf('sound.mp3')]);

		// 带缩略图的卡片用缩略图
		const mix = mount(FilePreview, { props: { data: [{ source: photo, thumbnail: banner }, report] } });
		await mix.findAll('.vc-file-preview__item')[1].trigger('click');
		const thumbnail = mix.find('.vc-file-preview__thumbnail').element;
		const item = mix.findAll('.vc-file-preview__item')[1].element;
		expect((enhancer.mock.calls[1] as any)[0].data.map((row: any) => row.element)).toEqual([thumbnail, item]);
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
		const wrapper = mount(FilePreview, { props: { data: [photo], previewable: false } });
		const item = wrapper.find('.vc-file-preview__item');

		expect(item.classes()).not.toContain('is-previewable');
		await item.trigger('click');
		expect(document.querySelector('.vc-file-viewer')).toBeNull();
	});

	it('hands preview to the default slot instead of binding clicks', async () => {
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
		expect(activeSlide()?.getAttribute('data-index')).toBe('1');
		expect(activeSlide()?.querySelector('img')?.getAttribute('src')).toBe(photo);

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

	it('maps image data without html and ignores an empty list', () => {
		expect(ImagePreview.open()).toBeUndefined();
		expect(ImagePreview.open({ data: ['', { source: '' }, null as any] })).toBeUndefined();

		ImagePreview.open({
			current: 1,
			data: [
				' https://cdn.test/200x100.jpg ',
				{ source: 'https://cdn.test/100x200.jpg', title: 'b', width: 100, height: 200 },
				{ value: 'https://cdn.test/from-value.jpg' },
				{ src: 'https://cdn.test/c.jpg', width: 10, height: 20, html: '<img class="xss" src="x">' }
			]
		});

		const images = [...document.querySelectorAll('.vc-image-slide__media')].map(img => img.getAttribute('src'));
		expect(images).toContain('https://cdn.test/100x200.jpg');
		expect(images).not.toContain('https://cdn.test/c.jpg');
		expect(activeSlide()?.querySelector('img')?.getAttribute('src')).toBe('https://cdn.test/100x200.jpg');
		expect(document.querySelector('.xss')).toBeNull();
		expect(document.body.innerHTML).not.toContain('class="xss"');
	});

	it('chooses pdf and office frames and rejects unsafe urls', () => {
		expect(getFileViewer({ type: 'image', name: 'a.pdf', source: report })).toBeUndefined();
		expect(getFileViewer({ type: 'file', name: '报告.PDF', source: 'blob:https://cdn.test/id' })).toBe('pdf');
		expect(getFileViewer({ type: 'file', name: 'noext', source: 'https://cdn.test/a.docx?x=1' })).toBe('office');
		expect(getFileViewer({ type: 'file', name: 'sheet.xls', source: '' })).toBe('office');
		expect(getFileViewer({ type: 'file', name: 'readme', source: readme })).toBeUndefined();

		expect(getFrameSrc({ type: 'file', name: 'a.pdf', source: 'javascript:alert(1)' })).toBeUndefined();
		expect(getFrameSrc({ type: 'file', name: 'a.pdf', source: 'http://[' })).toBeUndefined();
		expect(getFrameSrc({ type: 'file', name: 'a.pdf', source: '' })).toBeUndefined();
		expect(getFrameSrc({ type: 'image', name: 'a.pdf', source: report })).toBeUndefined();
		expect(getFrameSrc({ type: 'file', name: 'a.pdf', source: 'blob:https://cdn.test/id' })).toBe('blob:https://cdn.test/id');
		expect(getFrameSrc({ type: 'file', name: 'a.docx', source: 'blob:https://cdn.test/id' })).toBeUndefined();

		const remote = 'https://cdn.test/a.docx';
		expect(getSourceUrl({ source: remote })).toBe(remote);
		expect(getSourceUrl({ source: 'javascript:alert(1)' })).toBeUndefined();
		expect(getFrameSrc({ type: 'file', name: 'a.docx', source: remote })).toBe(
			`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(remote)}`
		);
		const local = new URL('files/a.pptx', window.location.href).href;
		expect(getFrameSrc({ type: 'file', name: 'a.pptx', source: 'files/a.pptx' })).toBe(
			`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(local)}`
		);
	});

	it('mounts a file frame only after that slide is current, then keeps it', async () => {
		FilePreview.open({
			data: [photo, report, { source: 'https://cdn.test/notes.txt', type: 'file', name: 'notes.txt' }],
			current: 0
		});
		await nextTick();
		expect(document.querySelector('.vc-file-slide__frame')).toBeNull();

		button('next').click();
		await endTransition(stage());
		expect(document.querySelector('.vc-file-slide__frame')?.getAttribute('src')).toBe(report);

		button('next').click();
		await endTransition(stage());
		expect(document.querySelector('.vc-file-slide__frame')?.getAttribute('src')).toBe(report);
		expect(activeSlide()?.textContent).toContain('notes.txt');
		expect(activeSlide()?.querySelector('iframe')).toBeNull();
		expect(activeSlide()?.querySelector('.vc-file-slide')?.classList.contains('has-frame')).toBe(false);
		expect(activeSlide()?.querySelector('.vc-file-slide__open')?.getAttribute('href')).toBe('https://cdn.test/notes.txt');
	});

	it('opens the preview address and downloads the file address', async () => {
		const doc = 'https://cdn.test/a.docx';
		FilePreview.open({ data: [{ source: doc, type: 'file', name: 'a.docx' }], current: 0 });
		await nextTick();
		const open = document.querySelector('.vc-file-slide__open') as HTMLAnchorElement;
		const download = document.querySelector('.vc-file-slide__download') as HTMLAnchorElement;
		expect(document.querySelector('.vc-file-slide')?.classList.contains('has-frame')).toBe(true);
		expect(open.getAttribute('href')).toBe(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(doc)}`);
		expect(download.getAttribute('href')).toBe(doc);
		expect(download.getAttribute('download')).toBe('a.docx');
	});

	it('uses a custom slide unless renderSlide returns false', async () => {
		const renderSlide = vi.fn(({ type, row, close }: any) => {
			if (type === 'file') return false;
			return h('button', { class: 'custom-slide', onClick: close }, row.name);
		});
		VcInstance.options.FilePreview!.renderSlide = renderSlide;
		FilePreview.open({ data: [photo, report], current: 0 });
		await nextTick();

		expect(renderSlide).toHaveBeenCalledWith(expect.objectContaining({ type: 'image', active: true, index: 0, instance: null }));
		expect(document.querySelector('.custom-slide')?.textContent).toBe('photo.jpg');
		expect(document.querySelector('.vc-file-slide__name')?.textContent).toBe('report.pdf');

		(document.querySelector('.custom-slide') as HTMLButtonElement).click();
		await nextTick();
		expect(isOpen()).toBe(false);
	});

	it('zooms an image open from the clicked element once it can paint, and fades in without one', async () => {
		const trigger = createTrigger('button', rectOf(10, 20, 100, 40));
		trigger.addEventListener('click', () => {
			ImagePreview.open({ data: [{ src: photo, width: 1000, height: 500 }] });
		});
		trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(viewerEl().classList.contains('is-zoom')).toBe(true);

		// 给了宽高就先放到长边贴齐 1024x768 的位置，加载完之前不放大，蒙层也不出现
		await nextTick();
		const media = activeMedia();
		expect(media.style.transform).toBe('translate3d(0px, 128px, 0) rotate(0deg) scale(1.024)');
		expect(motion()).toBeUndefined();
		expect(isOpen()).toBe(false);

		// 画面按 cover 铺进 100x40、窗口就是这一块，再回到自己的位置、窗口收到画面的盒子上；蒙层同一拍淡入
		await load(media, 1000, 500);
		expect(motion()).toEqual({
			clip: ['inset(20px 914px 708px 10px)', 'inset(128px 0px 128px 0px)'],
			transform: ['translate3d(10px, 2.5px, 0) scale(0.09765625)', 'translate3d(0px, 0px, 0) scale(1)']
		});
		expect(isOpen()).toBe(true);
		await endMotion();
		expect(motion()).toBeUndefined();

		Portal.clear(true);
		ImagePreview.open({ data: [{ src: photo, width: 1000, height: 500 }] });
		expect(viewerEl().classList.contains('is-zoom')).toBe(false);
		await flush();
		expect(isOpen()).toBe(true);
	});

	it('zooms video, audio and file open from the clicked element and back', async () => {
		const zoomed = { clip: 'inset(20px 914px 708px 10px)', transform: 'translate3d(10px, 2.5px, 0) scale(0.09765625)' };
		const rest = { clip: 'inset(0px 0px 0px 0px)', transform: 'translate3d(0px, 0px, 0) scale(1)' };
		const sources = { audio: sound, file: report };
		for (const type of ['audio', 'file'] as const) {
			const trigger = createTrigger('button', rectOf(10, 20, 100, 40));
			trigger.addEventListener('click', () => {
				FilePreview.open({ data: [{ source: sources[type], type, name: type }] });
			});
			trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
			expect(viewerEl().classList.contains('is-zoom')).toBe(true);
			expect(isOpen()).toBe(false);
			await flush();
			expect(motion()).toEqual({ clip: [zoomed.clip, rest.clip], transform: [zoomed.transform, rest.transform] });
			expect(isOpen()).toBe(true);
			expect(document.querySelector(`.vc-${type}-slide`)).toBeTruthy();
			await endMotion();

			// 缩回和蒙层、工具栏的淡出同一拍开始，整层不淡出
			pointer(stage(), 'pointerdown', 12, 700);
			pointer(stage(), 'pointerup', 12, 700);
			await nextTick();
			expect(motion()).toEqual({ clip: [rest.clip, zoomed.clip], transform: [rest.transform, zoomed.transform] });
			expect(isOpen()).toBe(false);
			expect(viewerEl().classList.contains('is-zoom')).toBe(true);
			Portal.clear(true);
		}
	});

	it('fills the clicked area with the video once its real size is known', async () => {
		const trigger = createTrigger('button', rectOf(10, 20, 100, 40));
		trigger.addEventListener('click', () => {
			FilePreview.open({ data: [{ source: movie, type: 'video' }] });
		});
		trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		// 还没有画面尺寸时不先按整页放大
		expect(motion()).toBeUndefined();
		loadVideo(512, 384);
		await flush();

		// 512×384 在 1024×768 里保持原尺寸并居中，再按 cover 铺满 100×40
		const zoomed = { clip: 'inset(20px 914px 708px 10px)', transform: 'translate3d(-40px, -35px, 0) scale(0.1953125)' };
		const rest = { clip: 'inset(192px 256px 192px 256px)', transform: 'translate3d(0px, 0px, 0) scale(1)' };
		expect(motion()).toEqual({ clip: [zoomed.clip, rest.clip], transform: [zoomed.transform, rest.transform] });

		await endMotion();
		pointer(stage(), 'pointerdown', 12, 700);
		pointer(stage(), 'pointerup', 12, 700);
		await nextTick();
		expect(motion()).toEqual({ clip: [rest.clip, zoomed.clip], transform: [rest.transform, zoomed.transform] });
	});

	it('starts from the clicked item when the click is outside its thumbnail', async () => {
		const item = createTrigger('div', rectOf(0, 0, 200, 32));
		item.className = 'vc-file-preview__item';
		const thumb = document.createElement('div');
		thumb.getBoundingClientRect = () => rectOf(4, 4, 22, 22);
		const name = document.createElement('span');
		name.textContent = 'flower.mp4';
		name.getBoundingClientRect = () => rectOf(40, 8, 80, 16);
		item.append(thumb, name);
		name.addEventListener('click', () => {
			FilePreview.open({ data: [{ source: movie, type: 'video', element: thumb }] });
		});
		name.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await nextTick();
		loadVideo(512, 384);
		await flush();
		// 点在名称上：从整项 200×32 放大到 512×384 居中的画面
		expect(motion()?.clip[0]).toBe('inset(0px 824px 736px 0px)');

		Portal.clear(true);
		thumb.addEventListener('click', () => {
			FilePreview.open({ data: [{ source: movie, type: 'video', element: thumb }] });
		});
		thumb.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await nextTick();
		loadVideo(512, 384);
		await flush();
		expect(motion()?.clip[0]).toBe('inset(4px 998px 742px 4px)');
		expect(motion()?.transform[0]).toBe('translate3d(-14.333333333333332px, -7px, 0) scale(0.057291666666666664)');
	});

	it('measures the element when the picture size arrives', async () => {
		const trigger = createTrigger('button', rectOf(10, 20, 100, 40));
		trigger.addEventListener('click', () => {
			FilePreview.open({ data: [{ source: movie, type: 'video' }] });
		});
		trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await nextTick();
		trigger.getBoundingClientRect = () => rectOf(0, 0, 10, 10);
		loadVideo(512, 384);
		await flush();
		expect(motion()?.clip[0]).toBe('inset(0px 1014px 758px 0px)');
		expect(motion()?.transform[0]).toBe('translate3d(-8.333333333333334px, -5px, 0) scale(0.026041666666666668)');
	});

	it('drags a video down to close and lands back on the trigger', async () => {
		const trigger = createTrigger('button', rectOf(10, 20, 100, 40));
		trigger.addEventListener('click', () => {
			FilePreview.open({ data: [{ source: movie, type: 'video' }] });
		});
		trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await nextTick();
		loadVideo(512, 384);
		await flush();
		await endMotion();

		pointer(stage(), 'pointerdown', 300, 200);
		pointer(stage(), 'pointermove', 305, 420);
		await nextTick();
		expect(stage().style.transform).toBe('translate3d(0px, 132px, 0)');
		expect((document.querySelector('.vc-file-viewer__bg') as HTMLElement).style.getPropertyValue('--vc-file-viewer-dim')).toBe('0.484375');

		// 舞台停在拖到的位置，从这里缩回触发元素
		pointer(stage(), 'pointerup', 305, 420);
		await nextTick();
		expect(stage().style.transform).toBe('translate3d(0px, 132px, 0)');
		expect(motion()?.transform[1]).toBe('translate3d(-40px, -167px, 0) scale(0.1953125)');
		expect(motion()?.clip[1]).toBe('inset(-112px 914px 840px 10px)');
		expect(isOpen()).toBe(false);
		expect(viewerEl().classList.contains('is-zoom')).toBe(true);
	});

	it('ignores the wheel on a video', async () => {
		FilePreview.open({ data: [{ source: movie, type: 'video' }] });
		await flush();
		const video = document.querySelector('video')!;
		expect(() => {
			video.dispatchEvent(new WheelEvent('wheel', {
				deltaY: -200,
				clientX: 500,
				clientY: 400,
				bubbles: true,
				cancelable: true
			}));
		}).not.toThrow();
		expect(isOpen()).toBe(true);
		expect(document.querySelector('.vc-video-slide')).toBeTruthy();
	});

	it('zooms from the parent of a clicked text node', async () => {
		const span = createTrigger('span', rectOf(8, 9, 40, 20));
		span.textContent = 'label';
		span.addEventListener('click', () => {
			ImagePreview.open({ data: [{ src: photo, width: 200, height: 100 }] });
		});
		span.firstChild?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await nextTick();
		Utils.def(activeMedia(), 'naturalWidth', 200);
		Utils.def(activeMedia(), 'naturalHeight', 100);
		activeMedia().dispatchEvent(new Event('load'));
		await flush();
		expect(motion()?.transform[0]).toBe('translate3d(8px, 4px, 0) scale(0.0390625)');
		expect(motion()?.clip[0]).toBe('inset(9px 976px 739px 8px)');

		// 不在点击过程中、目标不是节点时不作为触发元素
		Portal.clear(true);
		const previous = VcInstance.globalEvent;
		VcInstance.globalEvent = { eventPhase: 2, target: Object.create(null) } as any;
		ImagePreview.open({ data: [{ src: photo, width: 20, height: 20 }] });
		expect(viewerEl().classList.contains('is-zoom')).toBe(false);
		VcInstance.globalEvent = previous;
	});

	it('waits for the image to decode before zooming open', async () => {
		const thumb = createTrigger('img', rectOf(10, 20, 100, 40));
		thumb.addEventListener('click', () => {
			ImagePreview.open({ data: ['https://cdn.test/full.jpg'] });
		});
		thumb.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await nextTick();
		const media = activeMedia() as HTMLImageElement;
		let finish!: () => void;
		media.decode = () => new Promise<void>((resolve) => {
			finish = resolve;
		});
		await load(media, 1000, 500);

		// 点中的元素里没有可用的缩略图：解码前不摆放、不放大，蒙层也不出现
		expect(media.style.transform).toBe('');
		expect(media.classList.contains('is-ready')).toBe(false);
		expect(motion()).toBeUndefined();
		expect(isOpen()).toBe(false);

		finish();
		await flush();
		expect(media.style.transform).toBe('translate3d(0px, 128px, 0) rotate(0deg) scale(1.024)');
		expect(media.classList.contains('is-ready')).toBe(true);
		expect(motion()?.clip[1]).toBe('inset(128px 0px 128px 0px)');
		expect(isOpen()).toBe(true);
	});

	it('zooms with the clicked thumbnail underneath when the size is given', async () => {
		const thumb = createTrigger('img', rectOf(10, 20, 100, 40)) as HTMLImageElement;
		thumb.src = 'https://cdn.test/thumb.jpg';
		Utils.def(thumb, 'naturalWidth', 100);
		Utils.def(thumb, 'naturalHeight', 40);
		thumb.addEventListener('click', () => {
			ImagePreview.open({ data: [{ src: photo, width: 1000, height: 500 }] });
		});
		thumb.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await nextTick();

		// 不等大图：缩略图放在大图的位置上，一起从点中的元素放大
		const placeholder = activeSlide()?.querySelector('.vc-image-slide__placeholder') as HTMLImageElement;
		expect(placeholder.getAttribute('src')).toBe(thumb.src);
		expect(placeholder.style.transform).toBe(activeMedia().style.transform);
		expect(motion()?.clip[0]).toBe('inset(20px 914px 708px 10px)');
		expect(isOpen()).toBe(true);

		// 大图解码完换上
		await load(activeMedia(), 1000, 500);
		expect(activeMedia().classList.contains('is-ready')).toBe(true);
		expect(activeSlide()?.querySelector('.vc-image-slide__placeholder')).toBeNull();
	});

	it('places an unsized image by the thumbnail ratio and swaps it in place', async () => {
		const thumb = createTrigger('img', rectOf(10, 20, 100, 50)) as HTMLImageElement;
		thumb.src = 'https://cdn.test/thumb.jpg';
		Utils.def(thumb, 'naturalWidth', 200);
		Utils.def(thumb, 'naturalHeight', 100);
		thumb.addEventListener('click', () => {
			ImagePreview.open({ data: ['https://cdn.test/full.jpg'] });
		});
		thumb.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();

		// 不等大图：按缩略图 2:1 的比例放到长边贴齐的位置，立即从缩略图放大
		const placeholder = activeSlide()?.querySelector('.vc-image-slide__placeholder') as HTMLImageElement;
		expect(placeholder.style.transform).toBe('translate3d(0px, 128px, 0) rotate(0deg) scale(5.12)');
		expect(motion()?.clip).toEqual(['inset(20px 914px 698px 10px)', 'inset(128px 0px 128px 0px)']);
		expect(isOpen()).toBe(true);

		// 大图同比例：原位换上，不再过渡
		await load(activeMedia(), 1000, 500);
		expect(activeMedia().style.transform).toBe('translate3d(0px, 128px, 0) rotate(0deg) scale(1.024)');
		expect(activeMedia().classList.contains('is-animating')).toBe(false);
		expect(activeSlide()?.querySelector('.vc-image-slide__placeholder')).toBeNull();
	});

	it('moves an unsized image to its own ratio when the thumbnail ratio differs', async () => {
		const thumb = createTrigger('img', rectOf(10, 20, 100, 100)) as HTMLImageElement;
		thumb.src = 'https://cdn.test/thumb.jpg';
		Utils.def(thumb, 'naturalWidth', 100);
		Utils.def(thumb, 'naturalHeight', 100);
		thumb.addEventListener('click', () => {
			ImagePreview.open({ data: ['https://cdn.test/full.jpg'] });
		});
		thumb.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		expect(activeSlide()?.querySelector('.vc-image-slide__placeholder')?.getAttribute('style')).toContain('scale(7.68)');

		// 方形缩略图、2:1 大图：先放进方形的盒子；放大结束、窗口不再裁切后，再过渡到长边贴齐的位置
		const media = activeMedia() as HTMLImageElement;
		await load(media, 1000, 500);
		expect(media.style.transform).toBe('translate3d(128px, 192px, 0) rotate(0deg) scale(0.768)');
		expect(motion()?.clip[1]).toBe('inset(0px 128px 0px 128px)');
		// 放大结束、窗口不再裁在方形上，再过渡到长边贴齐的位置
		await endMotion();
		expect(motion()).toBeUndefined();
		expect(media.style.transform).toBe('translate3d(0px, 128px, 0) rotate(0deg) scale(1.024)');
		expect(media.classList.contains('is-animating')).toBe(true);
	});

	it('fits by the long edge or by actual pixels', async () => {
		expect(getBaseScale({ w: 0, h: 10 }, { w: 10, h: 10 }, 'max-edge')).toBe(1);
		expect(getBaseScale({ w: 100, h: 50 }, { w: 0, h: 10 }, 'actual')).toBe(1);
		expect(getBaseScale({ w: 100, h: 50 }, { w: 800, h: 600 }, 'max-edge')).toBe(8);
		expect(getBaseScale({ w: 100, h: 50 }, { w: 800, h: 600 }, 'actual')).toBe(1);
		expect(getBaseScale({ w: 2000, h: 1000 }, { w: 800, h: 600 }, 'actual')).toBe(0.4);
		expect(zoomAt({ x: 10, y: 20, scale: 0 }, 2, { x: 0, y: 0 }, 0, 4)).toEqual({ x: 10, y: 20, scale: 2 });

		const { innerWidth, innerHeight } = window;
		Utils.def(window, 'innerWidth', 800);
		Utils.def(window, 'innerHeight', 600);
		try {
			VcInstance.options.FilePreview!.imageOptions = { fit: 'actual' };
			ImagePreview.open({ data: [{ src: photo, width: 100, height: 50 }] });
			await nextTick();
			expect(activeMedia().style.transform).toContain('scale(1)');

			Portal.clear(true);
			VcInstance.options.FilePreview!.imageOptions = { fit: 'max-edge' };
			ImagePreview.open({ data: [{ src: photo, width: 100, height: 50 }] });
			await nextTick();
			expect(activeMedia().style.transform).toContain('scale(8)');

			// 视口变化后重新适配
			Utils.def(window, 'innerWidth', 400);
			window.dispatchEvent(new Event('resize'));
			await nextTick();
			expect(activeMedia().style.transform).toContain('scale(4)');
		} finally {
			Utils.def(window, 'innerWidth', innerWidth);
			Utils.def(window, 'innerHeight', innerHeight);
		}
	});

	it('zooms, pans, pinches and straightens an image slide', async () => {
		const wrapper = mount(ImageSlide, {
			props: {
				row: { type: 'image', source: photo, name: 'photo.jpg', width: 1000, height: 500 },
				active: true,
				viewport: { w: 800, h: 600 }
			}
		});
		await nextTick();
		const vm = wrapper.vm as any;
		const media = wrapper.find('.vc-image-slide__media').element as HTMLElement;
		expect(media.style.transform).toBe('translate3d(0px, 100px, 0) rotate(0deg) scale(0.8)');
		expect(vm.isZoomed).toBe(false);
		expect(media.classList.contains('is-zoomed')).toBe(false);

		vm.toggleZoom({ x: 100, y: 80 });
		await nextTick();
		expect(vm.isZoomed).toBe(true);
		expect(media.classList.contains('is-zoomed')).toBe(true);
		expect(vm.panBy(30, -20)).toBe(0);
		expect(vm.panBy(8000, 0)).toBeGreaterThan(0);
		vm.toggleZoom();
		await nextTick();
		expect(vm.isZoomed).toBe(false);
		expect(media.classList.contains('is-zoomed')).toBe(false);

		expect(vm.canZoomOut).toBe(false);
		expect(vm.canZoomIn).toBe(true);
		vm.zoomIn();
		await nextTick();
		expect(media.style.transform).toContain('scale(1.6)');
		vm.zoomIn();
		vm.zoomIn();
		vm.zoomIn();
		await nextTick();
		expect(media.style.transform).toContain('scale(8)');
		expect(vm.canZoomIn).toBe(false);
		vm.zoomOut();
		vm.zoomOut();
		vm.zoomOut();
		vm.zoomOut();
		await nextTick();
		expect(vm.canZoomOut).toBe(false);
		expect(media.style.transform).toContain('scale(0.8)');

		vm.rotateBy(90);
		await nextTick();
		expect(media.style.transform).toBe('translate3d(550px, 0px, 0) rotate(90deg) scale(0.6)');
		vm.rotateBy(90);
		await nextTick();
		expect(media.style.transform).toBe('translate3d(800px, 500px, 0) rotate(180deg) scale(0.8)');
		vm.rotateBy(90);
		await nextTick();
		expect(media.style.transform).toBe('translate3d(250px, 600px, 0) rotate(270deg) scale(0.6)');
		vm.rotateBy(90);
		await nextTick();
		expect(media.style.transform).toBe('translate3d(0px, 100px, 0) rotate(360deg) scale(0.8)');
		vm.rotateBy(-90);
		await nextTick();
		expect(media.style.transform).toBe('translate3d(250px, 600px, 0) rotate(270deg) scale(0.6)');
		vm.rotateBy(90);
		await nextTick();
		expect(media.style.transform).toBe('translate3d(0px, 100px, 0) rotate(360deg) scale(0.8)');

		vm.zoomBy(2, { x: 10, y: 10 });
		expect(vm.isZoomed).toBe(true);
		vm.zoomBy(0.1);
		expect(vm.isZoomed).toBe(false);

		// 捏合到初始以下时继续缩小（最多一半），松手回弹
		expect(vm.pinch(2, { x: 0, y: 0 })).toBe(1);
		vm.pinchStart({ x: 400, y: 300 });
		expect(vm.pinch(2, { x: 420, y: 300 })).toBe(2);
		expect(vm.pinch(0.25, { x: 400, y: 300 })).toBe(0.25);
		await nextTick();
		expect(media.style.transform).toContain('scale(0.4)');
		vm.pinchEnd();
		await nextTick();
		expect(media.style.transform).toContain('scale(0.8)');
		expect(media.classList.contains('is-animating')).toBe(true);

		vm.pinchStart({ x: 400, y: 300 });
		vm.pinch(1.5, { x: 400, y: 300 });
		vm.pinchEnd();
		expect(vm.isZoomed).toBe(true);

		await wrapper.setProps({ viewport: { w: 900, h: 700 }, fit: 'actual' });
		expect(vm.isZoomed).toBe(true);

		// 关闭前转回 0°，保住画面中心
		vm.rotateBy(90);
		vm.straighten();
		await nextTick();
		expect(media.style.transform).toContain('rotate(0deg)');
		wrapper.unmount();
	});

	it('steps zoom between imageOptions min and max and rotates by 90 degrees', async () => {
		VcInstance.options.FilePreview!.imageOptions = { max: 3, min: 0.5 };
		FilePreview.open({ data: [{ source: photo, type: 'image', width: 1024, height: 768 }] });
		await flush();
		const media = activeMedia();
		const scaleOf = () => Number(media.style.transform.match(/scale\(([^)]+)\)/)?.[1]);

		expect(button('zoom-in').querySelector('.is-plus')).not.toBeNull();
		expect(button('zoom-out').querySelector('.vc-icon')).toBeNull();
		expect(button('rotate-left').querySelector('.vc-icon')).not.toBeNull();
		expect(scaleOf()).toBe(1);

		button('rotate-right').click();
		await nextTick();
		expect(media.style.transform).toBe('translate3d(800px, 0px, 0) rotate(90deg) scale(0.75)');
		button('rotate-left').click();
		await nextTick();
		expect(media.style.transform).toBe('translate3d(0px, 0px, 0) rotate(0deg) scale(1)');

		expect(button('zoom-out').disabled).toBe(false);
		button('zoom-out').click();
		await nextTick();
		expect(scaleOf()).toBe(0.5);
		expect(button('zoom-out').disabled).toBe(true);

		button('zoom-in').click();
		await nextTick();
		expect(scaleOf()).toBe(1);
		button('zoom-in').click();
		await nextTick();
		expect(scaleOf()).toBe(2);
		button('zoom-in').click();
		await nextTick();
		expect(scaleOf()).toBe(3);
		expect(button('zoom-in').disabled).toBe(true);

		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(button('zoom-in').getAttribute('aria-label')).toBe('Zoom in');
		expect(button('zoom-out').getAttribute('aria-label')).toBe('Zoom out');
		expect(button('rotate-left').getAttribute('aria-label')).toBe('Rotate left');
		expect(button('rotate-right').getAttribute('aria-label')).toBe('Rotate right');
	});

	it('reads the natural size from the slide image and shows a loader or an error', async () => {
		vi.useFakeTimers();
		ImagePreview.open({ data: ['https://cdn.test/slow.jpg'] });
		await nextTick();
		expect(document.querySelector('.vc-image-slide__loading')).toBeNull();
		vi.advanceTimersByTime(2000);
		await nextTick();
		expect(document.querySelector('.vc-image-slide__loading')?.classList.contains('vc-spin')).toBe(true);

		const slow = activeMedia() as HTMLImageElement;
		Utils.def(slow, 'naturalWidth', 400);
		Utils.def(slow, 'naturalHeight', 200);
		slow.dispatchEvent(new Event('load'));
		await flush();
		expect(slow.style.transform).toContain('scale(');
		expect(slow.classList.contains('is-ready')).toBe(true);
		expect(document.querySelector('.vc-image-slide__loading')).toBeNull();
		// 已有尺寸后再次 load 不会重新放置
		slow.dispatchEvent(new Event('load'));

		Portal.clear(true);
		ImagePreview.open({ data: ['https://cdn.test/missing.jpg'] });
		await nextTick();
		activeMedia().dispatchEvent(new Event('error'));
		vi.advanceTimersByTime(2000);
		await nextTick();
		expect(document.querySelector('.vc-image-slide__error')?.textContent).toBe('网络异常 图片加载失败');
		expect(document.querySelector('.vc-image-slide__loading')).toBeNull();
		vi.useRealTimers();
	});

	it('switches slides with buttons and the keyboard, traps focus and closes with Escape', async () => {
		const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
		FilePreview.open({ data: [photo, movie, sound], current: 0 });
		await flush();
		expect(button('counter').textContent).toBe('1 / 3');
		expect(button('zoom-in')).not.toBeNull();
		expect(button('zoom-out')).not.toBeNull();
		expect(button('zoom-in').getAttribute('aria-label')).toBe('放大');
		expect(button('rotate-left').getAttribute('aria-label')).toBe('向左旋转');
		expect(button('rotate-right').getAttribute('aria-label')).toBe('向右旋转');
		expect(document.activeElement).toBe(button('close'));

		button('next').click();
		await endTransition(stage());
		expect(activeSlide()?.getAttribute('data-index')).toBe('1');
		expect(button('zoom-in')).toBeNull();
		expect(button('rotate-left')).toBeNull();

		key('ArrowLeft');
		await endTransition(stage());
		expect(activeSlide()?.getAttribute('data-index')).toBe('0');
		expect(pause).toHaveBeenCalled();

		// 循环：从第一项往前到最后一项
		key('ArrowLeft');
		await endTransition(stage());
		expect(document.querySelector('.vc-audio-slide audio')?.getAttribute('src')).toBe(sound);
		expect(activeSlide()?.getAttribute('data-index')).toBe('2');

		// 输入区里的按键交给它自己
		const input = document.createElement('input');
		viewerEl().append(input);
		input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
		await nextTick();
		expect(isOpen()).toBe(true);
		input.remove();

		button('close').focus();
		key('Tab');
		expect(document.activeElement).toBe(button('prev'));
		key('Tab', { shiftKey: true });
		expect(document.activeElement).toBe(button('close'));
		button('next').focus();
		key('Tab');
		expect(document.activeElement).toBe(button('next'));

		VcInstance.configure({ locale: enUS });
		await nextTick();
		expect(button('close').getAttribute('aria-label')).toBe('Close');
		expect(button('prev').getAttribute('aria-label')).toBe('Previous');

		key('Escape');
		await nextTick();
		expect(isOpen()).toBe(false);
	});

	it('keeps both arrows with two items and resists when there is only one', async () => {
		vi.useFakeTimers();
		FilePreview.open({ data: [{ source: photo, type: 'image', width: 800, height: 600 }, movie] });
		await flush();
		expect(document.querySelectorAll('.vc-file-viewer__slide')).toHaveLength(3);
		expect(button('prev')).not.toBeNull();
		expect(button('next')).not.toBeNull();

		// 第一项往右拖：另一项就在左边，位移不打折，松手切过去，箭头仍在
		pointer(stage(), 'pointerdown', 100, 200);
		pointer(stage(), 'pointermove', 200, 200);
		await nextTick();
		expect(stage().style.transform).toBe('translate3d(100px, 0px, 0)');
		vi.advanceTimersByTime(150);
		pointer(stage(), 'pointerup', 200, 200);
		await flush();
		await endTransition(stage());
		expect(activeSlide()?.getAttribute('data-index')).toBe('1');
		expect(button('prev')).not.toBeNull();
		expect(button('next')).not.toBeNull();
		expect(document.querySelectorAll('.vc-file-viewer__slide')).toHaveLength(3);

		// 从视频控件上按下不识别手势
		const video = document.querySelector('video')!;
		pointer(video, 'pointerdown', 10, 10);
		pointer(stage(), 'pointermove', 300, 10);
		pointer(stage(), 'pointerup', 300, 10);
		await flush();
		expect(activeSlide()?.getAttribute('data-index')).toBe('1');

		// 切换中的拖动不处理，左右都能回到另一项
		button('prev').click();
		pointer(stage(), 'pointerdown', 100, 200);
		pointer(stage(), 'pointermove', 300, 200);
		pointer(stage(), 'pointerup', 300, 200);
		await flush();
		vi.advanceTimersByTime(400);
		await flush();
		expect(activeSlide()?.getAttribute('data-index')).toBe('0');
		expect(button('next')).not.toBeNull();

		Portal.clear(true);
		FilePreview.open({ data: [{ source: photo, type: 'image', width: 800, height: 600 }] });
		await flush();
		expect(document.querySelectorAll('.vc-file-viewer__slide')).toHaveLength(1);
		expect(button('prev')).toBeNull();
		expect(button('next')).toBeNull();

		// 只有一项时往右拖：没有另一项，位移打折，停顿后松开回弹
		pointer(stage(), 'pointerdown', 100, 200);
		pointer(stage(), 'pointermove', 200, 200);
		await nextTick();
		expect(stage().style.transform).toBe('translate3d(35px, 0px, 0)');
		vi.advanceTimersByTime(150);
		pointer(stage(), 'pointerup', 200, 200);
		await nextTick();
		expect(stage().style.transform).toBe('translate3d(0px, 0px, 0)');
		expect(stage().classList.contains('is-sliding')).toBe(true);
		await endTransition(stage());
		expect(stage().classList.contains('is-sliding')).toBe(false);
		expect(activeSlide()?.getAttribute('data-index')).toBe('0');
		vi.useRealTimers();
	});

	it('pans a zoomed image and continues into a swipe at the edge', async () => {
		vi.useFakeTimers();
		FilePreview.open({ data: [{ source: photo, type: 'image', width: 1024, height: 768 }, banner, report] });
		await flush();
		button('zoom-in').click();
		await nextTick();
		expect(activeMedia().classList.contains('is-zoomed')).toBe(true);

		const media = activeMedia();
		const before = media.style.transform;
		pointer(stage(), 'pointerdown', 500, 400);
		pointer(stage(), 'pointermove', 480, 380);
		await nextTick();
		expect(media.style.transform).not.toBe(before);
		expect(stage().style.transform).toBe('translate3d(0px, 0px, 0)');

		// 平移到右边缘后，剩余位移转为切换
		pointer(stage(), 'pointermove', -5000, 380);
		await nextTick();
		expect(stage().style.transform).not.toBe('translate3d(0px, 0px, 0)');
		pointer(stage(), 'pointerup', -5000, 380);
		await endTransition(stage());
		expect(activeSlide()?.getAttribute('data-index')).toBe('1');
		vi.useRealTimers();
	});

	it('zooms on a mouse tap on the image, toggles controls on touch and closes on an empty click', async () => {
		vi.useFakeTimers();
		FilePreview.open({ data: [{ source: photo, type: 'image', width: 1024, height: 768 }, report] });
		await flush();
		const media = activeMedia();

		// 指针被捕获后 pointerup 落在 stage 上，仍按按下的图片处理。鼠标单击立即缩放
		pointer(media, 'pointerdown', 500, 400);
		pointer(stage(), 'pointerup', 500, 400);
		await nextTick();
		expect(media.classList.contains('is-zoomed')).toBe(true);

		// 再点一下缩回去
		pointer(media, 'pointerdown', 500, 400);
		pointer(stage(), 'pointerup', 500, 400);
		await nextTick();
		expect(media.classList.contains('is-zoomed')).toBe(false);

		// 滚轮缩放
		stage().dispatchEvent(new WheelEvent('wheel', { deltaY: -200, clientX: 500, clientY: 400, bubbles: true, cancelable: true }));
		await nextTick();
		expect(media.classList.contains('is-zoomed')).toBe(true);

		// 触摸点在图片上切换工具栏，点在空白处才关闭
		pointer(media, 'pointerdown', 500, 400, { pointerType: 'touch' });
		pointer(stage(), 'pointerup', 500, 400, { pointerType: 'touch' });
		vi.advanceTimersByTime(300);
		await nextTick();
		expect(viewerEl().classList.contains('is-idle')).toBe(true);
		pointer(media, 'pointerdown', 500, 400, { pointerType: 'touch' });
		pointer(stage(), 'pointerup', 500, 400, { pointerType: 'touch' });
		vi.advanceTimersByTime(300);
		await nextTick();
		expect(viewerEl().classList.contains('is-idle')).toBe(false);

		// 文件页的信息栏不关闭，空白处关闭
		button('next').click();
		await endTransition(stage());
		const name = document.querySelector('.vc-file-slide__name')!;
		pointer(name, 'pointerdown', 20, 20);
		pointer(stage(), 'pointerup', 20, 20);
		vi.advanceTimersByTime(300);
		await nextTick();
		expect(isOpen()).toBe(true);

		pointer(stage(), 'pointerdown', 20, 700);
		pointer(stage(), 'pointerup', 20, 700);
		await nextTick();
		expect(isOpen()).toBe(false);

		// 关闭中不再响应
		pointer(stage(), 'pointerdown', 20, 20, { pointerType: 'touch' });
		pointer(stage(), 'pointerup', 20, 20, { pointerType: 'touch' });
		vi.advanceTimersByTime(300);
		await nextTick();
		expect(viewerEl().classList.contains('is-idle')).toBe(false);
		vi.useRealTimers();
	});

	it('closes on a touch tap on the mask without waiting for a double tap', async () => {
		vi.useFakeTimers();
		FilePreview.open({ data: [{ source: photo, type: 'image', width: 400, height: 200 }] });
		await flush();

		pointer(stage(), 'pointerdown', 20, 20, { pointerType: 'touch' });
		pointer(stage(), 'pointerup', 20, 20, { pointerType: 'touch' });
		await nextTick();
		expect(isOpen()).toBe(false);
		expect(viewerEl().classList.contains('is-idle')).toBe(false);
		vi.useRealTimers();
	});

	it('starts the zoom-out close on a mouse click without waiting for a double tap', async () => {
		const trigger = createTrigger('img', rectOf(12, 16, 80, 40));
		trigger.addEventListener('click', () => {
			ImagePreview.open({ data: [{ src: photo, width: 400, height: 200 }] });
		});
		trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await nextTick();
		await load(activeMedia(), 400, 200);
		await endMotion();

		vi.useFakeTimers();
		pointer(stage(), 'pointerdown', 12, 700);
		pointer(stage(), 'pointerup', 12, 700);
		await flush();
		expect(isOpen()).toBe(false);
		expect(motion()?.transform[1]).toBe('translate3d(12px, 6px, 0) scale(0.078125)');
		vi.useRealTimers();
	});

	it('drags down to close and lands back on the thumbnail', async () => {
		const onClose = vi.fn();
		const trigger = createTrigger('img', rectOf(12, 16, 80, 40));
		trigger.addEventListener('click', () => {
			ImagePreview.open({ data: [{ src: photo, width: 400, height: 200 }], onClose });
		});
		trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await nextTick();
		await load(activeMedia(), 400, 200);
		await endMotion();

		pointer(stage(), 'pointerdown', 300, 200);
		pointer(stage(), 'pointermove', 305, 420);
		await nextTick();
		const bg = document.querySelector('.vc-file-viewer__bg') as HTMLElement;
		// 手指 220px，画面只跟 60%，蒙层按 132 / (768 / 3) 变淡
		expect(bg.style.getPropertyValue('--vc-file-viewer-dim')).toBe('0.484375');
		expect(viewerEl().classList.contains('is-dragging')).toBe(true);
		expect(stage().style.transform).toBe('translate3d(0px, 132px, 0)');

		// 舞台停在拖到的位置，从这里缩回缩略图
		pointer(stage(), 'pointerup', 305, 420);
		await nextTick();
		expect(stage().style.transform).toBe('translate3d(0px, 132px, 0)');
		expect(motion()).toEqual({
			clip: ['inset(128px 0px 128px 0px)', 'inset(-116px 932px 844px 12px)'],
			transform: ['translate3d(0px, 0px, 0) scale(1)', 'translate3d(12px, -126px, 0) scale(0.078125)']
		});
		expect(isOpen()).toBe(false);

		await endMotion();
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(document.querySelector('.vc-file-viewer')).toBeNull();
	});

	it('stops a running slide where it is and closes back to the current item', async () => {
		const onClose = vi.fn();
		const trigger = createTrigger('img', rectOf(12, 16, 80, 40));
		trigger.addEventListener('click', () => {
			ImagePreview.open({ data: [{ src: photo, width: 400, height: 200 }, { src: banner, width: 400, height: 200 }], onClose });
		});
		trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await nextTick();
		await load(activeMedia(), 400, 200);
		await endMotion();

		key('ArrowRight');
		await nextTick();
		expect(stage().style.transform).toBe('translate3d(-1024px, 0px, 0)');
		expect(stage().classList.contains('is-sliding')).toBe(true);

		// 切换过渡进行到 -400px 时关闭：舞台停在这里，从这里缩回缩略图
		stage().getBoundingClientRect = () => rectOf(-400, 0, 1024, 768);
		key('Escape');
		await flush();
		expect(stage().style.transform).toBe('translate3d(-400px, 0px, 0)');
		expect(stage().classList.contains('is-sliding')).toBe(false);
		expect(motion()?.clip[1]).toBe('inset(16px 532px 712px 412px)');
		expect(isOpen()).toBe(false);

		// 切换的等待结束后不再换到下一项
		await endTransition(stage());
		expect(activeSlide()?.getAttribute('data-index')).toBe('0');
		await endMotion();
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(document.querySelector('.vc-file-viewer')).toBeNull();
	});

	it('drags up to close from the raised position and lands on the same thumbnail', async () => {
		const trigger = createTrigger('img', rectOf(12, 16, 80, 40));
		trigger.addEventListener('click', () => {
			ImagePreview.open({ data: [{ src: photo, width: 400, height: 200 }] });
		});
		trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await nextTick();
		await load(activeMedia(), 400, 200);
		await endMotion();

		pointer(stage(), 'pointerdown', 300, 400);
		pointer(stage(), 'pointermove', 295, 180);
		await nextTick();
		expect((document.querySelector('.vc-file-viewer__bg') as HTMLElement).style.getPropertyValue('--vc-file-viewer-dim')).toBe('0.484375');
		expect(stage().style.transform).toBe('translate3d(0px, -132px, 0)');

		pointer(stage(), 'pointerup', 295, 180);
		await nextTick();
		expect(stage().style.transform).toBe('translate3d(0px, -132px, 0)');
		expect(motion()?.transform[1]).toBe('translate3d(12px, 138px, 0) scale(0.078125)');
		expect(isOpen()).toBe(false);
	});

	it('snaps back after a short drag down', async () => {
		vi.useFakeTimers();
		FilePreview.open({ data: [photo] });
		await flush();
		pointer(stage(), 'pointerdown', 300, 200);
		pointer(stage(), 'pointermove', 300, 260);
		vi.advanceTimersByTime(150);
		pointer(stage(), 'pointerup', 300, 260);
		await flush();
		expect(stage().style.transform).toBe('translate3d(0px, 0px, 0)');
		expect(stage().classList.contains('is-sliding')).toBe(true);
		expect((document.querySelector('.vc-file-viewer__bg') as HTMLElement).style.getPropertyValue('--vc-file-viewer-dim')).toBe('');
		expect(isOpen()).toBe(true);

		// 被系统取消的下拉不关闭
		pointer(stage(), 'pointerdown', 300, 200);
		pointer(stage(), 'pointermove', 300, 500);
		pointer(stage(), 'pointercancel', 300, 500);
		await nextTick();
		expect(isOpen()).toBe(true);
		vi.useRealTimers();
	});

	it('closes back to an audio or file card after switching', async () => {
		const wrapper = mount(FilePreview, {
			attachTo: document.body,
			props: {
				type: 'group',
				data: [
					{ source: sound, type: 'audio', name: 'a.mp3' },
					{ source: report, type: 'file', name: 'a.pdf' },
					{ source: 'https://cdn.test/a.xlsx', type: 'file', name: 'a.xlsx' }
				]
			}
		});
		const items = [...document.querySelectorAll('.vc-file-preview__item')];
		items[0].getBoundingClientRect = () => rectOf(10, 20, 120, 32);
		items[1].getBoundingClientRect = () => rectOf(10, 60, 140, 32);
		items[2].getBoundingClientRect = () => rectOf(10, 100, 160, 32);
		(items[0] as HTMLElement).click();
		await flush();

		button('next').click();
		await endTransition(stage());
		button('close').click();
		await flush();
		expect(motion()?.clip[1]).toBe('inset(60px 874px 676px 10px)');
		expect(motion()?.transform[1]).toBe('translate3d(10px, 23.5px, 0) scale(0.13671875)');
		wrapper.unmount();
	});

	it('closes a slotted gallery back to the current tile after switching', async () => {
		const wrapper = mount(FilePreview, {
			attachTo: document.body,
			props: {
				data: [
					{ source: photo, type: 'image', width: 200, height: 100 },
					{ source: banner, type: 'image', width: 200, height: 100 }
				]
			},
			slots: {
				default: ({ preview }: { preview: () => void }) => h('div', { class: 'tile', onClick: preview })
			}
		});
		const tiles = [...document.querySelectorAll('.vc-file-preview__item')];
		tiles[0].getBoundingClientRect = () => rectOf(0, 0, 40, 40);
		tiles[1].getBoundingClientRect = () => rectOf(80, 20, 40, 40);
		(tiles[0].querySelector('.tile') as HTMLElement).click();
		await flush();

		button('next').click();
		await endTransition(stage());
		await load(activeMedia(), 200, 100);
		button('close').click();
		await flush();
		expect(motion()?.transform[1]).toBe('translate3d(60px, 10px, 0) scale(0.078125)');
		wrapper.unmount();
	});

	it('closes back to the element of the current item after switching', async () => {
		const first = createTrigger('img', rectOf(0, 0, 50, 25));
		const second = createTrigger('img', rectOf(100, 100, 60, 30));
		FilePreview.open({
			data: [
				{ source: photo, type: 'image', width: 200, height: 100, element: first },
				{ source: banner, type: 'image', width: 200, height: 100, element: second },
				report
			]
		});
		expect(viewerEl().classList.contains('is-zoom')).toBe(true);
		await flush();

		button('next').click();
		await endTransition(stage());
		await load(activeMedia(), 200, 100);
		button('close').click();
		await flush();
		expect(motion()?.transform[1]).toBe('translate3d(100px, 92.5px, 0) scale(0.05859375)');
	});

	it('pinches to zoom, rebounds above the close ratio and closes below it', async () => {
		FilePreview.open({ data: [{ source: photo, type: 'image', width: 1024, height: 768 }] });
		await flush();
		const touch = (type: string, id: number, x: number, y: number) => pointer(stage(), type, x, y, { pointerId: id, pointerType: 'touch' });
		const bg = document.querySelector('.vc-file-viewer__bg') as HTMLElement;

		touch('pointerdown', 1, 400, 300);
		touch('pointerdown', 2, 600, 300);
		touch('pointermove', 2, 580, 300);
		await nextTick();
		expect(bg.style.getPropertyValue('--vc-file-viewer-dim')).toBe('0.88');
		touch('pointerup', 2, 580, 300);
		touch('pointerup', 1, 400, 300);
		await nextTick();
		expect(bg.style.getPropertyValue('--vc-file-viewer-dim')).toBe('');
		expect(activeMedia().style.transform).toContain('scale(1)');
		expect(isOpen()).toBe(true);

		touch('pointerdown', 1, 400, 300);
		touch('pointerdown', 2, 600, 300);
		touch('pointermove', 2, 500, 300);
		touch('pointerup', 2, 500, 300);
		touch('pointerup', 1, 400, 300);
		await nextTick();
		expect(isOpen()).toBe(false);
	});
});
