/** @jsxImportSource vue */

import { ref, shallowRef, computed, defineComponent, renderSlot, watch, nextTick, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import { rIC, cIC } from './utils.ts';

const COMPONENT_NAME = 'vc-defer';

// 一片相对上一片最多放大 / 缩小的倍数：单次抖动不至于放出巨片，也不至于一步塌到 1
const MAX_GROWTH = 2;
const MAX_SHRINK = 0.5;

// 预算的使用率：留出余量，估得再准也有抖动，用满容易冲过一帧
const BUDGET_RATIO = 0.8;

/**
 * 已提交的一片
 *
 * 渲染函数走 props 而不是 slot：Vue 只要发现子组件有 slot 就会在父组件更新时强制更新它，
 * 改成 props 后已提交的分片 props 引用不变，父组件重渲染会直接跳过，已渲染的内容不再参与 diff。
 * 行内容依赖的响应式状态仍然正常更新——slot 在分片自己的渲染里执行，依赖由分片追踪
 */
const DeferChunk = defineComponent({
	name: 'vc-defer-chunk',
	props: {
		rows: {
			type: Array as PropType<any[]>,
			required: true
		},
		start: {
			type: Number,
			required: true
		},
		render: {
			type: Function as PropType<(row: any, index: number) => any>,
			required: true
		}
	},
	setup(props) {
		return () => props.rows.map((row, index) => props.render(row, props.start + index));
	}
});

export const Defer = defineComponent({
	name: COMPONENT_NAME,
	props: {
		data: {
			type: Array,
			default: []
		},
		primaryKey: {
			type: String,
			default: 'id'
		},

		// 起始步长；之后按每片的实测耗时向时间片预算收敛
		concurrency: {
			type: Number,
			default: 10
		},
		disabled: {
			type: Boolean,
			default: false
		},

		// 为true时避免删除/添加时重渲染
		once: {
			type: Boolean,
			default: true
		}
	},
	emits: ['complete', 'progress'],
	setup(props, { slots, emit }) {
		const currentValue = shallowRef<any[]>([]);
		// 已提交的分片；每片一个子组件
		const chunks = shallowRef<any[][]>([]);
		const isCompletedOnce = ref(false);
		const maxCount = computed(() => props.data.length);
		const disabled = computed(() => props.disabled || (props.once && isCompletedOnce.value));

		let isUnmounted = false;
		let idleId: any;
		// 调度轮次；新一轮开始或调度中切到禁用时递增，用于作废被取代的旧一轮
		let runId = 0;
		// 已提交的条数
		let renderedCount = 0;
		/**
		 * 最近两片的 (条数, 耗时)
		 *
		 * 步长按「上一片用掉多少预算」整片伸缩，不折算单行耗时：
		 * 单行耗时 = 本片耗时 / 条数 会把一次往返的固定开销摊进每一行，
		 * 片越小单价越高、下一片更小，步长会一路塌到 1
		 */
		let lastRun: { size: number; cost: number } | null = null;
		let prevRun: { size: number; cost: number } | null = null;
		// 已经验证过「再缩也不会更快」的条数，作为步长下限；新一轮重新评估
		let stableSize = 0;

		const clear = () => {
			idleId && cIC(idleId);
		};

		/**
		 * 提交一片
		 * @param size 本片最多渲染的条数
		 * @returns 实际提交的条数
		 */
		const commit = (size: number) => {
			const rows = currentValue.value.slice(renderedCount, renderedCount + size);
			if (!rows.length) return 0;
			chunks.value = [...chunks.value, rows];
			renderedCount += rows.length;
			return rows.length;
		};

		/**
		 * 保留已渲染的前缀，其余分片丢弃
		 *
		 * 完全落在前缀内的分片原样保留（props 引用不变，不会重新渲染），跨界的那一片切一刀重建
		 * @param kept 可保留的已渲染条数
		 */
		const keepRendered = (kept: number) => {
			const next: any[][] = [];
			let count = 0;
			for (const chunk of chunks.value) {
				if (count + chunk.length <= kept) {
					next.push(chunk);
					count += chunk.length;
					continue;
				}
				if (kept > count) {
					next.push(currentValue.value.slice(count, kept));
					count = kept;
				}
				break;
			}
			chunks.value = next;
			renderedCount = count;
			// 整轮从头渲染：重新从起始步长开始。保留了前缀则是同一批内容的延续，沿用已经测出来的步长
			if (!count) {
				lastRun = null;
				prevRun = null;
				stableSize = 0;
			}
		};

		/**
		 * 记录一片的实测耗时
		 * @param size 本片条数
		 * @param cost 本片从提交到渲染完成的耗时
		 */
		const observe = (size: number, cost: number) => {
			prevRun = lastRun;
			lastRun = { size, cost };
		};

		/**
		 * 本片的条数：上一片用掉多少预算，就按比例伸缩
		 *
		 * 首片用使用方给的起始步长；之后整片与预算相比，没用满就放大、超了就缩小，
		 * 固定开销大的场景因此会自动放大步长把它摊薄，而不是越切越小
		 * @param deadline 时间片
		 * @returns 本片条数
		 */
		const getStep = (deadline: IdleDeadline) => {
			if (!lastRun) return Math.max(1, props.concurrency);
			if (deadline.didTimeout || !lastRun.cost) return lastRun.size;

			const budget = deadline.timeRemaining() * BUDGET_RATIO;
			const scale = budget / lastRun.cost;

			// 上一次缩小换来的降幅远小于缩小的幅度：耗时与条数关系不大（固定开销主导），
			// 再缩只会多付几次往返，把这个条数记成下限
			if (scale < 1 && prevRun && lastRun.size < prevRun.size) {
				const shrunk = (prevRun.size - lastRun.size) / prevRun.size;
				const gained = (prevRun.cost - lastRun.cost) / prevRun.cost;
				if (gained < shrunk / 2) stableSize = lastRun.size;
			}

			const next = lastRun.size * Math.min(MAX_GROWTH, Math.max(MAX_SHRINK, scale));
			return Math.max(1, stableSize, Math.floor(next));
		};

		/**
		 * 一片提交后等更新进入 DOM，并发出进度
		 *
		 * 使用方据此判断自己关心的那部分是否已经渲染，不必等整轮结束；
		 * 期间若新一轮已开始（data 被替换）或已卸载，这一轮已被取代，不再发出
		 * @param id 本轮编号
		 * @param size 本片实际提交的条数，为 0 时只等更新不发进度
		 */
		const flush = async (id: number, size: number) => {
			await nextTick();
			if (isUnmounted || id !== runId || size <= 0) return;
			emit('progress', renderedCount, currentValue.value);
		};

		/**
		 * 当前这份 data 已全部渲染：等本轮更新提交到 DOM 后发出 complete
		 *
		 * 期间若新一轮已开始（data 被替换）或已卸载，这一轮已被取代，不能再发出，
		 * 否则使用方会把尚未渲染的新数据当作已渲染
		 * @param id 本轮编号
		 * @param start 本轮开始时间
		 */
		const complete = async (id: number, start: number) => {
			await nextTick();
			if (isUnmounted || id !== runId) return;
			emit('complete', Date.now() - start, currentValue.value);
		};

		/**
		 * 逐片渲染，每片之间让出主线程
		 *
		 * 渲染开销发生在回调返回后的 Vue 更新里，无法在回调内按预算累加，因此改为：
		 * 每片只提交一次，等这次更新完成后测出这一片的耗时，用它决定下一片的条数
		 * @param id 本轮编号
		 * @returns true 表示全部渲染完成，false 表示中途卸载
		 */
		const runByIdleCallback = (id: number) => {
			return new Promise<boolean>((resolve) => {
				const schedule = async (deadline: IdleDeadline) => {
					if (isUnmounted) return resolve(false);

					const started = performance.now();
					const size = commit(getStep(deadline));
					await flush(id, size);
					if (isUnmounted) return resolve(false);

					if (size > 0) observe(size, performance.now() - started);

					if (renderedCount >= maxCount.value) return resolve(true);
					idleId = rIC(schedule);
				};
				idleId = rIC(schedule);
			});
		};

		/**
		 * 开始一轮调度
		 * @param kept 保留、无需重新渲染的已渲染条数
		 */
		const run = async (kept = 0) => {
			const id = ++runId;
			const start = Date.now();
			clear();
			keepRendered(kept);

			// 禁用或数据已全部渲染：直接补齐剩余部分
			if (disabled.value || renderedCount >= maxCount.value) {
				flush(id, commit(maxCount.value - renderedCount));
				complete(id, start);
				return;
			}

			if (!(await runByIdleCallback(id)) || id !== runId) return;
			isCompletedOnce.value = true;
			complete(id, start);
		};

		/**
		 * 替换数组时，已渲染部分中与新数组位置、key 都相同的前缀保持挂载，只重新调度其余部分；
		 * 否则每次替换都会把已渲染的条目卸载后再逐片渲染一遍
		 * @param next 新数组
		 * @returns 可保留的已渲染条数
		 */
		const getKeptCount = (next: any[]) => {
			const key = props.primaryKey;
			const rendered = currentValue.value;
			const limit = Math.min(renderedCount, rendered.length, next.length);
			let kept = 0;
			while (
				kept < limit
				&& rendered[kept]?.[key] != null
				&& rendered[kept][key] === next[kept]?.[key]
			) {
				kept++;
			}
			return kept;
		};

		watch(
			() => props.data,
			(v) => {
				const next = Array.isArray(v) ? v : [];
				const kept = getKeptCount(next);
				currentValue.value = next;
				run(kept);
			},
			{ immediate: true }
		);

		watch(
			() => disabled.value,
			(v) => {
				// 恢复启用时不改分片：同一次更新里若数据也变了，新一轮已在 data 的 watch 中开始分片。
				// 已经全部渲染（包括 once 刚完成这一轮）时也无事可做
				if (!v || renderedCount >= maxCount.value) return;
				// 调度中切到禁用：取消剩余分片，直接补齐
				clear();
				const id = ++runId;
				flush(id, commit(maxCount.value - renderedCount));
				complete(id, Date.now());
			},
			{ immediate: true }
		);

		onBeforeUnmount(() => {
			isUnmounted = true;
			clear();
		});

		// 稳定引用：分片以 props 接收它，已提交的分片才不会随父组件重渲染
		const renderRow = (row: any, index: number) => {
			return renderSlot(slots, 'default', {
				key: row[props.primaryKey],
				row,
				index
			});
		};

		return () => {
			let start = 0;
			return chunks.value.map((rows, index) => {
				const chunk = (
					<DeferChunk
						key={index}
						rows={rows}
						start={start}
						render={renderRow}
					/>
				);
				start += rows.length;
				return chunk;
			});
		};
	}
});
