// @vitest-environment jsdom

import { AutoComplete, MAutoComplete } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

const sleep = (ms = 0) => new Promise<void>(r => setTimeout(r, ms));

const flush = async () => {
	await nextTick();
	await sleep(0);
	await nextTick();
};

const DATA = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Alphabet'];

const getInput = (wrapper: any) => wrapper.find('input').element as HTMLInputElement;
const getOptions = () => Array.from(document.querySelectorAll('.vc-suggest .vc-select-option')) as HTMLElement[];
const getTexts = () => getOptions().map(el => el.textContent);
const getActive = () => document.querySelector('.vc-suggest [data-active]')?.textContent;
const isOpen = () => {
	const el = document.querySelector('.vc-suggest-wrapper') as HTMLElement | null;
	return !!el && el.style.display !== 'none';
};

const typeInto = async (input: HTMLInputElement, value: string) => {
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
	await flush();
};

const keydown = (key: string, options: KeyboardEventInit = {}) => {
	const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options });
	document.activeElement!.dispatchEvent(event);
	return event;
};

const mountComplete = (props: Record<string, any> = {}, slots: Record<string, any> = {}) => {
	const value = ref(props.modelValue ?? '');
	const onChange = vi.fn();
	const onSelect = vi.fn();
	const onEnter = vi.fn();
	const wrapper = mount(() => (
		<AutoComplete
			data={DATA}
			{...props}
			modelValue={value.value}
			// @ts-ignore
			onUpdate:modelValue={(v: string) => (value.value = v)}
			onChange={onChange}
			onSelect={onSelect}
			onEnter={onEnter}
		>
			{slots}
		</AutoComplete>
	), { attachTo: document.body });
	return { wrapper, value, onChange, onSelect, onEnter };
};

describe('AutoComplete', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('聚焦时显示全部联想项，输入时按文字过滤并高亮第一项', async () => {
		const { wrapper } = mountComplete();
		const input = getInput(wrapper);
		input.focus();
		await flush();
		expect(isOpen()).toBe(true);
		expect(getTexts()).toEqual(DATA);

		await typeInto(input, 'alp');
		expect(getTexts()).toEqual(['Alpha', 'Alphabet']);
		expect(getActive()).toBe('Alpha');
		// 命中的文字高亮
		expect(document.querySelector('.vc-suggest .vc-select-highlight')?.textContent).toBe('Alp');
		wrapper.unmount();
	});

	it('没有结果时不弹出空面板', async () => {
		const { wrapper } = mountComplete();
		const input = getInput(wrapper);
		input.focus();
		await typeInto(input, 'zzz');
		expect(getOptions().length).toBe(0);
		expect(isOpen()).toBe(false);
		wrapper.unmount();
	});

	it('↑ ↓ 移动高亮，Enter 选中：整段替换、关闭、焦点与光标留在输入框末尾，keyup 不再发出 enter', async () => {
		const { wrapper, value, onSelect, onEnter } = mountComplete();
		const input = getInput(wrapper);
		input.focus();
		await typeInto(input, 'a');
		keydown('ArrowDown');
		expect(getActive()).toBe('Beta');
		keydown('ArrowUp');
		keydown('ArrowUp');
		// 首尾循环
		expect(getActive()).toBe(getTexts().at(-1));
		keydown('ArrowDown');
		const event = keydown('Enter');
		expect(event.defaultPrevented).toBe(true);
		await flush();
		expect(value.value).toBe('Alpha');
		expect(onSelect).toHaveBeenCalledWith({ value: 'Alpha', item: expect.objectContaining({ value: 'Alpha' }) });
		input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
		expect(onEnter).not.toHaveBeenCalled();
		expect(document.activeElement).toBe(input);
		expect(input.selectionStart).toBe(5);

		// 之后的回车（没有弹层）照常发出 enter
		input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
		expect(onEnter).toHaveBeenCalledTimes(1);
		wrapper.unmount();
	});

	it('点击联想项选中；Esc 关闭，再输入重新打开；失焦关闭', async () => {
		const { wrapper, value } = mountComplete();
		const input = getInput(wrapper);
		input.focus();
		await typeInto(input, 'ga');
		getOptions()[0].click();
		await flush();
		expect(value.value).toBe('Gamma');

		await typeInto(input, 'de');
		expect(isOpen()).toBe(true);
		keydown('Escape');
		await flush();
		// jsdom 下关闭的弹层留在 DOM 中（display: none）
		expect(isOpen()).toBe(false);
		await typeInto(input, 'del');
		expect(getTexts()).toEqual(['Delta']);

		input.blur();
		await flush();
		expect(isOpen()).toBe(false);
		wrapper.unmount();
	});

	it('禁用项不可选中，键盘跳过；IME 组合输入中不处理按键', async () => {
		const { wrapper, value } = mountComplete({ data: [{ value: 'a1', disabled: true }, { value: 'a2' }] });
		const input = getInput(wrapper);
		input.focus();
		await flush();
		expect(getActive()).toBe('a2');
		const event = keydown('ArrowDown', { isComposing: true });
		expect(event.defaultPrevented).toBe(false);
		getOptions()[0].click();
		await flush();
		expect(value.value).toBe('');
		wrapper.unmount();
	});

	it('分组：分组标题不参与键盘，没有命中项的分组不显示', async () => {
		const data = [
			{ value: 'g1', label: '分组一', children: [{ value: 'one' }, { value: 'two' }] },
			{ value: 'g2', label: '分组二', children: [{ value: 'three' }] }
		];
		const { wrapper } = mountComplete({ data });
		const input = getInput(wrapper);
		input.focus();
		await typeInto(input, 'th');
		expect(document.querySelectorAll('.vc-suggest .vc-select-option-group').length).toBe(1);
		expect(getActive()).toBe('three');
		wrapper.unmount();
	});

	it('远程加载：输入经防抖调用 loadData，解析为数组时作为结果且不在本地过滤；过期结果丢弃', async () => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
		const resolvers: Array<(v: unknown) => void> = [];
		const loadData = vi.fn<(keyword: string) => Promise<unknown>>(() => new Promise((resolve) => {
			resolvers.push(resolve);
		}));
		const { wrapper } = mountComplete({ data: [], loadData });
		const input = getInput(wrapper);
		input.focus();
		await nextTick();
		// 聚焦：还没加载过，按空关键词立即加载
		expect(loadData).toHaveBeenCalledTimes(1);
		expect(loadData.mock.calls[0][0]).toBe('');

		input.value = 'x';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.value = 'xy';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		vi.advanceTimersByTime(300);
		expect(loadData).toHaveBeenCalledTimes(2);
		expect(loadData.mock.calls[1][0]).toBe('xy');

		// 先到的是过期的那次（空关键词）
		resolvers[1](['服务端结果一', '服务端结果二']);
		resolvers[0](['过期']);
		await Promise.resolve();
		await Promise.resolve();
		await nextTick();
		expect(getTexts()).toEqual(['服务端结果一', '服务端结果二']);
		vi.useRealTimers();
		wrapper.unmount();
	});

	it('virtualized：只渲染部分行，回车选中键盘移到的行', async () => {
		const data = Array.from({ length: 2000 }, (_, index) => `条目 ${index + 1}`);
		const { wrapper, value } = mountComplete({ data, virtualized: true });
		const input = getInput(wrapper);
		input.focus();
		await flush();
		expect(getOptions().length).toBeLessThan(2000);
		keydown('ArrowUp');
		keydown('Enter');
		await flush();
		expect(value.value).toBe('条目 2000');
		wrapper.unmount();
	});

	it('label 插槽、prepend 插槽与透传给 Input 的属性', async () => {
		const { wrapper } = mountComplete(
			{ placeholder: '输入', clearable: true, class: 'custom', style: { width: '100px' } },
			{ label: ({ row }: any) => (<b class="custom-label">{ row.label }</b>), prepend: () => (<i class="custom-prepend" />) }
		);
		const input = getInput(wrapper);
		expect(input.placeholder).toBe('输入');
		expect(wrapper.find('.vc-auto-complete').classes()).toContain('custom');
		expect((wrapper.find('.vc-auto-complete').element as HTMLElement).style.width).toBe('100px');
		expect(wrapper.find('.custom-prepend').exists()).toBe(true);
		input.focus();
		await flush();
		expect(document.querySelectorAll('.vc-select-option > .custom-label').length).toBe(DATA.length);
		wrapper.unmount();
	});

	it('disabled 时不打开', async () => {
		const { wrapper } = mountComplete({ disabled: true });
		getInput(wrapper).focus();
		await flush();
		expect(isOpen()).toBe(false);
		wrapper.unmount();
	});

	it('Input 的属性、事件参数与方法', async () => {
		const onChange = vi.fn();
		const onFocus = vi.fn();
		const value = ref('');
		const inst = mount(() => (
			<AutoComplete
				data={DATA}
				maxlength={10}
				modelValue={value.value}
				// @ts-ignore
				onUpdate:modelValue={(v: string) => (value.value = v)}
				onChange={onChange}
				onFocus={onFocus}
			/>
		), { attachTo: document.body });
		const input = getInput(inst);
		expect(input.maxLength).toBe(10);
		input.focus();
		await flush();
		// focus 的参数与 Input 一致：(e, value)
		expect(onFocus.mock.calls[0][0]).toBeInstanceOf(FocusEvent);
		await typeInto(input, 'Al');
		expect(onChange.mock.calls.at(-1)?.[1]).toBeInstanceOf(Event);
		keydown('Enter');
		await flush();
		expect(onChange.mock.calls.at(-1)).toEqual(['Alpha', undefined]);
		const vm = inst.findComponent(AutoComplete).vm as any;
		input.blur();
		vm.focus();
		expect(document.activeElement).toBe(input);
		expect(typeof vm.click).toBe('function');
		inst.unmount();
	});

	it('MAutoComplete：移动端外观，不默认高亮', async () => {
		const value = ref('');
		const wrapper = mount(() => (
			// @ts-ignore
			<MAutoComplete data={DATA} modelValue={value.value} onUpdate:modelValue={(v: string) => (value.value = v)} />
		), { attachTo: document.body });
		const input = getInput(wrapper);
		expect(wrapper.find('.vcm-auto-complete').exists()).toBe(true);
		input.focus();
		await flush();
		const popup = document.querySelector('.vc-suggest-wrapper')!;
		expect(popup.classList.contains('vcm-suggest-wrapper')).toBe(true);
		expect(getActive()).toBeUndefined();
		keydown('ArrowDown');
		expect(getActive()).toBe('Alpha');
		getOptions()[1].click();
		await flush();
		expect(value.value).toBe('Beta');
		wrapper.unmount();
	});
});
