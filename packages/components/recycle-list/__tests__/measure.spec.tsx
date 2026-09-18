// @vitest-environment jsdom

import { RecycleList } from '@deot/vc-components';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import { vi } from 'vitest';

// Defer 的任务改为手动逐个执行，才能稳定地停在「隐藏池渲染到一半」的时刻
const tasks = vi.hoisted(() => new Map<string, (deadline: IdleDeadline) => void>());
vi.mock('../../defer/utils.ts', () => {
	let uid = 0;
	return {
		rIC: (callback: (deadline: IdleDeadline) => void) => {
			const id = `task-${++uid}`;
			tasks.set(id, callback);
			return id;
		},
		cIC: (id: string) => {
			tasks.delete(id);
		}
	};
});

/**
 * 执行队列里最早的一个 Defer 任务
 * @returns 是否执行了任务
 */
const runTask = () => {
	const entry = tasks.entries().next();
	if (entry.done) return false;
	tasks.delete(entry.value[0]);
	// 与 utils 的实现口径一致：给足一个时间片
	entry.value[1]({ didTimeout: false, timeRemaining: () => 5 });
	return true;
};

const flushMicrotasks = async (times = 30) => {
	for (let i = 0; i < times; i++) await Promise.resolve();
};

/**
 * 执行完所有 Defer 任务，直到隐藏池不再有待测节点
 * @param states store.states
 */
const drain = async (states: any) => {
	for (let i = 0; i < 100 && (tasks.size > 0 || states.preData.length > 0); i++) {
		runTask();
		await flushMicrotasks();
	}
};

const buildItem = (id: number) => ({ id });
const heightOf = (id: number) => 20 + id;

describe('RecycleList measurement', () => {
	let restore: () => void;

	beforeEach(() => {
		tasks.clear();
		const proto = HTMLElement.prototype;
		const descriptors = ['offsetHeight', 'clientHeight', 'scrollHeight'].map(key => [key, Object.getOwnPropertyDescriptor(proto, key)] as const);
		Object.defineProperty(proto, 'offsetHeight', {
			configurable: true,
			get(this: HTMLElement) {
				const item = this.querySelector(':scope > .x');
				return item ? heightOf(Number(item.textContent)) : 40;
			}
		});
		Object.defineProperty(proto, 'clientHeight', { configurable: true, get: () => 200 });
		Object.defineProperty(proto, 'scrollHeight', { configurable: true, get: () => 5000 });
		restore = () => descriptors.forEach(([key, descriptor]) => descriptor && Object.defineProperty(proto, key, descriptor));
	});

	afterEach(() => restore());

	it('measures each pooled node by its own element while nodes move during slicing', async () => {
		const data = ref(Array.from({ length: 30 }, (_, i) => buildItem(i)));
		const listRef = ref<any>();
		const wrapper = mount(() => (
			<RecycleList ref={listRef} data={data.value} batchCount={40} disabled>
				{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
			</RecycleList>
		), { attachTo: document.body });
		const states = listRef.value.store.states;
		await drain(states);
		expect(states.preData.length).toBe(0);

		const old = data.value;
		const fresh = Array.from({ length: 15 }, (_, i) => buildItem(100 + i));
		// 头部插入 15 条全新数据：它们在隐藏池里分片渲染，先只渲染一片
		data.value = [...fresh, ...old];
		await flushMicrotasks();
		runTask();
		await flushMicrotasks();
		expect(wrapper.findAll('.vc-recycle-list__pool .x').length).toBe(10);

		// 分片未完成时：把一条已测过的行挪到最前，并删掉第二条新数据。
		// 第一条新数据的下标从 0 变为 1，正好是被删那条原来的下标
		data.value = [old[0], fresh[0], ...fresh.slice(2), ...old.slice(1)];
		await flushMicrotasks();
		await drain(states);

		expect(states.preData.length).toBe(0);
		states.rebuildData.forEach((node: any) => {
			expect([node.states.data.id, node.states.size]).toEqual([node.states.data.id, heightOf(node.states.data.id)]);
		});
		wrapper.unmount();
	});

	it('measures the first batch without waiting for the next one to leave the pool', async () => {
		const data = ref(Array.from({ length: 40 }, (_, i) => buildItem(i)));
		const listRef = ref<any>();
		// batchCount=10：挂载时 setData 建第一批，紧接着懒构建第二批，两批同时待测
		const wrapper = mount(() => (
			<RecycleList ref={listRef} data={data.value} batchCount={10} disabled>
				{{ default: ({ row }: any) => <div class="x">{row.id}</div> }}
			</RecycleList>
		), { attachTo: document.body });
		const states = listRef.value.store.states;
		await flushMicrotasks();
		expect(states.preData.length).toBe(20);

		// 只放行一片：起始步长 10，正好是第一批
		runTask();
		await flushMicrotasks();

		const sizeOf = (node: any) => node.states.size;
		const first = states.rebuildData.slice(0, 10).map(sizeOf);
		const second = states.rebuildData.slice(10, 20).map(sizeOf);
		// 第一批已经量到真实尺寸并排版，第二批还在池里排队
		expect(first.every((size: number) => size > 0)).toBe(true);
		expect(second.every((size: number) => size === 0)).toBe(true);
		expect(states.contentMaxSize).toBeGreaterThan(0);

		await drain(states);
		states.rebuildData.forEach((node: any) => {
			expect(node.states.size).toBe(heightOf(node.states.data.id));
		});
		wrapper.unmount();
	});
});
