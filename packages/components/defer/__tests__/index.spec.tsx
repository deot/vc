// @vitest-environment jsdom

import { Defer } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { Utils } from '@deot/dev-test';
import { computed, defineComponent, nextTick, ref } from 'vue';
import { vi } from 'vitest';

const random255 = () => Math.floor(Math.random() * 255);
const randomColor = () => `rgba(${random255()}, ${random255()}, ${random255()}, ${Math.random()})`;

const genTableData = (length: number) => Array.from({ length }).map((_, index) => ({
	id: `id__${index}`,
	background: randomColor(),
	count: length === index + 1 ? length : (index + 1) % 100
}));

// Defer 内部基于 MessageChannel 模拟 requestIdleCallback，需要让消息事件出队执行。
// 多次让出宏任务，确保所有批次都被调度执行并触发 complete。
const flushIdle = async (round = 12) => {
	for (let i = 0; i < round; i++) {
		await Utils.sleep(0);
	}
	await nextTick();
};

describe('index.ts', () => {
	it('basic', () => {
		expect(typeof Defer).toBe('object');
	});

	it('create', async () => {
		const wrapper = mount(() => (<Defer />));
		expect(wrapper.classes()).toEqual([]);
	});

	it('renders default slot for each row and emits complete with timestamp', async () => {
		const onComplete = vi.fn();
		const dataSource = genTableData(20);

		const wrapper = mount(() => (
			<div class="container">
				<Defer data={dataSource} onComplete={onComplete}>
					{{
						default: ({ row }: any) => (
							<div class="box" data-id={row.id} style={{ background: row.background }}>
								{ row.count }
							</div>
						)
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		await flushIdle();

		expect(wrapper.findAll('.box').length).toBe(20);
		expect(wrapper.find('[data-id="id__0"]').exists()).toBe(true);
		expect(wrapper.find('[data-id="id__19"]').exists()).toBe(true);

		expect(onComplete).toHaveBeenCalledTimes(1);
		const elapsed = onComplete.mock.calls[0][0];
		expect(typeof elapsed).toBe('number');
		expect(elapsed).toBeGreaterThanOrEqual(0);

		wrapper.unmount();
	});

	it('disabled renders all rows synchronously and skips complete', async () => {
		const onComplete = vi.fn();
		const dataSource = genTableData(15);

		const wrapper = mount(() => (
			<div>
				<Defer data={dataSource} disabled onComplete={onComplete}>
					{{
						default: ({ row }: any) => <div class="box">{ row.count }</div>
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		expect(wrapper.findAll('.box').length).toBe(15);
		await flushIdle();
		expect(onComplete).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('toggling disabled from false to true forces full render and stops scheduling', async () => {
		const onComplete = vi.fn();
		const disabled = ref(false);
		const dataSource = genTableData(40);

		const wrapper = mount(defineComponent({
			setup() {
				return () => (
					<div>
						<Defer
							data={dataSource}
							disabled={disabled.value}
							concurrency={1}
							onComplete={onComplete}
						>
							{{
								default: ({ row }: any) => <div class="box">{ row.count }</div>
							}}
						</Defer>
					</div>
				);
			}
		}), { attachTo: document.body });

		disabled.value = true;
		await nextTick();

		expect(wrapper.findAll('.box').length).toBe(40);

		await flushIdle();
		// 切到 disabled 后, complete 不再触发
		expect(onComplete).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('once: keeps full render when data updates after first complete', async () => {
		const onComplete = vi.fn();
		const count = ref(10);
		const dataSource = computed(() => genTableData(count.value));

		const wrapper = mount(defineComponent({
			setup() {
				return () => (
					<div>
						<Defer data={dataSource.value} concurrency={5} onComplete={onComplete}>
							{{
								default: ({ row }: any) => <div class="box">{ row.count }</div>
							}}
						</Defer>
					</div>
				);
			}
		}), { attachTo: document.body });

		await flushIdle();
		expect(wrapper.findAll('.box').length).toBe(10);
		expect(onComplete).toHaveBeenCalledTimes(1);

		count.value = 30;
		await nextTick();
		await flushIdle();

		expect(wrapper.findAll('.box').length).toBe(30);
		// once 默认为 true: 完成一次后, 视为 disabled, 不再触发 complete
		expect(onComplete).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('once=false: re-runs scheduling and re-emits complete on data update', async () => {
		const onComplete = vi.fn();
		const count = ref(10);
		const dataSource = computed(() => genTableData(count.value));

		const wrapper = mount(defineComponent({
			setup() {
				return () => (
					<div>
						<Defer data={dataSource.value} concurrency={5} once={false} onComplete={onComplete}>
							{{
								default: ({ row }: any) => <div class="box">{ row.count }</div>
							}}
						</Defer>
					</div>
				);
			}
		}), { attachTo: document.body });

		await flushIdle();
		expect(wrapper.findAll('.box').length).toBe(10);
		expect(onComplete).toHaveBeenCalledTimes(1);

		count.value = 18;
		await nextTick();
		await flushIdle();

		expect(wrapper.findAll('.box').length).toBe(18);
		expect(onComplete).toHaveBeenCalledTimes(2);

		wrapper.unmount();
	});

	it('uses custom primaryKey for slot key', async () => {
		const dataSource = [
			{ uid: 'a', value: 1 },
			{ uid: 'b', value: 2 },
			{ uid: 'c', value: 3 }
		];

		const wrapper = mount(() => (
			<div>
				<Defer data={dataSource} primaryKey="uid" disabled>
					{{
						default: ({ row }: any) => <span class="cell">{ row.value }</span>
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		const cells = wrapper.findAll('.cell');
		expect(cells.length).toBe(3);
		expect(cells[0].text()).toBe('1');
		expect(cells[2].text()).toBe('3');

		wrapper.unmount();
	});

	it('does not emit complete when data is empty', async () => {
		const onComplete = vi.fn();

		const wrapper = mount(() => (
			<div>
				<Defer data={[]} onComplete={onComplete}>
					{{
						default: ({ row }: any) => <div class="box">{ row.count }</div>
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		await flushIdle();
		expect(wrapper.findAll('.box').length).toBe(0);
		expect(onComplete).not.toHaveBeenCalled();

		wrapper.unmount();
	});

	it('clears pending idle task on unmount and never emits complete', async () => {
		const onComplete = vi.fn();
		const dataSource = genTableData(20);

		const wrapper = mount(() => (
			<div>
				<Defer data={dataSource} concurrency={1} onComplete={onComplete}>
					{{
						default: ({ row }: any) => <div class="box">{ row.count }</div>
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		// 立即卸载, 让 onBeforeUnmount + cic 走到
		wrapper.unmount();
		await flushIdle();

		expect(onComplete).not.toHaveBeenCalled();
	});

	it('runs in multiple slices when frame budget is exhausted between batches', async () => {
		const onComplete = vi.fn();
		const dataSource = genTableData(20);

		// 模拟 performance.now 每次被调用都前进 1ms, 让 timeRemaining 在
		// FRAME_BUDGET (5ms) 内迅速归零, 以触发 schedule 多次重新排队 (defer.tsx 中 ric 的再调度分支)。
		let nowVal = 0;
		const spy = vi.spyOn(performance, 'now').mockImplementation(() => {
			nowVal += 1;
			return nowVal;
		});

		try {
			const wrapper = mount(() => (
				<div>
					<Defer data={dataSource} concurrency={1} onComplete={onComplete}>
						{{
							default: ({ row }: any) => <div class="box">{ row.count }</div>
						}}
					</Defer>
				</div>
			), { attachTo: document.body });

			await flushIdle(60);

			expect(wrapper.findAll('.box').length).toBe(20);
			expect(onComplete).toHaveBeenCalledTimes(1);

			wrapper.unmount();
		} finally {
			spy.mockRestore();
		}
	});

	it('respects concurrency by stepping in batches', async () => {
		const onComplete = vi.fn();
		const dataSource = genTableData(50);

		const wrapper = mount(() => (
			<div>
				<Defer data={dataSource} concurrency={50} onComplete={onComplete}>
					{{
						default: ({ row }: any) => <div class="box">{ row.count }</div>
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		await flushIdle();

		expect(wrapper.findAll('.box').length).toBe(50);
		expect(onComplete).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});
});
