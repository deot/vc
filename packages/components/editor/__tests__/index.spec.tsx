// @vitest-environment jsdom

import { Editor, EditorView, MEditor, MEditorView } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import Quill from 'quill';
import { defineComponent, nextTick, ref } from 'vue';
import { enUS, zhCN } from '@deot/vc-locale';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorToolbar, parseToolbar } from '../toolbar';
import { VcInstance } from '../../vc';
import { ImagePreview } from '../../file-preview';
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
import { getToolbarValues } from '../extends/style-attributor';
import { registerExtends } from '../extends';
import { normalizeHTML } from '../utils';
import { useEditor, emits as editorEmits } from '../use-editor';
import { props as mobileEditorProps } from '../mobile/editor-props';

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
			poster: vi.fn(({ value, type }: { value: string; type: string }) => `${type}:${value}`),
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
		VcInstance.configure({ locale: zhCN });
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

	it('updates the default placeholder with locale and preserves explicit overrides', async () => {
		const wrapper = mount(Editor, { attachTo: document.body });
		await flush();
		const editor = getEditor(wrapper);
		const headerLabel = () => wrapper.find('.vc-editor__select.is-header .vc-editor__select-label').text();
		expect(editor.root.dataset.placeholder).toBe('请输入内容');
		expect(headerLabel()).toBe('文本');
		VcInstance.configure({ locale: enUS });
		await flush();
		expect(editor.root.dataset.placeholder).toBe('Please enter content');
		// 工具栏文案直接跟随 locale
		expect(headerLabel()).toBe('Normal');
		await wrapper.setProps({ options: { placeholder: '' } });
		expect(editor.root.dataset.placeholder).toBe('');
		VcInstance.configure({ locale: zhCN });
		await flush();
		expect(editor.root.dataset.placeholder).toBe('');
		await wrapper.setProps({ options: { placeholder: 'Custom' } });
		expect(editor.root.dataset.placeholder).toBe('Custom');
		wrapper.unmount();
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
		// 工具栏由组件渲染，不使用 Quill 的 toolbar 模块与 snow 主题
		expect(editor.getModule('toolbar')).toBeUndefined();
		expect(editor.container.classList.contains('ql-snow')).toBe(false);
		expect(editor.options[EXTENDS_CONTEXT_KEY].previewable).toBe(true);
		expect(wrapper.findComponent(EditorToolbar).exists()).toBe(true);
		// 数值取值的按钮（{ header: 1 }）也会渲染
		expect(wrapper.findAll('.vc-editor__tool.is-header')).toHaveLength(2);

		wrapper.unmount();
	});

	it('merges global and prop options and supports custom toolbar slot', async () => {
		const CustomModule = vi.fn();
		Quill.register('modules/custom', CustomModule as any, true);
		VcInstance.options.Editor!.options = {
			placeholder: 'global',
			modules: { custom: true },
			toolbar: ['bold']
		};
		const wrapper = mount(Editor, {
			attachTo: document.body,
			props: {
				options: { placeholder: 'local', modules: { history: true, toolbar: '#ignored' } }
			},
			slots: {
				toolbar: ({ formats, format }: any) => (
					<div class="custom-toolbar">
						<button class={['custom-bold', { 'is-active': formats.bold }]} onClick={() => format('bold', undefined, true)} />
					</div>
				)
			}
		});
		await flush();

		const editor = getEditor(wrapper);
		expect(editor.options.placeholder).toBe('local');
		expect(CustomModule).toHaveBeenCalled();
		expect(editor.options.modules.custom).toEqual({});
		expect(editor.options.modules.history).toBeDefined();
		expect(editor.getModule('toolbar')).toBeUndefined();
		expect(wrapper.find('.custom-toolbar').exists()).toBe(true);
		expect(wrapper.findComponent(EditorToolbar).exists()).toBe(false);

		// 插槽拿到 formats / format，不需要对齐 id
		editor.setContents([{ insert: 'abc\n' }]);
		editor.setSelection(0, 3);
		await wrapper.find('.custom-bold').trigger('click');
		expect(editor.getFormat(0, 3).bold).toBe(true);
		expect(wrapper.find('.custom-bold').classes()).toContain('is-active');

		wrapper.unmount();
	});

	it('emits focus, blur and text-change events and notifies form item', async () => {
		const formChange = vi.fn();
		const formBlur = vi.fn();
		const value = { current: '' };
		const wrapper = mount(Editor, {
			attachTo: document.body,
			props: {
				'modelValue': value.current,
				'onUpdate:modelValue': (v: string) => (value.current = v)
			},
			global: {
				provide: {
					'vc-form-item': { change: formChange, blur: formBlur }
				}
			}
		});
		await flush();

		const editor = getEditor(wrapper);
		const getSemanticHTML = vi.spyOn(editor, 'getSemanticHTML');
		// 光标在编辑区内移动不重复触发 focus
		emitEditorEvent(editor, 'selection-change', { index: 1 });
		emitEditorEvent(editor, 'selection-change', { index: 2 });
		emitEditorEvent(editor, 'selection-change', null);
		emitEditorEvent(editor, 'selection-change', null);
		getSemanticHTML.mockReturnValue('<p>Hello</p>');
		emitEditorEvent(editor, 'text-change');
		await flush();

		expect(wrapper.emitted('focus')).toEqual([[{ value: '', editor }]]);
		expect(wrapper.emitted('blur')).toEqual([[{ value: '', editor }]]);
		expect(formBlur).toHaveBeenCalledTimes(1);
		expect(value.current).toBe('<p>Hello</p>');
		expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['<p>Hello</p>']);
		expect(wrapper.emitted('input')?.[0]).toEqual([{ value: '<p>Hello</p>', editor }]);
		expect(wrapper.emitted('change')?.[0]).toEqual([{ value: '<p>Hello</p>', editor }]);
		expect(formChange).toHaveBeenCalledWith('<p>Hello</p>');

		// 空格还原为普通空格，英文可以换行
		getSemanticHTML.mockReturnValue('<p>a&nbsp;b</p>');
		emitEditorEvent(editor, 'text-change');
		expect(value.current).toBe('<p>a b</p>');

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
			const result = {
				total: 1,
				completed: 1,
				succeeded: 1,
				failed: 0,
				responses: [],
				queues: []
			};
			const file = { target: { name: 'a.png' } };
			options.onBegin?.({ rawFiles: [], files: [file] });
			options.onFileSuccess?.({
				response: { value: 'https://site/a.png' },
				file,
				result
			});
			options.onComplete?.({ result });
			return { wrapper: { uploadFiles } } as any;
		});
		const poster = vi.fn(() => 'https://site/cover.png');
		const wrapper = mount(Editor, { attachTo: document.body, props: { poster } });
		await flush();

		const editor = getEditor(wrapper);
		const undo = vi.spyOn(editor.history, 'undo');
		const redo = vi.spyOn(editor.history, 'redo');
		const insertText = vi.spyOn(editor, 'insertText');
		const format = vi.spyOn(editor, 'format');
		const icons = wrapper.findAll('.vc-editor__tool.is-upload');
		await icons[0].trigger('click');
		expect(uploadOpen).toHaveBeenCalledWith(expect.objectContaining({ accept: 'video/*' }));

		await wrapper.find('.vc-editor__tool.is-undo').trigger('click');
		await wrapper.find('.vc-editor__tool.is-redo').trigger('click');
		expect(undo).toHaveBeenCalledTimes(1);
		expect(redo).toHaveBeenCalledTimes(1);

		// 禁用时上传、撤销、重做都不响应
		await wrapper.setProps({ disabled: true });
		uploadOpen.mockClear();
		await icons[0].trigger('click');
		await wrapper.find('.vc-editor__tool.is-undo').trigger('click');
		await wrapper.find('.vc-editor__tool.is-redo').trigger('click');
		expect(uploadOpen).not.toHaveBeenCalled();
		expect(undo).toHaveBeenCalledTimes(1);
		expect(redo).toHaveBeenCalledTimes(1);
		await wrapper.setProps({ disabled: false });

		(wrapper.vm as any).add([{ value: 'https://site/file.txt', target: { name: 'file.txt' } }]);
		expect(insertText).toHaveBeenCalledWith(expect.any(Number), 'file.txt');
		expect(format).toHaveBeenCalledWith('link', 'https://site/file.txt');

		// poster 传到视频插入流程
		(wrapper.vm as any).add([{ value: 'https://site/a.mp4', target: { name: 'a.mp4' } }]);
		expect(poster).toHaveBeenCalledWith({ value: 'https://site/a.mp4', type: 'video' });
		expect(editor.root.querySelector('video')?.getAttribute('poster')).toBe('https://site/cover.png');

		wrapper.unmount();
	});

	it('keeps the spin until every concurrent upload completes', async () => {
		const completes: Array<() => void> = [];
		vi.spyOn(Upload, 'open').mockImplementation((options: any) => {
			options.onBegin?.({ rawFiles: [], files: [] });
			completes.push(() => options.onComplete?.({ result: {} }));
			return {} as any;
		});
		const wrapper = mount(Editor, { attachTo: document.body });
		await flush();

		const spin = () => (wrapper.find('.vc-editor__spin').element as HTMLElement).style.display;
		const icons = wrapper.findAll('.vc-editor__tool.is-upload');
		await icons[0].trigger('click');
		await icons[1].trigger('click');
		await flush();
		expect(spin()).toBe('');

		completes[0]();
		await nextTick();
		expect(spin()).toBe('');

		completes[1]();
		await nextTick();
		expect(spin()).toBe('none');

		wrapper.unmount();
	});

	it('respects prop enhancer and global enhancer before default upload', async () => {
		const propEnhancer = vi.fn(async () => true);
		const uploadOpen = vi.spyOn(Upload, 'open').mockReturnValue({} as any);
		const wrapper = mount(() => (
			<Editor enhancer={propEnhancer} />
		), { attachTo: document.body });
		await flush();

		await wrapper.findAll('.vc-editor__tool.is-upload')[0].trigger('click');
		expect(propEnhancer).toHaveBeenCalledWith({ instance: expect.anything(), type: 'video', types: ['video'], mobile: false });
		expect(uploadOpen).not.toHaveBeenCalled();
		wrapper.unmount();

		VcInstance.options.UploadPicker!.enhancer = vi.fn(async () => true);
		const wrapper2 = mount(() => (<Editor enhancer />), { attachTo: document.body });
		await flush();
		await wrapper2.findAll('.vc-editor__tool.is-upload')[1].trigger('click');
		expect(VcInstance.options.UploadPicker!.enhancer).toHaveBeenCalledWith({
			instance: expect.anything(),
			type: 'image',
			types: ['image'],
			mobile: false
		});

		wrapper2.unmount();
	});
});

describe('EditorToolbar', () => {
	beforeEach(() => {
		(window as any).quill = Quill;
	});

	afterEach(() => {
		delete (window as any).quill;
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	const mountEditor = async (toolbar?: any[]) => {
		const wrapper = mount(Editor, {
			attachTo: document.body,
			props: toolbar ? { options: { toolbar } } : {}
		});
		await flush();
		const editor = getEditor(wrapper);
		editor.setContents([{ insert: 'hello world\n' }]);
		return { wrapper, editor };
	};

	it('parses toolbar config into groups', () => {
		const groups = parseToolbar([
			['bold', 'upload/image', 'undo', 'link', 'image'],
			{ header: [1, 2, 'selected'] },
			{ script: 'sub' },
			'color',
			[[{ header: 1 }]]
		]);
		expect(groups).toEqual([
			[
				{ type: 'button', name: 'bold' },
				{ type: 'upload', value: 'image' },
				{ type: 'action', name: 'undo' },
				{ type: 'prompt', name: 'link' },
				{ type: 'upload', value: 'image' }
			],
			// 相邻的散项合成一组
			[
				{ type: 'select', name: 'header', options: [1, 2, false] },
				{ type: 'button', name: 'script', value: 'sub' },
				{ type: 'color', name: 'color', options: expect.arrayContaining([false, '#e60000']) }
			],
			[{ type: 'button', name: 'header', value: 1 }]
		]);
		expect(parseToolbar({ container: ['italic'] })).toEqual([[{ type: 'button', name: 'italic' }]]);
		expect(parseToolbar(undefined).flat().length).toBeGreaterThan(20);
	});

	it('toggles buttons and reflects the active formats', async () => {
		const { wrapper, editor } = await mountEditor([
			['bold', { list: 'check' }, { indent: '+1' }, { indent: '-1' }, { direction: 'rtl' }, 'clean']
		]);
		const tool = (name: string, index = 0) => wrapper.findAll(`.vc-editor__tool.is-${name}`)[index];

		editor.setSelection(0, 5);
		await tool('bold').trigger('click');
		expect(editor.getFormat(0, 5).bold).toBe(true);
		expect(tool('bold').classes()).toContain('is-active');
		expect(tool('bold').attributes('aria-pressed')).toBe('true');
		await tool('bold').trigger('click');
		expect(editor.getFormat(0, 5).bold).toBeUndefined();

		// 待办列表在 checked / unchecked 间都算激活，再点取消
		await tool('list').trigger('click');
		expect(editor.getFormat(0, 1).list).toBe('unchecked');
		expect(tool('list').classes()).toContain('is-active');
		await tool('list').trigger('click');
		expect(editor.getFormat(0, 1).list).toBeUndefined();

		await tool('indent', 0).trigger('click');
		await tool('indent', 0).trigger('click');
		expect(editor.getFormat(0, 1).indent).toBe(2);
		await tool('indent', 1).trigger('click');
		expect(editor.getFormat(0, 1).indent).toBe(1);

		// 切到从右到左时一并右对齐
		await tool('direction').trigger('click');
		expect(editor.getFormat(0, 1)).toEqual(expect.objectContaining({ direction: 'rtl', align: 'right' }));
		await tool('direction').trigger('click');
		expect(editor.getFormat(0, 1).align).toBeUndefined();

		editor.formatText(0, 5, 'italic', true);
		editor.setSelection(0, 5);
		await tool('clean').trigger('click');
		expect(editor.getFormat(0, 5).italic).toBeUndefined();

		wrapper.unmount();
	});

	it('applies selects and colors from the popups', async () => {
		const { wrapper, editor } = await mountEditor([
			[{ header: [1, 2, false] }, { color: ['#ff0000', 'selected'] }, 'line-height']
		]);

		editor.setSelection(0, 5);
		await wrapper.find('.vc-editor__select.is-header').trigger('click');
		await flush();
		const items = document.querySelectorAll<HTMLElement>('.vc-editor-dropdown .vc-dropdown-item');
		expect(Array.from(items).map(item => item.textContent)).toEqual(['标题1', '标题2', '文本']);
		items[1].click();
		await flush();
		expect(editor.getFormat(0, 1).header).toBe(2);
		expect(wrapper.find('.vc-editor__select.is-header .vc-editor__select-label').text()).toBe('标题2');

		editor.setSelection(0, 5);
		await wrapper.find('.vc-editor__color').trigger('click');
		await flush();
		const swatches = document.querySelectorAll<HTMLElement>('.vc-editor-color__item');
		expect(swatches).toHaveLength(2);
		expect(swatches[1].classList.contains('is-default')).toBe(true);
		swatches[0].click();
		await flush();
		expect(editor.getFormat(0, 5).color).toBe('#ff0000');
		expect((wrapper.find('.vc-editor__color-bar').element as HTMLElement).style.background).toBe('rgb(255, 0, 0)');

		expect(wrapper.find('.vc-editor__select.is-line-height .vc-editor__select-label').text()).toBe('行高：1');

		wrapper.unmount();
	});

	it('keeps the editor focused when pressing the toolbar and disables it with the editor', async () => {
		const { wrapper } = await mountEditor([['bold']]);
		const toolbar = wrapper.find('.vc-editor__toolbar').element;

		const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
		wrapper.find('.vc-editor__tool.is-bold').element.dispatchEvent(press);
		expect(press.defaultPrevented).toBe(true);

		// extend 插槽里的输入框可以正常聚焦
		const input = document.createElement('input');
		toolbar.appendChild(input);
		const pressInput = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
		input.dispatchEvent(pressInput);
		expect(pressInput.defaultPrevented).toBe(false);
		input.remove();

		await wrapper.setProps({ disabled: true });
		expect(wrapper.classes()).toContain('is-disabled');
		expect(wrapper.find('.vc-editor__tool.is-bold').attributes('disabled')).toBeDefined();

		wrapper.unmount();
	});

	it('edits, previews and removes links through the prompt', async () => {
		const { wrapper, editor } = await mountEditor([['link', 'video']]);
		const getInput = () => document.querySelector<HTMLInputElement>('.vc-editor-prompt input');
		const save = async (value: string) => {
			const input = getInput()!;
			input.value = value;
			input.dispatchEvent(new Event('input'));
			await flush();
			input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13 }));
			input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13 }));
			await flush();
		};

		// 选中文字后加链接
		editor.setSelection(0, 5);
		await wrapper.find('.vc-editor__tool.is-link').trigger('click');
		await flush();
		expect(getInput()).not.toBeNull();
		await save('https://site/a');
		expect(editor.getFormat(0, 5).link).toBe('https://site/a');

		// 光标停在链接里显示预览
		editor.setSelection(2, 0, 'user');
		await flush();
		expect(document.querySelector('.vc-editor-prompt.is-preview a')?.getAttribute('href')).toBe('https://site/a');

		// 编辑作用于整个链接
		(document.querySelectorAll<HTMLElement>('.vc-editor-prompt__action')[0]).click();
		await flush();
		expect(getInput()!.value).toBe('https://site/a');
		await save('https://site/b');
		expect(editor.getFormat(0, 5).link).toBe('https://site/b');

		editor.setSelection(2, 0, 'user');
		await flush();
		(document.querySelectorAll<HTMLElement>('.vc-editor-prompt__action')[1]).click();
		await flush();
		expect(editor.getFormat(0, 5).link).toBeUndefined();

		// 没有选中文字时插入地址本身
		editor.setSelection(11, 0, 'user');
		await wrapper.find('.vc-editor__tool.is-link').trigger('click');
		await flush();
		await save('https://site/c');
		expect(editor.getText()).toBe('hello worldhttps://site/c\n');
		expect(editor.getFormat(11, 14).link).toBe('https://site/c');

		// Ctrl / Cmd + K 打开链接输入
		// 打开时按当前选区重置输入：上一次输入的地址被清空
		expect(getInput()!.value).toBe('https://site/c');
		editor.setSelection(0, 5, 'user');
		editor.root.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
		await flush();
		expect(getInput()!.value).toBe('');

		wrapper.unmount();
	});
});

describe('EditorView and utils', () => {
	it('renders value as HTML', () => {
		const wrapper = mount(() => (<EditorView value="<p class='inner'>text</p>" />));
		expect(wrapper.find('.ql-editor .inner').exists()).toBe(true);
		wrapper.unmount();

		const empty = mount(() => (<EditorView />));
		expect(empty.find('.ql-editor').exists()).toBe(true);
		empty.unmount();
	});

	it('value goes through the global sanitize, which can tell EditorView apart by instance.parent', () => {
		const sanitize = vi.fn(({ value, instance }) => {
			// 富文本放行图片，其它内容去掉
			return instance.parent?.type.name === 'vc-editor-view' ? value.replace(/<script[^>]*>.*?<\/script>/g, '') : '';
		});
		VcInstance.configure({ sanitize });
		try {
			const wrapper = mount(() => (
				<EditorView value={'<p class="inner">text</p><img src="a.png"><script>window.x = 1<\/script>'} />
			));
			expect(sanitize).toHaveBeenCalledTimes(1);
			expect(wrapper.find('.ql-editor .inner').exists()).toBe(true);
			expect(wrapper.find('.ql-editor img').exists()).toBe(true);
			expect(wrapper.find('.ql-editor script').exists()).toBe(false);
			wrapper.unmount();
		} finally {
			VcInstance.configure({ sanitize: void 0 });
		}
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.clearAllMocks();
	});

	it('renders html', async () => {
		const wrapper = mount(() => (
			<EditorView value="<p>hello</p>" />
		), { attachTo: document.body });
		await flush();

		expect(wrapper.find('.vc-editor-view').exists()).toBe(true);
		expect(wrapper.find('.ql-editor').html()).toContain('hello');

		wrapper.unmount();
	});

	it('restores spaces turned into &nbsp; by getSemanticHTML', () => {
		expect(normalizeHTML('<p>a&nbsp;b</p>')).toBe('<p>a b</p>');
		// 连续空格交替保留 &nbsp;，段首段尾保留 &nbsp;
		expect(normalizeHTML('<p>a&nbsp;&nbsp;&nbsp;b</p>')).toBe('<p>a &nbsp; b</p>');
		expect(normalizeHTML('<p>&nbsp;a&nbsp;</p>')).toBe('<p>&nbsp;a&nbsp;</p>');
		// 跨行内元素按整段判断
		expect(normalizeHTML('<p><strong>a</strong>&nbsp;b&nbsp;<em>c</em></p>')).toBe('<p><strong>a</strong> b <em>c</em></p>');
		expect(normalizeHTML('<ol><li>a&nbsp;b</li></ol><h1>c&nbsp;d</h1>')).toBe('<ol><li>a b</li></ol><h1>c d</h1>');
		// pre / code 原样保留
		expect(normalizeHTML('<pre>a&nbsp;&nbsp;b</pre>')).toBe('<pre>a&nbsp;&nbsp;b</pre>');
		expect(normalizeHTML('<p>x&nbsp;<code>a&nbsp;b</code></p>')).toBe('<p>x <code>a&nbsp;b</code></p>');
		expect(normalizeHTML('<p>plain</p>')).toBe('<p>plain</p>');
	});

	it('opens the preview when an image inside the view is clicked', async () => {
		const previewOpen = vi.spyOn(ImagePreview, 'open').mockReturnValue({} as any);
		const wrapper = mount(() => (
			<EditorView
				value={'<p>hello</p><img src="https://example.com/first.png"><p><img src="https://example.com/second.png"></p>'}
			/>
		), { attachTo: document.body });
		await flush();

		await wrapper.find('p').trigger('click');
		expect(previewOpen).not.toHaveBeenCalled();

		const images = wrapper.findAll('img').map(i => i.element);
		await wrapper.findAll('img')[1].trigger('click');
		expect(previewOpen).toHaveBeenCalledTimes(1);
		expect(previewOpen).toHaveBeenCalledWith({
			current: 1,
			data: [
				{ source: 'https://example.com/first.png', element: images[0] },
				{ source: 'https://example.com/second.png', element: images[1] }
			]
		});

		wrapper.unmount();
	});

	it('previews the clicked one among images sharing a source, and follows value changes', async () => {
		const previewOpen = vi.spyOn(ImagePreview, 'open').mockReturnValue({} as any);
		const value = ref('<img src="https://example.com/same.png"><img src="https://example.com/same.png">');
		const wrapper = mount(() => (<EditorView value={value.value} />), { attachTo: document.body });
		await flush();

		const same = wrapper.findAll('img').map(i => i.element);
		await wrapper.findAll('img')[1].trigger('click');
		expect(previewOpen).toHaveBeenLastCalledWith({
			current: 1,
			data: same.map(element => ({ source: 'https://example.com/same.png', element }))
		});

		value.value = '<img src="https://example.com/next.png">';
		await flush();
		await wrapper.find('img').trigger('click');
		expect(previewOpen).toHaveBeenLastCalledWith({
			current: 0,
			data: [{ source: 'https://example.com/next.png', element: wrapper.find('img').element }]
		});

		wrapper.unmount();
	});

	it('skips the preview when previewable is false', async () => {
		const previewOpen = vi.spyOn(ImagePreview, 'open').mockReturnValue({} as any);
		const previewable = ref(false);
		const wrapper = mount(() => (
			<EditorView value={'<img src="https://example.com/first.png">'} previewable={previewable.value} />
		), { attachTo: document.body });
		await flush();

		await wrapper.find('img').trigger('click');
		expect(previewOpen).not.toHaveBeenCalled();

		previewable.value = true;
		await flush();
		await wrapper.find('img').trigger('click');
		expect(previewOpen).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('leaves images outside the view alone', async () => {
		const previewOpen = vi.spyOn(ImagePreview, 'open').mockReturnValue({} as any);
		const outside = document.createElement('div');
		outside.className = 'ql-editor';
		outside.innerHTML = '<img src="https://example.com/outside.png">';
		document.body.appendChild(outside);

		const wrapper = mount(() => (<EditorView value={'<img src="https://example.com/inside.png">'} />), { attachTo: document.body });
		await flush();

		outside.querySelector('img')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		expect(previewOpen).not.toHaveBeenCalled();

		wrapper.unmount();
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
			src: 'https://site/a.mp3'
		});

		insertFile({ value: 'https://site/a.mp4', target: { name: 'a.mp4' } }, context);
		expect(context.editor.insertEmbed).toHaveBeenCalledWith(2, 'vc/video', {
			src: 'https://site/a.mp4',
			poster: 'video:https://site/a.mp4'
		});

		insertFile({ value: 'https://site/no-name.png' }, context);
		expect(context.editor.insertEmbed).toHaveBeenCalledWith(2, 'image', 'https://site/no-name.png');
	});

	it('derives name and type for bare urls through the FilePreview config', () => {
		const context = makeEditorContext();
		VcInstance.options.FilePreview!.getFileName = ({ source }) => (source.includes('download') ? '报价单.pdf' : undefined);
		VcInstance.options.FilePreview!.getFileType = ({ source }) => (/\.jpg!/.test(source) ? 'image' : undefined);
		try {
			insertFile({ value: 'https://site/download?id=1' }, context);
			expect(context.editor.insertText).toHaveBeenCalledWith(2, '报价单.pdf');
			expect(context.editor.format).toHaveBeenCalledWith('link', 'https://site/download?id=1');

			insertFile({ value: 'https://site/a.jpg!4-4' }, context);
			expect(context.editor.insertEmbed).toHaveBeenCalledWith(2, 'image', 'https://site/a.jpg!4-4');
		} finally {
			VcInstance.options.FilePreview!.getFileName = undefined;
			VcInstance.options.FilePreview!.getFileType = undefined;
		}
	});

	it('uploads files through Upload.open for picker and silent file modes', () => {
		const uploadFiles = vi.fn();
		const uploadOpen = vi.spyOn(Upload, 'open').mockImplementation((options: any) => {
			const result = {
				total: 1,
				completed: 1,
				succeeded: 1,
				failed: 0,
				responses: [],
				queues: []
			};
			const file = { target: { name: 'a.png' } };
			options.onBegin({ rawFiles: [], files: [file] });
			options.onFileSuccess({
				response: { url: 'https://site/a.png' },
				file,
				result
			});
			options.onComplete({ result });
			return { wrapper: { uploadFiles } } as any;
		});
		const context = makeEditorContext();

		uploadFile('image', context);
		expect(uploadOpen).toHaveBeenCalledWith(expect.objectContaining({
			silent: false,
			accept: 'image/*'
		}));
		expect(context.parent.onLoading).toHaveBeenCalledTimes(1);
		expect(context.parent.onLoaded).toHaveBeenCalledTimes(1);
		expect(context.editor.insertEmbed).toHaveBeenCalledWith(2, 'image', 'https://site/a.png');

		const file = new File(['a'], 'a.png', { type: 'image/png' });
		uploadFile(file, context);
		expect(uploadOpen).toHaveBeenLastCalledWith(expect.objectContaining({
			silent: true,
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
		let enabled = true;
		const editor = {
			root,
			isEnabled: () => enabled,
			clipboard: { addMatcher: vi.fn() },
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

		// 禁用时粘贴、拖入的文件都不上传
		enabled = false;
		uploadOpen.mockClear();
		pasteEvent.clipboardData.getData = vi.fn(() => '');
		module.handlePaste(pasteEvent);
		module.handleDrop(dropEvent);
		expect(uploadOpen).not.toHaveBeenCalled();
		enabled = true;
		pasteEvent.clipboardData.getData = vi.fn(() => 'text');

		module.handlePreview({ target });
		expect(previewOpen).toHaveBeenCalledWith({
			current: 1,
			data: [
				expect.objectContaining({ source: 'https://site/a.png' }),
				expect.objectContaining({ source: 'https://site/b.png' })
			]
		});

		editor.options[EXTENDS_CONTEXT_KEY].previewable = false;
		module.handlePreview({ target });
		expect(previewOpen).toHaveBeenCalledTimes(1);

		// 事件不在编辑区内时不处理
		root.contains.mockReturnValue(false);
		pasteEvent.clipboardData.getData = vi.fn(() => '');
		module.handlePaste(pasteEvent);
		module.handleDrop(dropEvent);
		expect(uploadOpen).not.toHaveBeenCalled();

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
		expect(getWhitelist(Quill.import('formats/line-height'))).toEqual(expect.arrayContaining(toolbarDefaultsMap['line-height']));
		// 浏览器读回时 2.0 → 2，两种写法都放行
		expect(getWhitelist(Quill.import('formats/line-height'))).toEqual(expect.arrayContaining(['2', '3']));
		expect(getWhitelist(Quill.import('formats/letter-spacing'))).toEqual(toolbarDefaultsMap['letter-spacing']);
		expect((Quill.import('formats/line-height') as any).scope).toBe((Quill.import('parchment') as any).Scope.BLOCK_ATTRIBUTE);

		registerVideoBlot(Quill);
		registerAudioBlot(Quill);
		expect(Quill.import('formats/vc/video')).toBe(VideoBlot);
		expect(Quill.import('formats/vc/audio')).toBe(AudioBlot);
	});

	it('merges configured toolbar values into the whitelists', () => {
		expect(getToolbarValues([['bold'], [{ 'font-size': ['13px', '14px'] }]], 'font-size')).toEqual([
			...toolbarDefaultsMap['font-size'],
			'13px'
		]);
		expect(getToolbarValues({ container: [{ 'line-height': ['1.5'] }] }, 'line-height')).toContain('1.5');
		expect(getToolbarValues(undefined, 'letter-spacing')).toEqual(toolbarDefaultsMap['letter-spacing']);

		registerExtends(Quill, [{ 'font-size': ['13px'] }]);
		const FontSize = Quill.import('formats/font-size');
		expect(getWhitelist(FontSize)).toContain('13px');
		// 再次注册只并入新值，不替换已注册的格式
		registerExtends(Quill, [{ 'font-size': ['15px'] }]);
		expect(Quill.import('formats/font-size')).toBe(FontSize);
		expect(getWhitelist(FontSize)).toEqual(expect.arrayContaining(['13px', '15px']));
	});

	it('applies line-height to whole lines and lifts it from old inline content', async () => {
		(window as any).quill = Quill;
		const wrapper = mount(Editor, { attachTo: document.body });
		await flush();
		const editor = getEditor(wrapper);

		editor.setContents([{ insert: 'abc\n' }]);
		editor.setSelection(1, 1);
		editor.format('line-height', '1', 'user');
		expect(editor.getContents().ops).toEqual([
			{ insert: 'abc' },
			{ insert: '\n', attributes: { 'line-height': '1' } }
		]);

		editor.clipboard.dangerouslyPasteHTML([
			'<p><span style="line-height: 2;">old</span> text</p>',
			'<ol><li><span style="line-height: 1.4;">x</span></li><li class="ql-align-center">y</li></ol>'
		].join(''));
		await flush();
		expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBe(
			'<p style="line-height: 2;">old text</p><ol><li style="line-height: 1.4;">x</li><li class="ql-align-center">y</li></ol>'
		);

		wrapper.unmount();
		delete (window as any).quill;
	});

	it('exposes editor defaults', () => {
		expect(defaults.theme).toBeUndefined();
		expect(defaults.toolbar.flat(Infinity)).toContain('upload/image');
	});
});

describe('MEditor', () => {
	beforeEach(() => {
		(window as any).quill = Quill;
	});

	afterEach(() => {
		delete (window as any).quill;
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	// 用假的移动端组件挂载 useEditor，断言调用参数
	const mountMobile = async (props: Record<string, any> = {}) => {
		const popupLeaf = { wrapper: { toggle: vi.fn() } };
		const components = {
			ActionSheet: { open: vi.fn<(options: Record<string, any>) => void>() },
			Popup: { open: vi.fn<(options: Record<string, any>) => typeof popupLeaf>(() => popupLeaf) },
			Input: { name: 'FakeInput', props: ['modelValue'], setup: () => () => <input class="fake-input" /> },
			Button: { name: 'FakeButton', setup: (_: any, { slots }: any) => () => <button class="fake-button">{slots.default?.()}</button> },
			ImagePreview: { open: vi.fn() }
		};
		const Host = defineComponent({
			props: mobileEditorProps,
			emits: [...editorEmits],
			setup: (p, context) => useEditor(p, context as any, { mobile: true, components })
		});
		const wrapper = mount(Host, { attachTo: document.body, props });
		await flush();
		const editor = getEditor(wrapper);
		editor.setContents([{ insert: 'hello world\n' }]);
		return { wrapper, editor, components, popupLeaf };
	};

	it('renders the marker classes and defaults toolbarPlacement to keyboard', async () => {
		const wrapper = mount(MEditor, { attachTo: document.body });
		await flush();
		expect(wrapper.classes()).toEqual(expect.arrayContaining(['vc-editor', 'vcm-editor']));
		expect(wrapper.props('toolbarPlacement')).toBe('keyboard');
		expect(wrapper.find('.vc-editor__toolbar').classes()).toContain('vcm-editor-toolbar');
		wrapper.unmount();

		const view = mount(() => <MEditorView value="<p>a</p>" />);
		expect(view.classes()).toEqual(expect.arrayContaining(['vc-editor-view', 'vcm-editor-view']));
		view.unmount();
	});

	it('opens the action sheet for selects and the popup for colors', async () => {
		const { wrapper, editor, components, popupLeaf } = await mountMobile({
			options: { toolbar: [[{ header: [1, 2, false] }, { color: ['#ff0000', 'selected'] }]] }
		});
		editor.setSelection(0, 5);

		await wrapper.findComponent(EditorToolbar).find('.vc-editor__select.is-header').trigger('click');
		const sheet = components.ActionSheet.open.mock.calls[0][0] as any;
		expect(sheet.data).toHaveLength(3);
		expect(sheet.data[2].class).toEqual(['vcm-editor-option', { 'is-selected': true }]);
		expect(sheet.cancelText).toBe('取消');
		sheet.onOk(sheet.data[1], 1);
		await flush();
		expect(editor.getFormat(0, 1).header).toBe(2);

		editor.setSelection(0, 5);
		await wrapper.findComponent(EditorToolbar).find('.vc-editor__color').trigger('click');
		const popup = components.Popup.open.mock.calls[0][0] as any;
		expect(popup.title).toBe('文字颜色');
		const panel = mount(() => popup.content());
		await panel.findAll('.vc-editor-color__item')[0].trigger('click');
		expect(popupLeaf.wrapper.toggle).toHaveBeenCalledWith(false);
		expect(editor.getFormat(0, 5).color).toBe('#ff0000');
		panel.unmount();

		wrapper.unmount();
	});

	it('edits links in the popup and passes mobile to the enhancer', async () => {
		const enhancer = vi.fn(async () => true);
		const { wrapper, editor, components } = await mountMobile({
			enhancer,
			options: { toolbar: [['link', 'upload/image']] }
		});
		editor.setSelection(0, 5);
		await wrapper.findComponent(EditorToolbar).find('.vc-editor__tool.is-link').trigger('click');
		await flush();
		const popup = components.Popup.open.mock.calls[0][0] as any;
		expect(popup.title).toBe('链接');
		const content = mount(() => popup.content());
		expect(content.find('.vc-editor-prompt.is-mobile .fake-input').exists()).toBe(true);
		content.unmount();

		await wrapper.findComponent(EditorToolbar).find('.vc-editor__tool.is-upload').trigger('click');
		expect(enhancer).toHaveBeenCalledWith(expect.objectContaining({ type: 'image', mobile: true }));

		wrapper.unmount();
	});

	it('docks the toolbar into Portal.element when it is configured', async () => {
		const viewport = Object.assign(new EventTarget(), { offsetTop: 0, offsetLeft: 0, width: 375, height: 500 });
		Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
		vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
		const host = document.createElement('div');
		document.body.appendChild(host);
		const original = { ...VcInstance.options.Portal };
		VcInstance.configure({ Portal: { ...original, element: host } });

		const { wrapper, editor } = await mountMobile();
		editor.emitter.emit('selection-change', { index: 0, length: 0 });
		await flush();
		// 停靠时移到弹层挂载点（Portal.element）下
		expect((document.querySelector('.vc-editor__toolbar') as HTMLElement).parentElement).toBe(host);

		wrapper.unmount();
		VcInstance.configure({ Portal: { ...original } });
		host.remove();
	});

	it('docks the toolbar above the keyboard while focused', async () => {
		const viewport = Object.assign(new EventTarget(), { offsetTop: 0, offsetLeft: 0, width: 375, height: 500 });
		// jsdom 没有 visualViewport
		Object.defineProperty(window, 'visualViewport', { configurable: true, value: viewport });
		vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);

		const { wrapper, editor } = await mountMobile();
		const holder = () => wrapper.find('.vc-editor__toolbar-holder');
		expect(holder().classes()).not.toContain('is-docked');

		const toolbar = () => document.querySelector('.vc-editor__toolbar') as HTMLElement;
		editor.emitter.emit('selection-change', { index: 0, length: 0 });
		await flush();
		expect(holder().classes()).toContain('is-docked');
		// 停靠时移到 body 下：脱离编辑器根节点的层叠上下文，不会被后面的内容盖住
		expect(toolbar().parentElement).toBe(document.body);
		expect(toolbar().classList.contains('is-docked')).toBe(true);
		expect(toolbar().style.bottom).toBe('300px');

		// 键盘收起：可视区变高，底边距跟着变
		viewport.height = 800;
		viewport.dispatchEvent(new Event('resize'));
		await sleep(50);
		await flush();
		expect(toolbar().style.bottom).toBe('0px');

		editor.emitter.emit('selection-change', null);
		await flush();
		expect(holder().classes()).not.toContain('is-docked');
		// 取消停靠：回到原位
		expect(holder().element.contains(toolbar())).toBe(true);
		expect(toolbar().classList.contains('is-docked')).toBe(false);

		// top 时不停靠
		await wrapper.setProps({ toolbarPlacement: 'top' });
		editor.emitter.emit('selection-change', { index: 0, length: 0 });
		await flush();
		expect(holder().classes()).not.toContain('is-docked');

		wrapper.unmount();
		delete (window as any).visualViewport;
	});
});
