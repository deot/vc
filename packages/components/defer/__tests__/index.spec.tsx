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

// 占住主线程指定毫秒数，用来模拟昂贵的渲染
const busy = (ms: number) => {
	const until = performance.now() + ms;
	while (performance.now() < until) { /* 占用主线程 */ }
};

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

	it('renders default slot for each row and emits complete with timestamp and data', async () => {
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
		const [elapsed, rendered] = onComplete.mock.calls[0];
		expect(typeof elapsed).toBe('number');
		expect(elapsed).toBeGreaterThanOrEqual(0);
		expect(rendered).toBe(dataSource);

		wrapper.unmount();
	});

	it('disabled renders all rows synchronously and still emits complete', async () => {
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
		// complete 表示当前 data 已全部渲染，与是否经过分片无关
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete.mock.calls[0][1]).toBe(dataSource);

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
		// 调度中切到 disabled：剩余分片被取消，全部展示后发出一次 complete
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete.mock.calls[0][1]).toBe(dataSource);

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
		// once 默认为 true：完成一次后不再分片，更新直接全部渲染，渲染完同样发出 complete
		expect(onComplete).toHaveBeenCalledTimes(2);
		expect(onComplete.mock.calls[1][1]).toBe(dataSource.value);

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

	it('emits complete with the empty data when data is empty', async () => {
		const onComplete = vi.fn();
		const empty: any[] = [];

		const wrapper = mount(() => (
			<div>
				<Defer data={empty} onComplete={onComplete}>
					{{
						default: ({ row }: any) => <div class="box">{ row.count }</div>
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		await flushIdle();
		expect(wrapper.findAll('.box').length).toBe(0);
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(onComplete.mock.calls[0][1]).toBe(empty);

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

	it('commits one slice per task and grows the step toward the frame budget', async () => {
		const onComplete = vi.fn();
		const dataSource = genTableData(30);
		// 每片渲染完成发一次 progress，带上已渲染条数，据此还原每片的步长
		const counts: number[] = [];

		const wrapper = mount(() => (
			<div class="host">
				<Defer
					data={dataSource}
					concurrency={10}
					onComplete={onComplete}
					onProgress={(count: number) => counts.push(count)}
				>
					{{
						default: ({ row }: any) => <div class="box">{ row.count }</div>
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		await flushIdle(20);

		const sizes = counts.map((count, i) => count - (counts[i - 1] || 0));
		// 首片用起始步长；之后按时间片预算放大（这里每行都很轻，第二片就把剩余的吃完）
		expect(sizes[0]).toBe(10);
		expect(sizes.length).toBeGreaterThan(1);
		expect(sizes[1]).toBeGreaterThan(sizes[0]);
		expect(counts.at(-1)).toBe(30);
		expect(wrapper.findAll('.box').length).toBe(30);
		expect(onComplete).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});

	it('keeps the rendered prefix mounted when data is replaced', async () => {
		const onComplete = vi.fn();
		const mounts = new Map<string, number>();
		const Row = defineComponent({
			props: { id: String },
			setup(props) {
				mounts.set(props.id!, (mounts.get(props.id!) || 0) + 1);
				return () => <div class="box">{ props.id }</div>;
			}
		});
		const data = ref(genTableData(3));

		const wrapper = mount(() => (
			<div>
				<Defer data={data.value} once={false} concurrency={10} onComplete={onComplete}>
					{{
						default: ({ row }: any) => <Row id={row.id} />
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		await flushIdle();
		expect(wrapper.findAll('.box').length).toBe(3);

		// 末尾追加：前 3 条位置与 key 不变，应保持挂载，只调度新增的一条
		data.value = [...data.value, { id: 'id__3', background: '', count: 4 }];
		await flushIdle();

		expect(wrapper.findAll('.box').length).toBe(4);
		expect([mounts.get('id__0'), mounts.get('id__1'), mounts.get('id__2')]).toEqual([1, 1, 1]);
		expect(mounts.get('id__3')).toBe(1);
		// 每轮非空调度各发出一次 complete
		expect(onComplete).toHaveBeenCalledTimes(2);

		wrapper.unmount();
	});

	it('does not emit a stale complete when data is replaced as the previous round finishes', async () => {
		const dataA = genTableData(10);
		const dataB = Array.from({ length: 30 }, (_, index) => ({ id: `b__${index}`, background: '', count: index }));
		const data = ref<any[]>(dataA);
		const completedWithCounts: number[] = [];
		let swapped = false;

		const wrapper = mount(() => (
			<div class="host">
				<Defer
					data={data.value}
					once={false}
					concurrency={10}
					onComplete={() => completedWithCounts.push(wrapper.element.querySelectorAll('.box').length)}
				>
					{{
						default: ({ row }: any) => {
							// 上一轮最后一片提交的同一次更新里替换数据：旧一轮的 complete 此时尚未发出
							if (!swapped && row.id === dataA[dataA.length - 1].id) {
								swapped = true;
								data.value = dataB;
							}
							return <div class="box">{ row.count }</div>;
						}
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		await flushIdle(20);

		// 只为最新一轮发出 complete，且发出时新数据已全部渲染
		expect(completedWithCounts).toEqual([30]);

		wrapper.unmount();
	});

	it('restores all rows when disabled switches back to false after data grew', async () => {
		const disabled = ref(true);
		const data = ref(genTableData(10));

		const wrapper = mount(() => (
			<div>
				<Defer data={data.value} disabled={disabled.value} once={false} concurrency={5}>
					{{
						default: ({ row }: any) => <div class="box">{ row.count }</div>
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		await nextTick();
		expect(wrapper.findAll('.box').length).toBe(10);

		// 禁用期间数据变长：直接全部展示
		data.value = genTableData(30);
		await nextTick();
		expect(wrapper.findAll('.box').length).toBe(30);

		// 恢复启用：已展示的数据不应被截回旧长度
		disabled.value = false;
		await flushIdle();
		expect(wrapper.findAll('.box').length).toBe(30);

		wrapper.unmount();
	});

	it('slices new data when it arrives in the same update that re-enables scheduling', async () => {
		const onComplete = vi.fn();
		const disabled = ref(true);
		const data = ref(genTableData(10));

		const wrapper = mount(() => (
			<div>
				<Defer data={data.value} disabled={disabled.value} once={false} concurrency={5} onComplete={onComplete}>
					{{
						default: ({ row }: any) => <div class="box">{ row.count }</div>
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		await nextTick();
		expect(wrapper.findAll('.box').length).toBe(10);

		// 同一次更新里恢复启用并换成更长的数据：保留已展示的前缀，其余照常分片，不能因恢复启用而整批渲染
		disabled.value = false;
		data.value = genTableData(30);
		await nextTick();
		expect(wrapper.findAll('.box').length).toBe(10);

		await flushIdle();
		expect(wrapper.findAll('.box').length).toBe(30);
		// 禁用时的首份数据、分片完成的新数据各发一次
		expect(onComplete.mock.calls.map(([, rendered]) => rendered.length)).toEqual([10, 30]);

		wrapper.unmount();
	});

	it('shrinks the step when rows are expensive to render', async () => {
		const dataSource = genTableData(40);
		const counts: number[] = [];

		const wrapper = mount(() => (
			<div class="host">
				<Defer
					data={dataSource}
					concurrency={10}
					onProgress={(count: number) => counts.push(count)}
				>
					{{
						default: ({ row }: any) => {
							// 每行约 2ms：一个时间片装不下起始步长的 10 行
							busy(2);
							return <div class="box">{ row.count }</div>;
						}
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		await flushIdle(60);

		const sizes = counts.map((count, i) => count - (counts[i - 1] || 0));
		expect(sizes[0]).toBe(10);
		// 上一片超了预算，按比例缩小到装得下的条数
		expect(sizes.slice(1).every(size => size < 10)).toBe(true);
		expect(counts.at(-1)).toBe(40);
		expect(wrapper.findAll('.box').length).toBe(40);

		wrapper.unmount();
	});

	it('grows the step when the cost is per slice instead of per row', async () => {
		const dataSource = genTableData(120);
		const counts: number[] = [];
		// 每片的第一行付掉固定开销，其余行几乎不花时间：模拟"耗时与条数无关"的一次往返成本
		let renderedInSlice = 0;

		const wrapper = mount(() => (
			<div class="host">
				<Defer
					data={dataSource}
					concurrency={10}
					onProgress={(count: number) => {
						counts.push(count);
						renderedInSlice = 0;
					}}
				>
					{{
						default: ({ row }: any) => {
							if (!renderedInSlice) busy(6);
							renderedInSlice++;
							return <div class="box">{ row.count }</div>;
						}
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		await flushIdle(60);

		const sizes = counts.map((count, i) => count - (counts[i - 1] || 0));
		expect(sizes[0]).toBe(10);
		// 固定开销没有被摊进每一行，步长会持续放大把它摊薄
		expect(Math.max(...sizes)).toBeGreaterThan(10);
		expect(counts.at(-1)).toBe(120);

		wrapper.unmount();
	});

	it('stops shrinking when a smaller slice is not any cheaper', async () => {
		const dataSource = genTableData(60);
		const counts: number[] = [];
		// 固定开销大于一个时间片的预算：继续缩小换不来更短的耗时，只会多付几次往返
		let renderedInSlice = 0;

		const wrapper = mount(() => (
			<div class="host">
				<Defer
					data={dataSource}
					concurrency={10}
					onProgress={(count: number) => {
						counts.push(count);
						renderedInSlice = 0;
					}}
				>
					{{
						default: ({ row }: any) => {
							if (!renderedInSlice) busy(20);
							renderedInSlice++;
							return <div class="box">{ row.count }</div>;
						}
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		await flushIdle(80);

		const sizes = counts.map((count, i) => count - (counts[i - 1] || 0));
		expect(sizes[0]).toBe(10);
		// 缩过一次发现没变快就停住，不会一路塌到 1
		expect(Math.min(...sizes.slice(0, -1))).toBeGreaterThanOrEqual(4);
		expect(counts.at(-1)).toBe(60);

		wrapper.unmount();
	});

	it('emits progress after each committed slice and completes last', async () => {
		const events: string[] = [];
		const dataSource = genTableData(30);
		const counts: number[] = [];

		const wrapper = mount(() => (
			<div class="host">
				<Defer
					data={dataSource}
					concurrency={10}
					onProgress={(count: number, rows: any[]) => {
						counts.push(count);
						events.push(`progress:${rows.length}`);
					}}
					onComplete={() => events.push('complete')}
				>
					{{
						default: ({ row }: any) => <div class="box">{ row.count }</div>
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		await flushIdle(20);

		expect(counts.length).toBeGreaterThan(1);
		// 条数单调递增，最后一次等于总数；complete 在最后一次 progress 之后
		expect(counts.every((count, i) => count > (counts[i - 1] || 0))).toBe(true);
		expect(counts.at(-1)).toBe(30);
		expect(events.at(-1)).toBe('complete');
		expect(events.filter(v => v === 'complete').length).toBe(1);
		expect(events.at(-2)).toBe('progress:30');

		wrapper.unmount();
	});

	it('renders each row once no matter how many slices it takes', async () => {
		const dataSource = genTableData(200);
		const renders = new Map<string, number>();

		const wrapper = mount(() => (
			<div class="host">
				<Defer data={dataSource} concurrency={10}>
					{{
						default: ({ row }: any) => {
							renders.set(row.id, (renders.get(row.id) || 0) + 1);
							return <div class="box">{ row.count }</div>;
						}
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		await flushIdle(30);

		// 已提交的分片不再参与父组件的更新：每行只渲染一次
		expect(renders.size).toBe(200);
		expect([...renders.values()].every(times => times === 1)).toBe(true);

		wrapper.unmount();
	});

	it('updates rendered rows when reactive state they read changes', async () => {
		const dataSource = genTableData(30);
		const suffix = ref('a');

		const wrapper = mount(() => (
			<div class="host">
				<Defer data={dataSource} concurrency={10}>
					{{
						default: ({ row }: any) => <div class="box">{ `${row.count}-${suffix.value}` }</div>
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		await flushIdle();
		const texts = () => wrapper.findAll('.box').map(node => node.text());
		expect(texts().at(-1)!.endsWith('-a')).toBe(true);

		suffix.value = 'b';
		await nextTick();

		expect(texts().every(text => text.endsWith('-b'))).toBe(true);
		expect(texts().length).toBe(30);

		wrapper.unmount();
	});

	it('clamps the final step to the remaining rows', async () => {
		const onComplete = vi.fn();
		const dataSource = genTableData(25);

		const wrapper = mount(() => (
			<div>
				<Defer data={dataSource} concurrency={10} onComplete={onComplete}>
					{{
						default: ({ row }: any) => <div class="box">{ row.count }</div>
					}}
				</Defer>
			</div>
		), { attachTo: document.body });

		await flushIdle();

		expect(wrapper.findAll('.box').length).toBe(25);
		expect(onComplete).toHaveBeenCalledTimes(1);

		wrapper.unmount();
	});
});
