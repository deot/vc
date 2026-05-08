// @vitest-environment jsdom

import { Countdown } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import { vi } from 'vitest';

const ms = {
	second: 1000,
	minute: 60 * 1000,
	hour: 60 * 60 * 1000,
	day: 24 * 60 * 60 * 1000
};

const FIXED = new Date('2026/01/01 00:00:00').getTime();

const useMockedNow = (now = FIXED) => {
	vi.useFakeTimers();
	vi.setSystemTime(now);
};

describe('index.ts', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('basic', () => {
		expect(typeof Countdown).toBe('object');
	});

	it('create', () => {
		const wrapper = mount(() => (<Countdown />));

		expect(wrapper.classes()).toContain('vc-countdown');
		wrapper.unmount();
	});

	it('default format renders innerHTML when targetTime is a Date', async () => {
		useMockedNow();
		const target = new Date(FIXED + ms.day + 2 * ms.hour + 30 * ms.minute + 45 * ms.second);

		const wrapper = mount(() => (<Countdown targetTime={target} />));
		await nextTick();

		expect(wrapper.element.innerHTML).toBe('01天02小时30分45秒0');
		wrapper.unmount();
	});

	it('custom format and tag work when targetTime is a number', async () => {
		useMockedNow();
		const target = FIXED + 5 * ms.minute + 30 * ms.second;

		const wrapper = mount(() => (
			<Countdown
				targetTime={target}
				format="DD:HH:mm:ss"
				tag="div"
			/>
		));
		await nextTick();

		expect(wrapper.element.tagName).toBe('DIV');
		expect(wrapper.element.innerHTML).toBe('00:00:05:30');
		wrapper.unmount();
	});

	it('string targetTime is parsed (and `-` is normalized to `/`)', async () => {
		useMockedNow();

		const wrapper = mount(() => (
			<Countdown
				targetTime="2026-01-01 01:00:00"
				format="DD:HH:mm:ss"
			/>
		));
		await nextTick();

		expect(wrapper.element.innerHTML).toBe('00:01:00:00');
		wrapper.unmount();
	});

	it('trim removes leading 00 placeholders', async () => {
		useMockedNow();
		const target = FIXED + 5 * ms.minute + 30 * ms.second;

		const wrapper = mount(() => (<Countdown targetTime={target} trim />));
		await nextTick();

		expect(wrapper.element.innerHTML).toBe('05分30秒0');
		wrapper.unmount();
	});

	it('serverTime offsets the local clock', async () => {
		useMockedNow();
		const serverTime = new Date(FIXED + ms.hour);
		const target = new Date(FIXED + 2 * ms.hour);

		const wrapper = mount(() => (
			<Countdown
				targetTime={target}
				serverTime={serverTime}
				format="DD:HH:mm:ss"
			/>
		));
		await nextTick();

		expect(wrapper.element.innerHTML).toBe('00:01:00:00');
		wrapper.unmount();
	});

	it('msDividend changes with `t` (1000 / 50 / 5)', async () => {
		useMockedNow();
		const target = FIXED + 1 * ms.second + 678;

		const wrapper1 = mount(() => (<Countdown targetTime={target} t={1000} format="ss:SSS" />));
		await nextTick();
		expect(wrapper1.element.innerHTML).toBe('01:6');
		wrapper1.unmount();

		const wrapper2 = mount(() => (<Countdown targetTime={target} t={50} format="ss:SSS" />));
		await nextTick();
		expect(wrapper2.element.innerHTML).toBe('01:67');
		wrapper2.unmount();

		const wrapper3 = mount(() => (<Countdown targetTime={target} t={5} format="ss:SSS" />));
		await nextTick();
		expect(wrapper3.element.innerHTML).toBe('01:678');
		wrapper3.unmount();
	});

	it('emits `change` on every tick and emits `complete` exactly once when reaching zero', () => {
		useMockedNow();
		const onChange = vi.fn();
		const onComplete = vi.fn();
		const target = FIXED + 2 * ms.second;

		const wrapper = mount(() => (
			<Countdown
				targetTime={target}
				t={1000}
				onChange={onChange}
				onComplete={onComplete}
			/>
		));

		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({
			second: '02',
			millisecond: '0',
		}));
		expect(onComplete).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1000);
		expect(onChange).toHaveBeenCalledTimes(2);
		expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ second: '01' }));
		expect(onComplete).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1000);
		expect(onChange).toHaveBeenCalledTimes(3);
		expect(onChange).toHaveBeenLastCalledWith({
			timestamp: 0,
			day: '00',
			hour: '00',
			minute: '00',
			second: '00',
			millisecond: '00',
		});
		expect(onComplete).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(5000);
		expect(onChange).toHaveBeenCalledTimes(3);
		expect(onComplete).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('emits `error` for invalid targetTime and renders empty placeholders', async () => {
		const onError = vi.fn();

		const wrapper = mount(() => (
			<Countdown
				targetTime="not-a-date"
				format="DD:HH:mm:ss"
				onError={onError}
			/>
		));
		await nextTick();

		expect(onError).toHaveBeenCalledWith('请设定时间以及格式');
		expect(wrapper.element.innerHTML).toBe(':::');
		wrapper.unmount();
	});

	it('does not emit `error` when targetTime is empty (default)', async () => {
		const onError = vi.fn();

		const wrapper = mount(() => (<Countdown onError={onError} />));
		await nextTick();

		expect(onError).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it('targetTime change triggers an immediate restart (debounce leading)', async () => {
		useMockedNow();
		const targetTime = ref<Date | string>('');

		const wrapper = mount(defineComponent({
			setup() {
				return () => (
					<Countdown
						targetTime={targetTime.value}
						format="DD:HH:mm:ss"
					/>
				);
			}
		}));
		await nextTick();

		expect(wrapper.element.innerHTML).toBe(':::');

		targetTime.value = new Date(FIXED + 1 * ms.hour);
		await nextTick();

		expect(wrapper.element.innerHTML).toBe('00:01:00:00');
		wrapper.unmount();
	});

	it('serverTime change also triggers a restart', async () => {
		useMockedNow();
		const serverTime = ref<Date | string>('');
		const target = new Date(FIXED + 2 * ms.hour);

		const wrapper = mount(defineComponent({
			setup() {
				return () => (
					<Countdown
						targetTime={target}
						serverTime={serverTime.value}
						format="DD:HH:mm:ss"
					/>
				);
			}
		}));
		await nextTick();

		expect(wrapper.element.innerHTML).toBe('00:02:00:00');

		serverTime.value = new Date(FIXED + ms.hour);
		await nextTick();

		expect(wrapper.element.innerHTML).toBe('00:01:00:00');
		wrapper.unmount();
	});

	it('renders via `render` prop using Customer', async () => {
		useMockedNow();
		const target = FIXED + 1 * ms.hour;

		const renderRow = (props: any) => h(
			props.tag,
			{ class: 'render-row' },
			`${props.day}-${props.hour}-${props.minute}-${props.second}`
		);

		const wrapper = mount(() => (<Countdown targetTime={target} render={renderRow} />));
		await nextTick();

		const row = wrapper.find('.render-row');
		expect(row.exists()).toBe(true);
		expect(row.classes()).toContain('vc-countdown');
		expect(row.text()).toBe('00-01-00-00');
		wrapper.unmount();
	});

	it('default scoped slot receives binds', async () => {
		useMockedNow();
		const target = FIXED + 30 * ms.second;

		const wrapper = mount(() => (
			<Countdown targetTime={target} tag="div">
				{{
					default: (it: any) => <span class="slot">{ it.second }</span>
				}}
			</Countdown>
		));
		await nextTick();

		expect(wrapper.element.tagName).toBe('DIV');
		expect(wrapper.find('.slot').text()).toBe('30');
		wrapper.unmount();
	});

	it('default slot with static children renders regardless of binds', async () => {
		useMockedNow();
		const target = FIXED + 30 * ms.second;

		const wrapper = mount(() => (
			<Countdown targetTime={target}>
				<div class="static">test</div>
			</Countdown>
		));
		await nextTick();

		expect(wrapper.find('.static').text()).toBe('test');
		wrapper.unmount();
	});

	it('clears the interval on unmount', () => {
		useMockedNow();
		const onChange = vi.fn();
		const target = FIXED + 10 * ms.second;

		const wrapper = mount(() => (
			<Countdown
				targetTime={target}
				t={1000}
				onChange={onChange}
			/>
		));

		expect(onChange).toHaveBeenCalledTimes(1);

		wrapper.unmount();
		vi.advanceTimersByTime(5000);

		expect(onChange).toHaveBeenCalledTimes(1);
	});
});
