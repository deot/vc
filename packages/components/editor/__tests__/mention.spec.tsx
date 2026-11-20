// @vitest-environment jsdom

import { Editor, MEditor } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import Quill from 'quill';
import { nextTick, ref } from 'vue';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMentions } from '../extends/mention-blot';

const sleep = (ms = 0) => new Promise<void>(resolve => setTimeout(resolve, ms));
const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const USERS = [{ value: 'u1', label: '成员甲' }, { value: 'u2', label: '成员乙' }, { value: 'u3', label: 'Alpha' }];

const getEditor = (wrapper: any): Quill => {
	const exposed = wrapper.findComponent({ name: 'vc-editor' }).exists()
		? (wrapper.findComponent({ name: 'vc-editor' }).vm as any).editor
		: (wrapper.findComponent({ name: 'vcm-editor' }).vm as any).editor;
	return exposed?.value || exposed;
};
const getOptions = () => Array.from(document.querySelectorAll('.vc-suggest .vc-select-option')) as HTMLElement[];
const getTexts = () => getOptions().map(el => el.textContent);
const isOpen = () => {
	const el = document.querySelector('.vc-suggest-wrapper') as HTMLElement | null;
	return !!el && el.style.display !== 'none';
};

const keydown = (key: string) => {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
	document.body.dispatchEvent(event);
	return event;
};

// jsdom 没有真实的选区：Quill 的 getSelection 改为返回给定位置，并通知编辑器变化
const typeAt = async (quill: Quill, text: string) => {
	quill.setText(text);
	const index = text.length;
	vi.spyOn(quill, 'getSelection').mockReturnValue({ index, length: 0 } as any);
	quill.emitter.emit('editor-change', 'selection-change', { index, length: 0 }, null, 'user');
	await flush();
};

const mountEditor = (props: Record<string, any> = {}, component: any = Editor) => {
	const value = ref(props.modelValue ?? '');
	const onMentionSelect = vi.fn();
	const Component = component;
	const wrapper = mount(() => (
		<Component
			mentionOptions={{ data: USERS }}
			{...props}
			modelValue={value.value}
			// @ts-ignore
			onUpdate:modelValue={(v: string) => (value.value = v)}
			onMentionSelect={onMentionSelect}
		/>
	), { attachTo: document.body });
	return { wrapper, value, onMentionSelect };
};

// jsdom 的 Range 没有尺寸：Quill 的 getBounds 用到
beforeAll(() => {
	if (!Range.prototype.getBoundingClientRect) {
		Range.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0, toJSON: () => {} });
	}
	if (!Range.prototype.getClientRects) {
		Range.prototype.getClientRects = () => [] as any;
	}
});

describe('Editor mention', () => {
	beforeEach(() => {
		(window as any).quill = Quill;
	});

	afterEach(() => {
		delete (window as any).quill;
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('光标前输入前缀后打开，按前缀之后的文字过滤；回车插入原子的提及节点与空格', async () => {
		const { wrapper, value, onMentionSelect } = mountEditor();
		await flush();
		const quill = getEditor(wrapper);
		await typeAt(quill, 'hi @成员');
		expect(isOpen()).toBe(true);
		expect(getTexts()).toEqual(['成员甲', '成员乙']);

		keydown('ArrowDown');
		const event = keydown('Enter');
		expect(event.defaultPrevented).toBe(true);
		await flush();

		const ops = quill.getContents().ops;
		expect(ops[0]).toEqual({ insert: 'hi ' });
		expect(ops[1]).toEqual({ insert: { 'vc/mention': { value: 'u2', prefix: '@', label: '成员乙' } } });
		expect(ops[2].insert).toBe(' \n');
		expect(value.value).toContain('<span class="vc-editor-mention" data-value="u2" data-prefix="@">@成员乙</span>');
		expect(onMentionSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 'u2', prefix: '@', editor: quill }));
		expect(getMentions(value.value)).toEqual([{ value: 'u2', prefix: '@', label: '成员乙' }]);
		wrapper.unmount();
	});

	it('回填的 HTML 还原为提及节点；提及节点后紧跟前缀不触发', async () => {
		const html = '<p>a <span class="vc-editor-mention" data-value="u1" data-prefix="@">@成员甲</span> b</p>';
		const { wrapper } = mountEditor({ modelValue: html });
		await flush();
		const quill = getEditor(wrapper);
		expect(quill.getContents().ops[1]).toEqual({ insert: { 'vc/mention': { value: 'u1', prefix: '@', label: '成员甲' } } });
		expect(quill.getSemanticHTML()).toContain('data-value="u1"');

		// 嵌入节点按占位字符计：紧跟在它后面的 @ 不算词首
		quill.setText('');
		quill.insertText(0, 'x');
		quill.insertEmbed(1, 'vc/mention', { value: 'u1', prefix: '@', label: '成员甲' });
		quill.insertText(2, '@');
		vi.spyOn(quill, 'getSelection').mockReturnValue({ index: 3, length: 0 } as any);
		quill.emitter.emit('editor-change', 'selection-change', { index: 3, length: 0 }, null, 'user');
		await flush();
		expect(isOpen()).toBe(false);
		wrapper.unmount();
	});

	it('多个前缀与 loadData(keyword, instance, { prefix })', async () => {
		const loadData = vi.fn((keyword: string, _: any, { prefix }: any) => {
			return Promise.resolve([{ value: `${prefix}1`, label: `${prefix}${keyword}结果` }]);
		});
		const { wrapper } = mountEditor({ mentionOptions: { prefix: ['@', '#'], loadData } });
		await flush();
		const quill = getEditor(wrapper);
		await typeAt(quill, '#');
		await flush();
		expect(loadData.mock.calls[0][2]).toEqual({ prefix: '#' });
		expect(getTexts()).toEqual(['#结果']);
		getOptions()[0].click();
		await flush();
		expect(quill.getContents().ops[0]).toEqual({ insert: { 'vc/mention': { value: '#1', prefix: '#', label: '#结果' } } });
		wrapper.unmount();
	});

	it('Esc 关闭；失焦（没有选区）关闭；没有 mentionOptions 或禁用时不开启', async () => {
		const { wrapper } = mountEditor();
		await flush();
		const quill = getEditor(wrapper);
		await typeAt(quill, '@');
		expect(isOpen()).toBe(true);
		keydown('Escape');
		await flush();
		expect(isOpen()).toBe(false);

		await typeAt(quill, '@A');
		expect(isOpen()).toBe(true);
		vi.spyOn(quill, 'getSelection').mockReturnValue(null as any);
		quill.emitter.emit('editor-change', 'selection-change', null, null, 'user');
		await flush();
		expect(isOpen()).toBe(false);
		wrapper.unmount();

		const plain = mountEditor({ mentionOptions: undefined });
		await flush();
		await typeAt(getEditor(plain.wrapper), '@');
		expect(document.querySelector('.vc-suggest-wrapper')).toBe(null);
		plain.wrapper.unmount();

		const disabled = mountEditor({ disabled: true });
		await flush();
		await typeAt(getEditor(disabled.wrapper), '@');
		expect(isOpen()).toBe(false);
		disabled.wrapper.unmount();
	});

	it('MEditor：跟随光标的下拉（移动端外观），点按插入', async () => {
		const { wrapper } = mountEditor({ toolbarPlacement: 'top' }, MEditor);
		await flush();
		const quill = getEditor(wrapper);
		await typeAt(quill, '@');
		const popup = document.querySelector('.vc-suggest-wrapper') as HTMLElement;
		expect(popup.classList.contains('vcm-suggest-wrapper')).toBe(true);
		expect(isOpen()).toBe(true);
		getOptions()[0].click();
		await flush();
		expect(quill.getContents().ops[0]).toEqual({ insert: { 'vc/mention': { value: 'u1', prefix: '@', label: '成员甲' } } });
		wrapper.unmount();
	});

	it('Editor.getMentions：按出现顺序取出提及', () => {
		expect(Editor.getMentions('')).toEqual([]);
		const html = [
			'<p><span class="vc-editor-mention" data-value="1" data-prefix="#">#话题</span>',
			'<span class="vc-editor-mention" data-value="2" data-prefix="@">@成员</span></p>'
		].join('');
		expect(Editor.getMentions(html)).toEqual([
			{ value: '1', prefix: '#', label: '话题' },
			{ value: '2', prefix: '@', label: '成员' }
		]);
		expect(MEditor.getMentions).toBe(getMentions);
	});
});
