// @vitest-environment jsdom

import { Editor, EditorView } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import Quill from 'quill';
import { nextTick } from 'vue';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorToolbar } from '../toolbar';
import { VcInstance } from '../../vc';
import { ImagePreview } from '../../image-preview';
import { Upload } from '../../upload';
import { defaults, toolbarDefaultsMap } from '../default-options';
import { registerAudioBlot } from '../extends/audio-blot';
import { EXTENDS_CONTEXT_KEY } from '../extends/constant';
import {
	insertFile,
	registerEventModule,
	uploadFile
} from '../extends/event-module';
import { registerFontSize } from '../extends/font-size';
import { registerLetterSpacing } from '../extends/letter-spacing';
import { registerLineHeight } from '../extends/line-height';
import { registerVideoBlot } from '../extends/video-blot';
import {
	insertFontSizeStyle,
	insertLetterSpacingStyle,
	insertLineHeightStyle
} from '../utils';
import * as Load from '@deot/helper-load';

vi.mock('@deot/helper-load', () => ({
	style: vi.fn(),
	removeStyle: vi.fn()
}));

const sleep = (ms = 0) => new Promise<void>(resolve => setTimeout(resolve, ms));
const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const getEditor = (wrapper: any): Quill => {
	const exposed = (wrapper.vm as any).editor;
	return exposed?.value || exposed;
};

const emitEditorEvent = (editor: any, event: string, ...args: any[]) => {
	editor.emitter.emit(event, ...args);
};

const getWhitelist = (format: any) => {
	return format.whitelist || format.options?.whitelist;
};

beforeAll(() => {
	const rect = () => ({
		x: 0,
		y: 0,
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		width: 0,
		height: 0,
		toJSON: () => {}
	});

	if (!Range.prototype.getBoundingClientRect) {
		Range.prototype.getBoundingClientRect = rect;
	}
	if (!Range.prototype.getClientRects) {
		Range.prototype.getClientRects = () => [] as any;
	}
});

const makeEditorContext = () => {
	const editor = {
		getSelection: vi.fn(() => ({ index: 2 })),
		getLength: vi.fn(() => 9),
		insertEmbed: vi.fn(),
		insertText: vi.fn(),
		setSelection: vi.fn(),
		format: vi.fn()
	};

	return {
		editor,
		parent: {
			poster: vi.fn((value: string, type: string) => `${type}:${value}`),
			onLoading: vi.fn(),
			onLoaded: vi.fn(),
			previewable: true
		}
	};
};

describe('Editor component', () => {
	beforeEach(() => {
		(window as any).quill = Quill;
	});

	afterEach(() => {
		delete (window as any).quill;
		document.body.innerHTML = '';
		vi.restoreAllMocks();
		VcInstance.options.Editor = {
			options: undefined,
			enhancer: undefined
		};
		VcInstance.options.UploadPicker = {
			enhancer: undefined
		};
	});

	it('exports and initializes quill with default toolbar', async () => {
		const register = vi.fn();
		const onReady = vi.fn();
		const wrapper = mount(Editor, {
			attachTo: document.body,
			props: {
				modelValue: '<p>initial</p>',
				register,
				onReady
			}
		});
		await flush();

		const editor = getEditor(wrapper);
		expect(typeof Editor).toBe('object');
		expect(wrapper.classes()).toContain('vc-editor');
		expect(register).toHaveBeenCalledWith(Quill);
		expect(onReady).toHaveBeenCalledWith({ dependencies: { quill: Quill } });
		expect(editor.root.innerHTML).toContain('initial');
		expect((editor.getModule('toolbar') as any).container.id).toMatch(/^editor-toolbar/);
		expect(editor.options[EXTENDS_CONTEXT_KEY].previewable).toBe(true);
		expect(wrapper.findComponent(EditorToolbar).exists()).toBe(true);

		wrapper.unmount();
	});

	it('merges global and prop options and supports custom toolbar slot', async () => {
		const CustomModule = vi.fn();
		Quill.register('modules/custom', CustomModule as any, true);
		VcInstance.options.Editor.options = {
			placeholder: 'global',
			modules: { custom: true },
			toolbar: ['bold']
		};
		let toolbarId = '';
		const wrapper = mount(Editor, {
			attachTo: document.body,
			props: {
				options: { placeholder: 'local', modules: { history: true } }
			},
			slots: {
				toolbar: () => <div id={toolbarId} class="custom-toolbar">toolbar</div>
			}
		});
		toolbarId = (wrapper.vm as any).toolbarId;
		await wrapper.vm.$forceUpdate();
		await flush();

		const editor = getEditor(wrapper);
		expect(editor.options.placeholder).toBe('local');
		expect(CustomModule).toHaveBeenCalled();
		expect(editor.options.modules.custom).toEqual({});
		expect(editor.options.modules.history).toBeDefined();
		expect((editor.getModule('toolbar') as any).container.className).toContain('custom-toolbar');
		expect(wrapper.find('.custom-toolbar').exists()).toBe(true);

		wrapper.unmount();
	});

	it('emits focus, blur and text-change events and notifies form item', async () => {
		const formChange = vi.fn();
		const value = { current: '' };
		const wrapper = mount(Editor, {
			attachTo: document.body,
			props: {
				'modelValue': value.current,
				'onUpdate:modelValue': (v: string) => (value.current = v)
			},
			global: {
				provide: {
					'vc-form-item': { change: formChange }
				}
			}
		});
		await flush();

		const editor = getEditor(wrapper);
		const getSemanticHTML = vi.spyOn(editor, 'getSemanticHTML');
		emitEditorEvent(editor, 'selection-change', { index: 1 });
		emitEditorEvent(editor, 'selection-change', null);
		getSemanticHTML.mockReturnValue('<p>Hello</p>');
		emitEditorEvent(editor, 'text-change');
		await flush();

		expect(wrapper.emitted('focus')?.[0][0]).toBe('');
		expect(wrapper.emitted('blur')?.[0][0]).toBe('');
		expect(value.current).toBe('<p>Hello</p>');
		expect(wrapper.emitted('input')?.[0][0]).toBe('<p>Hello</p>');
		expect(wrapper.emitted('change')?.[0][0]).toBe('<p>Hello</p>');
		expect(formChange).toHaveBeenCalledWith('<p>Hello</p>');

		getSemanticHTML.mockReturnValue('<p><br></p>');
		emitEditorEvent(editor, 'text-change');
		expect(value.current).toBe('');

		wrapper.unmount();
	});

	it('reacts to disabled and modelValue changes', async () => {
		const wrapper = mount(Editor, {
			attachTo: document.body,
			props: {
				modelValue: '<p>a</p>'
			}
		});
		await flush();

		const editor = getEditor(wrapper);
		const enable = vi.spyOn(editor, 'enable');
		const dangerouslyPasteHTML = vi.spyOn(editor.clipboard, 'dangerouslyPasteHTML');
		const setText = vi.spyOn(editor, 'setText');

		await wrapper.setProps({ disabled: true });
		expect(enable).toHaveBeenLastCalledWith(false);

		await wrapper.setProps({ modelValue: '<p>b</p>' });
		expect(dangerouslyPasteHTML).toHaveBeenLastCalledWith('<p>b</p>');

		await wrapper.setProps({ modelValue: '' });
		expect(setText).toHaveBeenLastCalledWith('');

		wrapper.unmount();
	});

	it('handles toolbar upload, undo, redo and exposed add', async () => {
		const uploadFiles = vi.fn();
		const uploadOpen = vi.spyOn(Upload, 'open').mockImplementation((options: any) => {
			options.onBegin?.();
			options.onComplete?.();
			options.onFileSuccess?.({ value: 'https://site/a.png' }, { target: { name: 'a.png' } });
			return { wrapper: { uploadFiles } } as any;
		});
		const wrapper = mount(Editor, { attachTo: document.body });
		await flush();

		const editor = getEditor(wrapper);
		const undo = vi.spyOn(editor.history, 'undo');
		const redo = vi.spyOn(editor.history, 'redo');
		const insertText = vi.spyOn(editor, 'insertText');
		const format = vi.spyOn(editor, 'format');
		const icons = wrapper.findAll('.vc-editor__icon .vc-icon');
		await icons[0].trigger('click');
		expect(uploadOpen).toHaveBeenCalledWith(expect.objectContaining({ accept: 'video/*' }));

		await wrapper.findAll('.vc-editor__icon')[2].trigger('click');
		await wrapper.findAll('.vc-editor__icon')[3].trigger('click');
		expect(undo).toHaveBeenCalledTimes(1);
		expect(redo).toHaveBeenCalledTimes(1);

		(wrapper.vm as any).add([{ value: 'https://site/file.txt', target: { name: 'file.txt' } }]);
		expect(insertText).toHaveBeenCalledWith(expect.any(Number), 'file.txt');
		expect(format).toHaveBeenCalledWith('link', 'https://site/file.txt');

		wrapper.unmount();
	});

	it('respects prop enhancer and global enhancer before default upload', async () => {
		const propEnhancer = vi.fn(async () => true);
		const uploadOpen = vi.spyOn(Upload, 'open').mockReturnValue({} as any);
		const wrapper = mount(() => (
			<Editor enhancer={propEnhancer} />
		), { attachTo: document.body });
		await flush();

		await wrapper.findAll('.vc-editor__icon .vc-icon')[0].trigger('click');
		expect(propEnhancer).toHaveBeenCalledWith(expect.anything(), 'video');
		expect(uploadOpen).not.toHaveBeenCalled();
		wrapper.unmount();

		VcInstance.options.UploadPicker.enhancer = vi.fn(async () => true);
		const wrapper2 = mount(() => (<Editor enhancer />), { attachTo: document.body });
		await flush();
		await wrapper2.findAll('.vc-editor__icon .vc-icon')[1].trigger('click');
		expect(VcInstance.options.UploadPicker.enhancer).toHaveBeenCalledWith(expect.anything(), 'image');

		wrapper2.unmount();
	});
});

describe('EditorToolbar', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.clearAllMocks();
	});

	it('renders button groups, uploads, selects, undo/redo and extend slot', async () => {
		vi.clearAllMocks();
		const onUpload = vi.fn(({ type }) => <button class={`upload-${type}`} />);
		const wrapper = mount(() => (
			<EditorToolbar
				elementId="toolbar"
				options={[
					['bold', 'upload/image', 'undo', 'redo'],
					{ header: [1, 2, 'selected'] },
					{ script: 'sub' },
					'font-size',
					'line-height',
					'letter-spacing'
				]}
			>
				{{
					upload: onUpload,
					undo: () => <button class="undo" />,
					redo: () => <button class="redo" />,
					extend: () => <button class="extend" />
				}}
			</EditorToolbar>
		));
		await flush();

		expect(wrapper.attributes('id')).toBe('toolbar');
		expect(wrapper.find('.ql-bold').exists()).toBe(true);
		expect(wrapper.find('.upload-image').exists()).toBe(true);
		expect(wrapper.find('.undo').exists()).toBe(true);
		expect(wrapper.find('.redo').exists()).toBe(true);
		expect(wrapper.find('.extend').exists()).toBe(true);
		expect(wrapper.find('select.ql-header').exists()).toBe(true);
		expect(wrapper.find('button.ql-script').attributes('value')).toBe('sub');
		expect(Load.style).toHaveBeenCalled();

		const click = new MouseEvent('click', { bubbles: true, cancelable: true });
		const preventDefault = vi.spyOn(click, 'preventDefault');
		wrapper.element.dispatchEvent(click);
		expect(preventDefault).toHaveBeenCalledTimes(1);

		wrapper.unmount();
		expect(Load.removeStyle).toHaveBeenCalledTimes(3);
	});

	it('accepts options.container and falls back to default toolbar', async () => {
		const wrapper = mount(() => (
			<EditorToolbar options={{ container: ['italic'] }} />
		));
		expect(wrapper.find('.ql-italic').exists()).toBe(true);
		wrapper.unmount();

		const defaultWrapper = mount(() => (<EditorToolbar />));
		expect(defaultWrapper.find('.ql-bold').exists()).toBe(true);
		defaultWrapper.unmount();
	});
});

describe('EditorView and utils', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.clearAllMocks();
	});

	it('inserts and removes custom style rules', () => {
		insertFontSizeStyle(['12px'], 'font-style');
		insertLineHeightStyle(['1.5'], 'line-style');
		insertLetterSpacingStyle(['2px'], 'letter-style');

		expect(Load.style).toHaveBeenCalledWith(expect.stringContaining('12px'), { id: 'font-style' });
		expect(Load.style).toHaveBeenCalledWith(expect.stringContaining('1.5'), { id: 'line-style' });
		expect(Load.style).toHaveBeenCalledWith(expect.stringContaining('2px'), { id: 'letter-style' });
	});

	it('renders html, initializes preview listener and cleans styles', async () => {
		const previewOpen = vi.spyOn(ImagePreview, 'open').mockReturnValue({} as any);
		const host = document.createElement('div');
		host.className = 'vc-quilleditor-view ql-snow';
		const editor = document.createElement('div');
		editor.className = 'ql-editor';
		const image = document.createElement('img');
		Object.defineProperty(image, 'currentSrc', {
			value: 'second.png',
			configurable: true
		});
		editor.appendChild(image);
		host.appendChild(editor);
		document.body.appendChild(host);

		const wrapper = mount(() => (
			<EditorView
				value={'<p>hello</p><img src="first.png"><img src="second.png">'}
				fontSize={['13px']}
				lineHeight={['1.2']}
				letterSpacing={['1px']}
			/>
		), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.vc-editor-view').exists()).toBe(true);
		expect(wrapper.find('.ql-editor').html()).toContain('hello');

		image.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(previewOpen).toHaveBeenCalledWith({
			current: 1,
			data: ['first.png', 'second.png']
		});

		wrapper.unmount();
		expect(Load.removeStyle).toHaveBeenCalledTimes(3);
	});

	it('handles empty editor view value', () => {
		const wrapper = mount(() => (<EditorView />));
		expect(wrapper.find('.ql-editor').html()).toContain('ql-editor');
		wrapper.unmount();
	});
});

describe('Editor extends', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('inserts image, file, audio and video by file type', () => {
		const context = makeEditorContext();

		insertFile({ value: 'https://site/a.png', target: { name: 'a.png' } }, context);
		expect(context.editor.insertEmbed).toHaveBeenCalledWith(2, 'image', 'https://site/a.png');
		expect(context.editor.setSelection).toHaveBeenLastCalledWith(3);

		insertFile({ value: 'https://site/doc.pdf', target: { name: 'doc.pdf' } }, context);
		expect(context.editor.insertText).toHaveBeenCalledWith(2, 'doc.pdf');
		expect(context.editor.format).toHaveBeenCalledWith('link', 'https://site/doc.pdf');

		insertFile({ value: 'https://site/a.mp3', target: { name: 'a.mp3' } }, context);
		expect(context.editor.insertEmbed).toHaveBeenCalledWith(2, 'vc/audio', {
			src: 'https://site/a.mp3',
			poster: 'audio:https://site/a.mp3'
		});

		insertFile({ value: 'https://site/a.mp4', target: { name: 'a.mp4' } }, context);
		expect(context.editor.insertEmbed).toHaveBeenCalledWith(2, 'vc/video', {
			src: 'https://site/a.mp4',
			poster: 'video:https://site/a.mp4'
		});

		insertFile({ value: 'https://site/no-name.png' }, context);
		expect(context.editor.insertEmbed).toHaveBeenCalledWith(2, 'image', 'https://site/no-name.png');
	});

	it('uploads files through Upload.open for picker and silent file modes', () => {
		const uploadFiles = vi.fn();
		const uploadOpen = vi.spyOn(Upload, 'open').mockImplementation((options: any) => {
			options.onBegin();
			options.onComplete();
			options.onFileSuccess({ url: 'https://site/a.png' }, { target: { name: 'a.png' } });
			return { wrapper: { uploadFiles } } as any;
		});
		const context = makeEditorContext();

		uploadFile('image', context);
		expect(uploadOpen).toHaveBeenCalledWith(expect.objectContaining({
			slient: false,
			accept: 'image/*'
		}));
		expect(context.parent.onLoading).toHaveBeenCalledTimes(1);
		expect(context.parent.onLoaded).toHaveBeenCalledTimes(1);

		const file = new File(['a'], 'a.png', { type: 'image/png' });
		uploadFile(file, context);
		expect(uploadOpen).toHaveBeenLastCalledWith(expect.objectContaining({
			slient: true,
			accept: undefined
		}));
		expect(uploadFiles).toHaveBeenCalledWith([file]);
	});

	it('registers and exercises event module handlers', () => {
		registerEventModule(Quill);
		registerEventModule(Quill);
		const EventModule = Quill.import('modules/EventExtend') as any;
		const ImageBlot = Quill.import('formats/image') as any;
		const unmounted: Function[] = [];
		const uploadOpen = vi.spyOn(Upload, 'open').mockReturnValue({} as any);
		const previewOpen = vi.spyOn(ImagePreview, 'open').mockReturnValue({} as any);
		const image1 = document.createElement('img');
		const image2 = document.createElement('img');
		image1.src = 'https://site/a.png';
		image2.src = 'https://site/b.png';
		const target = image2;
		const current = Object.assign(Object.create(ImageBlot.prototype), { domNode: image2 });
		vi.spyOn(Quill, 'find').mockReturnValue(current);
		const root = {
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			contains: vi.fn(() => true),
			querySelectorAll: vi.fn(() => [image1, image2])
		};
		const editor = {
			root,
			options: {
				[EXTENDS_CONTEXT_KEY]: {
					previewable: true,
					onUnmounted: (fn: Function) => unmounted.push(fn),
					onLoading: vi.fn(),
					onLoaded: vi.fn()
				}
			}
		};
		const module = new EventModule(editor);

		expect(root.addEventListener).toHaveBeenCalledTimes(3);
		const pasteEvent = {
			target,
			preventDefault: vi.fn(),
			clipboardData: {
				files: [{ name: 'a.png', type: 'image/png' }],
				getData: vi.fn(() => '')
			}
		};
		module.handlePaste(pasteEvent);
		expect(pasteEvent.preventDefault).toHaveBeenCalledTimes(1);
		expect(uploadOpen).toHaveBeenCalled();

		pasteEvent.clipboardData.getData = vi.fn(() => 'text');
		module.handlePaste(pasteEvent);
		expect(pasteEvent.preventDefault).toHaveBeenCalledTimes(1);

		const selection = { setBaseAndExtent: vi.fn() };
		(document as any).caretRangeFromPoint = vi.fn(() => ({
			startContainer: document.body,
			startOffset: 0
		}));
		vi.spyOn(document, 'getSelection').mockReturnValue(selection as any);
		const dropEvent = {
			target,
			preventDefault: vi.fn(),
			clientX: 1,
			clientY: 2,
			dataTransfer: {
				files: [{ name: 'a.png', type: 'image/png' }]
			}
		};
		module.handleDrop(dropEvent);
		expect(dropEvent.preventDefault).toHaveBeenCalledTimes(1);
		expect(selection.setBaseAndExtent).toHaveBeenCalled();

		module.handlePreview({ target });
		expect(previewOpen).toHaveBeenCalledWith({
			current: 1,
			data: ['https://site/a.png', 'https://site/b.png']
		});

		editor.options[EXTENDS_CONTEXT_KEY].previewable = false;
		module.handlePreview({ target });
		expect(previewOpen).toHaveBeenCalledTimes(1);

		root.contains.mockReturnValue(false);
		module.handlePaste(pasteEvent);
		module.handleDrop(dropEvent);
		expect(uploadOpen).toHaveBeenCalled();

		unmounted[0]();
		expect(root.removeEventListener).toHaveBeenCalledTimes(3);
	});

	it('registers media blots and style attributors', () => {
		registerVideoBlot(Quill);
		registerAudioBlot(Quill);
		registerFontSize(Quill);
		registerLineHeight(Quill);
		registerLetterSpacing(Quill);

		const VideoBlot = Quill.import('formats/vc/video') as any;
		const videoNode = VideoBlot.create({
			src: 'video.mp4',
			poster: 'poster.png'
		});
		expect(videoNode.getAttribute('src')).toBe('video.mp4');
		expect(videoNode.getAttribute('poster')).toBe('poster.png');
		expect(VideoBlot.value(videoNode)).toEqual(expect.objectContaining({
			url: 'video.mp4',
			poster: 'poster.png'
		}));

		const AudioBlot = Quill.import('formats/vc/audio') as any;
		const audioNode = AudioBlot.create({ src: 'audio.mp3' });
		expect(audioNode.getAttribute('src')).toBe('audio.mp3');
		expect(AudioBlot.value(audioNode)).toEqual({ url: 'audio.mp3' });

		expect(getWhitelist(Quill.import('formats/font-size'))).toEqual(toolbarDefaultsMap['font-size']);
		expect(getWhitelist(Quill.import('formats/line-height'))).toEqual(toolbarDefaultsMap['line-height']);
		expect(getWhitelist(Quill.import('formats/letter-spacing'))).toEqual(toolbarDefaultsMap['letter-spacing']);

		registerVideoBlot(Quill);
		registerAudioBlot(Quill);
		expect(Quill.import('formats/vc/video')).toBe(VideoBlot);
		expect(Quill.import('formats/vc/audio')).toBe(AudioBlot);
	});

	it('exposes editor defaults', () => {
		expect(defaults.theme).toBe('snow');
		expect(defaults.toolbar.flat(Infinity)).toContain('upload/image');
	});
});
