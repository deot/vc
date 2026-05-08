// @vitest-environment jsdom

import { Counter } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import { vi } from 'vitest';

const useFakeAnimation = () => {
	vi.useFakeTimers({
		toFake: [
			'setTimeout',
			'clearTimeout',
			'setInterval',
			'clearInterval',
			'requestAnimationFrame',
			'cancelAnimationFrame',
			'performance',
			'Date'
		]
	});
};

describe('index.ts', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('basic', () => {
		expect(typeof Counter).toBe('object');
	});

	it('create', () => {
		const wrapper = mount(() => (<Counter />));

		expect(wrapper.classes()).toContain('vc-counter');
		wrapper.unmount();
	});

	// --- 标签 ---
	it('default tag is span', () => {
		const wrapper = mount(() => (<Counter placeholder="-" />));

		expect(wrapper.element.tagName).toBe('SPAN');
		wrapper.unmount();
	});

	it('renders custom tag', () => {
		const wrapper = mount(() => (<Counter tag="div" placeholder="-" />));

		expect(wrapper.element.tagName).toBe('DIV');
		wrapper.unmount();
	});

	// --- placeholder（对应 examples 中的无效值场景） ---
	it('placeholder when value is undefined', async () => {
		const wrapper = mount(() => (<Counter placeholder="value(undefined)" />));
		await nextTick();

		expect(wrapper.text()).toBe('value(undefined)');
		wrapper.unmount();
	});

	it('placeholder when value is null', async () => {
		const wrapper = mount(() => (<Counter value={null as any} placeholder="value(null)" />));
		await nextTick();

		expect(wrapper.text()).toBe('value(null)');
		wrapper.unmount();
	});

	it('placeholder when value is empty string', async () => {
		const wrapper = mount(() => (<Counter value="" placeholder="value('')" />));
		await nextTick();

		expect(wrapper.text()).toBe(`value('')`);
		wrapper.unmount();
	});

	it('placeholder when value is non-numeric string', async () => {
		const wrapper = mount(() => (<Counter value="abcd" placeholder="value(abcd)" />));
		await nextTick();

		expect(wrapper.text()).toBe('value(abcd)');
		wrapper.unmount();
	});

	// --- 数字格式化（duration:0 即时输出，对应 examples 前 3 行） ---
	it('formats integer with default separator (precision=2)', async () => {
		const wrapper = mount(() => (<Counter value={6666} precision={2} duration={0} />));
		await nextTick();

		expect(wrapper.text()).toBe('6,666.00');
		wrapper.unmount();
	});

	it('formats decimal number with precision', async () => {
		const wrapper = mount(() => (<Counter value={9999.9} precision={2} duration={0} />));
		await nextTick();

		expect(wrapper.text()).toBe('9,999.90');
		wrapper.unmount();
	});

	it('zeroless trims trailing zeros from string value', async () => {
		const wrapper = mount(() => (<Counter value="9999.90" precision={2} zeroless duration={0} />));
		await nextTick();

		expect(wrapper.text()).toBe('9,999.9');
		wrapper.unmount();
	});

	it('formats negative numbers', async () => {
		const wrapper = mount(() => (<Counter value={-1234.5} precision={2} duration={0} />));
		await nextTick();

		expect(wrapper.text()).toBe('-1,234.50');
		wrapper.unmount();
	});

	it('replaces digits with custom numerals', async () => {
		const numerals = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
		const wrapper = mount(() => (
			<Counter value={123.45} precision={2} numerals={numerals} duration={0} />
		));
		await nextTick();

		expect(wrapper.text()).toBe('一二三.四五');
		wrapper.unmount();
	});

	it('uses custom separator and decimal characters', async () => {
		const wrapper = mount(() => (
			<Counter
				value={1234567.89}
				precision={2}
				separator=" "
				decimal=","
				duration={0}
			/>
		));
		await nextTick();

		expect(wrapper.text()).toBe('1 234 567,89');
		wrapper.unmount();
	});

	it('omits separator when set to empty string', async () => {
		const wrapper = mount(() => (
			<Counter value={1234} separator="" duration={0} />
		));
		await nextTick();

		expect(wrapper.text()).toBe('1234');
		wrapper.unmount();
	});

	// --- 默认 slot / render ---
	it('default scoped slot receives binds', async () => {
		const wrapper = mount(() => (
			<Counter value={1234.56} precision={2} duration={0} tag="div">
				{{
					default: (it: any) => (
						<span class="slot">
							{`${it.value}|${it.integer}|${it.decimal}|${it.separated}|${it.float}|${it.negative}`}
						</span>
					)
				}}
			</Counter>
		));
		await nextTick();

		expect(wrapper.element.tagName).toBe('DIV');
		expect(wrapper.find('.slot').text()).toBe('1,234.56|1234|56|1,234|1234.56|');
		wrapper.unmount();
	});

	it('default slot with static children renders regardless of binds', async () => {
		const wrapper = mount(() => (
			<Counter value={123} duration={0}>
				<i class="static">static</i>
			</Counter>
		));
		await nextTick();

		expect(wrapper.find('.static').text()).toBe('static');
		wrapper.unmount();
	});

	it('renders via render prop using Customer', async () => {
		const renderRow = (attrs: any) => h('div', { class: 'render-row' }, attrs.value);
		const wrapper = mount(() => (
			<Counter value={1234} duration={0} render={renderRow} />
		));
		await nextTick();

		const row = wrapper.find('.render-row');
		expect(row.exists()).toBe(true);
		expect(row.classes()).toContain('vc-counter');
		expect(row.text()).toBe('1,234');
		wrapper.unmount();
	});

	// --- 动画事件 ---
	it('emits begin on mount and complete after the animation', async () => {
		useFakeAnimation();
		const onBegin = vi.fn();
		const onChange = vi.fn();
		const onComplete = vi.fn();

		const wrapper = mount(() => (
			<Counter
				value={100}
				duration={500}
				onBegin={onBegin}
				onChange={onChange}
				onComplete={onComplete}
			/>
		));

		expect(onBegin).toHaveBeenCalledTimes(1);
		expect(onComplete).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(2000);

		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onChange.mock.calls.length).toBeGreaterThan(0);
		wrapper.unmount();
	});

	it('renders the final value after animation completes (linear, easing=false)', async () => {
		useFakeAnimation();
		const wrapper = mount(() => (
			<Counter value={100} duration={300} easing={false} />
		));

		await vi.advanceTimersByTimeAsync(1000);
		await nextTick();

		expect(wrapper.text()).toBe('100');
		wrapper.unmount();
	});

	it('uses custom easing function when provided', async () => {
		useFakeAnimation();
		const easing = vi.fn((t: number, b: number, c: number, d: number) => b + c * (t / d));
		const wrapper = mount(() => (
			<Counter value={50} duration={300} easing={easing} />
		));

		await vi.advanceTimersByTimeAsync(1000);
		await nextTick();

		expect(easing).toHaveBeenCalled();
		expect(wrapper.text()).toBe('50');
		wrapper.unmount();
	});

	it('triggers smart easing when value diff exceeds smartEasingThreshold', async () => {
		useFakeAnimation();
		const onComplete = vi.fn();
		const wrapper = mount(() => (
			<Counter
				value={5000}
				duration={300}
				smartEasingThreshold={999}
				smartEasingAmount={333}
				onComplete={onComplete}
			/>
		));

		await vi.advanceTimersByTimeAsync(3000);
		await nextTick();

		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(wrapper.text()).toBe('5,000');
		wrapper.unmount();
	});

	// --- 响应式 props ---
	it('reactive value change updates rendering (non-controllable)', async () => {
		useFakeAnimation();
		const value = ref<number>(10);

		const Wrapper = defineComponent({
			setup() {
				return () => <Counter value={value.value} duration={300} easing={false} />;
			}
		});

		const wrapper = mount(Wrapper);
		await vi.advanceTimersByTimeAsync(1000);
		await nextTick();
		expect(wrapper.text()).toBe('10');

		value.value = 200;
		await nextTick();
		await vi.advanceTimersByTimeAsync(1000);
		await nextTick();

		expect(wrapper.text()).toBe('200');
		wrapper.unmount();
	});

	it('reactive precision change re-prints after animation completes', async () => {
		useFakeAnimation();
		const precision = ref(0);
		const Wrapper = defineComponent({
			setup() {
				return () => (<Counter value={1234} precision={precision.value} duration={200} />);
			}
		});

		const wrapper = mount(Wrapper);
		await vi.advanceTimersByTimeAsync(1000);
		await nextTick();
		expect(wrapper.text()).toBe('1,234');

		precision.value = 2;
		await nextTick();
		expect(wrapper.text()).toBe('1,234.00');
		wrapper.unmount();
	});

	it('precision change is ignored before complete', async () => {
		useFakeAnimation();
		const precision = ref(0);
		const Wrapper = defineComponent({
			setup() {
				return () => (
					<Counter value={1234} precision={precision.value} duration={2000} />
				);
			}
		});

		const wrapper = mount(Wrapper);

		precision.value = 2;
		await nextTick();
		expect(wrapper.text()).not.toBe('1,234.00');
		wrapper.unmount();
	});

	// --- controllable ---
	it('controllable: does not auto-start, no begin emitted', async () => {
		useFakeAnimation();
		const onBegin = vi.fn();
		const wrapper = mount(() => (
			<Counter value={100} controllable duration={300} onBegin={onBegin} />
		));

		await vi.advanceTimersByTimeAsync(1000);

		expect(onBegin).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it('controllable: start() begins animation; second start() before complete is no-op', async () => {
		useFakeAnimation();
		const onBegin = vi.fn();
		const onComplete = vi.fn();
		const wrapper = mount(Counter, {
			props: { value: 100, controllable: true, duration: 300, onBegin, onComplete } as any
		});

		const vm = wrapper.vm as any;
		vm.start();
		expect(onBegin).toHaveBeenCalledTimes(1);

		vm.start();
		expect(onBegin).toHaveBeenCalledTimes(1);

		await vi.advanceTimersByTimeAsync(2000);
		expect(onComplete).toHaveBeenCalledTimes(1);

		vm.start();
		expect(onBegin).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('controllable: pause stops change emissions; resume continues to complete', async () => {
		useFakeAnimation();
		const onChange = vi.fn();
		const onComplete = vi.fn();
		const wrapper = mount(Counter, {
			props: {
				value: 1000,
				controllable: true,
				duration: 1000,
				easing: false,
				onChange,
				onComplete
			} as any
		});

		const vm = wrapper.vm as any;
		vm.start();
		await vi.advanceTimersByTimeAsync(200);

		vm.pause();
		const callsAtPause = onChange.mock.calls.length;
		await vi.advanceTimersByTimeAsync(800);
		expect(onChange.mock.calls.length).toBe(callsAtPause);
		expect(onComplete).not.toHaveBeenCalled();

		// 多次 pause 不报错且不重复 cancel
		vm.pause();

		vm.resume();
		await vi.advanceTimersByTimeAsync(2000);
		expect(onComplete).toHaveBeenCalledTimes(1);

		// resume 已完成时是 no-op
		vm.resume();
		expect(onComplete).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('controllable: end() finishes immediately and emits complete', async () => {
		useFakeAnimation();
		const onComplete = vi.fn();
		const wrapper = mount(Counter, {
			props: {
				value: 100,
				controllable: true,
				duration: 1000,
				onComplete
			} as any
		});

		const vm = wrapper.vm as any;
		vm.start();
		vm.end();
		await nextTick();

		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(wrapper.text()).toBe('100');

		// 已完成后再次调用是 no-op
		vm.end();
		expect(onComplete).toHaveBeenCalledTimes(1);

		// pause 已完成时也是 no-op
		vm.pause();
		expect(onComplete).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('controllable: restart() resets state and runs again', async () => {
		useFakeAnimation();
		const onBegin = vi.fn();
		const onComplete = vi.fn();
		const wrapper = mount(Counter, {
			props: {
				value: 100,
				controllable: true,
				duration: 200,
				onBegin,
				onComplete
			} as any
		});

		const vm = wrapper.vm as any;
		vm.start();
		await vi.advanceTimersByTimeAsync(1000);
		expect(onBegin).toHaveBeenCalledTimes(1);
		expect(onComplete).toHaveBeenCalledTimes(1);

		vm.restart();
		expect(onBegin).toHaveBeenCalledTimes(2);
		await vi.advanceTimersByTimeAsync(1000);
		expect(onComplete).toHaveBeenCalledTimes(2);

		wrapper.unmount();
	});

	it('controllable: print(num) directly sets the displayed value', async () => {
		const wrapper = mount(Counter, {
			props: { value: 100, controllable: true } as any
		});

		const vm = wrapper.vm as any;
		vm.print(10002);
		await nextTick();

		expect(wrapper.text()).toBe('10,002');
		wrapper.unmount();
	});

	it('controllable: update(num) changes the target during run', async () => {
		useFakeAnimation();
		const onComplete = vi.fn();
		const wrapper = mount(Counter, {
			props: {
				value: 100,
				controllable: true,
				duration: 500,
				easing: false,
				onComplete
			} as any
		});

		const vm = wrapper.vm as any;
		vm.start();
		await vi.advanceTimersByTimeAsync(100);

		vm.update(999);
		await vi.advanceTimersByTimeAsync(2000);
		await nextTick();

		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(wrapper.text()).toBe('999');
		wrapper.unmount();
	});

	it('controllable: update before start is a no-op', async () => {
		useFakeAnimation();
		const onChange = vi.fn();
		const wrapper = mount(Counter, {
			props: { value: 0, controllable: true, duration: 100, onChange } as any
		});

		const vm = wrapper.vm as any;
		vm.update(123);
		await vi.advanceTimersByTimeAsync(500);

		expect(onChange).not.toHaveBeenCalled();
		wrapper.unmount();
	});

	it('controllable: cancel() can be called before start safely', () => {
		const wrapper = mount(Counter, {
			props: { value: 100, controllable: true, duration: 1000 } as any
		});

		const vm = wrapper.vm as any;
		expect(() => vm.cancel()).not.toThrow();
		wrapper.unmount();
	});

	it('controllable: value watcher does not auto-update', async () => {
		useFakeAnimation();
		const value = ref<number>(100);
		const Wrapper = defineComponent({
			setup(_, { expose }) {
				const counterRef = ref<any>();
				expose({ counterRef });
				return () => (
					<Counter
						ref={counterRef}
						value={value.value}
						controllable
						duration={300}
						easing={false}
					/>
				);
			}
		});

		const wrapper = mount(Wrapper);
		const counterVm = (wrapper.vm as any).counterRef;
		counterVm.start();
		await vi.advanceTimersByTimeAsync(1000);
		await nextTick();
		expect(wrapper.text()).toBe('100');

		value.value = 999;
		await nextTick();
		await vi.advanceTimersByTimeAsync(1000);
		await nextTick();

		// 受控模式下，value 变化不会触发自动 update
		expect(wrapper.text()).toBe('100');
		wrapper.unmount();
	});

	// --- 卸载 ---
	it('cancels animation on unmount', async () => {
		useFakeAnimation();
		const onComplete = vi.fn();
		const wrapper = mount(() => (
			<Counter value={100} duration={500} onComplete={onComplete} />
		));

		wrapper.unmount();
		await vi.advanceTimersByTimeAsync(2000);

		expect(onComplete).not.toHaveBeenCalled();
	});
});
