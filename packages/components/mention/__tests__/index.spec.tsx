// @vitest-environment jsdom

import { Mention, MMention } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { findMention, insertMention } from '../utils';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const USERS = ['成员甲', '成员乙', 'Alpha', 'Beta'];

const getTextarea = (wrapper: any) => wrapper.find('textarea').element as HTMLTextAreaElement;
const getOptions = () => Array.from(document.querySelectorAll('.vc-suggest .vc-select-option')) as HTMLElement[];
const getTexts = () => getOptions().map(el => el.textContent);
const getActive = () => document.querySelector('.vc-suggest [data-active]')?.textContent;
const isOpen = () => {
	const el = document.querySelector('.vc-suggest-wrapper') as HTMLElement | null;
	return !!el && el.style.display !== 'none';
};

// 输入到光标处（光标在末尾，或 caret 指定的位置）
const typeInto = async (el: HTMLTextAreaElement, value: string, caret = value.length) => {
	el.value = value;
	el.setSelectionRange(caret, caret);
	el.dispatchEvent(new Event('input', { bubbles: true }));
	await flush();
};

const keydown = (key: string) => {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
	document.activeElement!.dispatchEvent(event);
	return event;
};

const mountMention = (props: Record<string, any> = {}) => {
	const value = ref(props.modelValue ?? '');
	const onSelect = vi.fn();
	const onSearch = vi.fn();
	const wrapper = mount(() => (
		<Mention
			data={USERS}
			{...props}
			modelValue={value.value}
			// @ts-ignore
			onUpdate:modelValue={(v: string) => (value.value = v)}
			onSelect={onSelect}
			onSearch={onSearch}
		/>
	), { attachTo: document.body });
	return { wrapper, value, onSelect, onSearch };
};

describe('Mention utils', () => {
	it('findMention：开头或空白后的前缀，前缀到光标之间不含分隔符与换行', () => {
		expect(findMention('@ab', 3, ['@'], ' ')).toEqual({ start: 0, end: 3, prefix: '@', keyword: 'ab' });
		expect(findMention('hi @ab', 6, ['@'], ' ')).toEqual({ start: 3, end: 6, prefix: '@', keyword: 'ab' });
		// 邮箱
		expect(findMention('a@b', 3, ['@'], ' ')).toBe(null);
		expect(findMention('@ab cd', 6, ['@'], ' ')).toBe(null);
		expect(findMention('@ab\ncd', 6, ['@'], ' ')).toBe(null);
		expect(findMention('\n@', 2, ['@'], ' ')).toEqual({ start: 1, end: 2, prefix: '@', keyword: '' });
	});

	it('findMention：多个前缀取最靠后的；光标在词中间时词延伸到词尾', () => {
		expect(findMention('@a #b', 5, ['@', '#'], ' ')?.prefix).toBe('#');
		expect(findMention('@abc d', 2, ['@'], ' ')).toEqual({ start: 0, end: 4, prefix: '@', keyword: 'a' });
		// 自定义分隔符：分隔符前的前缀照样有效
		expect(findMention('x,@a', 4, ['@'], ',')?.keyword).toBe('a');
	});

	it('insertMention：补分隔符，已有分隔符时不重复补，光标移到其后', () => {
		const match = findMention('hi @a', 5, ['@'], ' ')!;
		expect(insertMention('hi @a', match, '成员', ' ')).toEqual({ text: 'hi @成员 ', caret: 7 });
		const middle = findMention('@ab cd', 2, ['@'], ' ')!;
		expect(insertMention('@ab cd', middle, 'x', ' ')).toEqual({ text: '@x cd', caret: 3 });
		expect(insertMention('@a', findMention('@a', 2, ['@'], '')!, 'x', '')).toEqual({ text: '@x', caret: 2 });
	});
});

describe('Mention', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('输入前缀后打开，按前缀之后的文字过滤；回车插入并移动光标', async () => {
		const { wrapper, value, onSelect, onSearch } = mountMention();
		const el = getTextarea(wrapper);
		el.focus();
		await typeInto(el, 'hello @');
		expect(isOpen()).toBe(true);
		expect(getTexts()).toEqual(USERS);
		expect(onSearch).toHaveBeenLastCalledWith({ keyword: '', prefix: '@' });

		await typeInto(el, 'hello @成员');
		expect(getTexts()).toEqual(['成员甲', '成员乙']);
		keydown('ArrowDown');
		expect(getActive()).toBe('成员乙');
		const event = keydown('Enter');
		// 不换行
		expect(event.defaultPrevented).toBe(true);
		await flush();
		expect(value.value).toBe('hello @成员乙 ');
		expect(onSelect).toHaveBeenCalledWith({ value: '成员乙', item: expect.objectContaining({ value: '成员乙' }), prefix: '@' });
		expect(el.selectionStart).toBe('hello @成员乙 '.length);
		expect(isOpen()).toBe(false);
		wrapper.unmount();
	});

	it('邮箱不触发；输入分隔符结束提及；光标移出时关闭', async () => {
		const { wrapper } = mountMention();
		const el = getTextarea(wrapper);
		el.focus();
		await typeInto(el, 'a@b');
		expect(isOpen()).toBe(false);
		await typeInto(el, 'x @Al');
		expect(isOpen()).toBe(true);
		await typeInto(el, 'x @Al ');
		expect(isOpen()).toBe(false);

		await typeInto(el, 'x @Al');
		expect(isOpen()).toBe(true);
		el.setSelectionRange(1, 1);
		el.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft', bubbles: true }));
		await flush();
		expect(isOpen()).toBe(false);
		wrapper.unmount();
	});

	it('点击联想项插入；锚点在镜像层里前缀的位置', async () => {
		const { wrapper, value } = mountMention({ prefix: ['@', '#'], data: ['话题'] });
		const el = getTextarea(wrapper);
		el.focus();
		await typeInto(el, 'ab #');
		const mirror = wrapper.find('.vc-mention__mirror');
		expect(mirror.text()).toBe('ab #');
		expect(mirror.find('.vc-mention__anchor').text()).toBe('#');
		getOptions()[0].click();
		await flush();
		expect(value.value).toBe('ab #话题 ');
		wrapper.unmount();
	});

	it('远程加载：loadData(keyword, instance, { prefix })，换前缀立即重新加载', async () => {
		const loadData = vi.fn((keyword: string, _: any, { prefix }: any) => Promise.resolve([`${prefix}${keyword}结果`]));
		const { wrapper } = mountMention({ data: [], prefix: ['@', '#'], loadData });
		const el = getTextarea(wrapper);
		el.focus();
		await typeInto(el, '@');
		await flush();
		expect(loadData).toHaveBeenCalledTimes(1);
		expect(loadData.mock.calls[0][2]).toEqual({ prefix: '@' });
		expect(getTexts()).toEqual(['@结果']);

		await typeInto(el, '@ #');
		await flush();
		expect(loadData).toHaveBeenCalledTimes(2);
		expect(loadData.mock.calls[1][2]).toEqual({ prefix: '#' });
		expect(getTexts()).toEqual(['#结果']);
		wrapper.unmount();
	});

	it('Esc 关闭；失焦关闭；disabled 不打开', async () => {
		const { wrapper } = mountMention();
		const el = getTextarea(wrapper);
		el.focus();
		await typeInto(el, '@');
		keydown('Escape');
		await flush();
		expect(isOpen()).toBe(false);
		await typeInto(el, '@A');
		expect(isOpen()).toBe(true);
		el.blur();
		await flush();
		expect(isOpen()).toBe(false);
		wrapper.unmount();

		const disabled = mountMention({ disabled: true });
		const target = getTextarea(disabled.wrapper);
		await typeInto(target, '@');
		expect(isOpen()).toBe(false);
		disabled.wrapper.unmount();
	});

	it('透传给 Textarea 的属性；class / style 在根节点上', async () => {
		const { wrapper } = mountMention({ rows: 4, placeholder: '输入', class: 'custom', style: { width: '200px' } });
		const el = getTextarea(wrapper);
		expect(el.rows).toBe(4);
		expect(el.placeholder).toBe('输入');
		const root = wrapper.find('.vc-mention');
		expect(root.classes()).toContain('custom');
		expect((root.element as HTMLElement).style.width).toBe('200px');
		wrapper.unmount();
	});

	it('MMention：跟随光标的下拉（移动端外观），不默认高亮，点按插入', async () => {
		const value = ref('');
		const wrapper = mount(() => (
			// @ts-ignore
			<MMention data={USERS} modelValue={value.value} onUpdate:modelValue={(v: string) => (value.value = v)} />
		), { attachTo: document.body });
		const el = getTextarea(wrapper);
		expect(wrapper.find('.vcm-mention').exists()).toBe(true);
		el.focus();
		await typeInto(el, '@');
		const popup = document.querySelector('.vc-suggest-wrapper') as HTMLElement;
		expect(popup.classList.contains('vcm-suggest-wrapper')).toBe(true);
		expect(isOpen()).toBe(true);
		expect(wrapper.find('.vc-mention__anchor').text()).toBe('@');
		expect(getActive()).toBeUndefined();
		getOptions()[1].click();
		await flush();
		expect(value.value).toBe('@成员乙 ');
		expect(isOpen()).toBe(false);
		wrapper.unmount();
	});

	it('Textarea 的属性、事件参数与方法', async () => {
		const onChange = vi.fn();
		const onKeydown = vi.fn();
		const onEnter = vi.fn();
		const value = ref('');
		const wrapper = mount(() => (
			<Mention
				data={USERS}
				rows={3}
				maxlength={20}
				indicator
				modelValue={value.value}
				// @ts-ignore
				onUpdate:modelValue={(v: string) => (value.value = v)}
				onChange={onChange}
				onKeydown={onKeydown}
				onEnter={onEnter}
			/>
		), { attachTo: document.body });
		const el = getTextarea(wrapper);
		expect(el.rows).toBe(3);
		expect(el.maxLength).toBe(20);
		expect(wrapper.find('.vc-textarea__indicator').exists()).toBe(true);
		el.focus();
		await typeInto(el, '@');
		// 输入：原生事件随值一起转发
		expect(onChange.mock.calls.at(-1)?.[1]).toBeInstanceOf(Event);
		el.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
		expect(onKeydown).toHaveBeenCalled();
		// 回车插入提及：同一次按键不发 enter
		keydown('Enter');
		el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, bubbles: true } as any));
		await flush();
		expect(value.value).toBe('@成员甲 ');
		expect(onChange.mock.calls.at(-1)).toEqual(['@成员甲 ', undefined]);
		expect(onEnter).not.toHaveBeenCalled();
		el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', keyCode: 13, bubbles: true } as any));
		expect(onEnter).toHaveBeenCalledTimes(1);

		const vm = wrapper.findComponent(Mention).vm as any;
		el.blur();
		vm.focus();
		expect(document.activeElement).toBe(el);
		wrapper.unmount();
	});
});
