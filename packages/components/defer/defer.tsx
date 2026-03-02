/** @jsxImportSource vue */

import { ref, computed, defineComponent, renderList, renderSlot, watch, onBeforeUnmount } from 'vue';
import { raf, caf } from '@deot/helper-utils';

const COMPONENT_NAME = 'vc-defer';
const IDLE_BATCH_BUDGET_MS = 2;

const hasIdleCallback = typeof requestIdleCallback !== 'undefined' && typeof cancelIdleCallback !== 'undefined';

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
		concurrency: {
			type: Number,
			default: hasIdleCallback ? 10 : 100
		},
		disabled: {
			type: Boolean,
			default: false
		}
	},
	emits: ['complete'],
	setup(props, { slots, emit }) {
		const currentValue = ref<any[]>([]);
		const currentCount = ref(props.concurrency);
		const isUnmount = ref(false);

		const maxCount = computed(() => props.data.length);

		let idleId: any;
		let rafId: any;

		const clear = () => {
			idleId && cancelIdleCallback(idleId);
			rafId && caf(rafId);
		};

		const runByRaf = () => {
			return new Promise((resolve) => {
				const schedule = () => {
					currentCount.value += props.concurrency;
					if (isUnmount.value) return resolve(0);
					if (currentCount.value >= maxCount.value) {
						return resolve(1);
					}
					rafId = raf(schedule);
				};
				rafId = raf(schedule);
			});
		};

		const runByIdleCallback = () => {
			return new Promise((resolve) => {
				const schedule = (deadline: IdleDeadline) => {
					while (
						!isUnmount.value
						&& currentCount.value < maxCount.value
						&& (deadline.didTimeout || deadline.timeRemaining() > IDLE_BATCH_BUDGET_MS)
					) {
						currentCount.value += props.concurrency;
					}
					if (isUnmount.value) return resolve(0);
					if (currentCount.value >= maxCount.value) {
						return resolve(1);
					}
					idleId = requestIdleCallback(schedule, { timeout: 100 });
				};
				idleId = requestIdleCallback(schedule, { timeout: 100 });
			});
		};

		const run = async () => {
			if (props.disabled) return;
			const start = Date.now();
			clear();
			currentCount.value = props.concurrency;

			if (maxCount.value <= 0) return;
			const fn = hasIdleCallback ? runByIdleCallback : runByRaf;
			if (await fn()) {
				console.log('complete', Date.now() - start, maxCount.value);
				emit('complete', Date.now() - start);
			};
		};

		watch(
			() => props.data,
			(v) => {
				currentValue.value = Array.isArray(v) ? v : [];
				run();
			},
			{ immediate: true }
		);

		watch(
			() => props.disabled,
			(v) => {
				if (!v) return;
				clear();
				currentCount.value = maxCount.value;
			},
			{ immediate: true }
		);

		onBeforeUnmount(() => {
			isUnmount.value = true;
			clear();
		});

		return () => {
			return renderList(
				currentValue.value.slice(0, currentCount.value),
				(row: any, index: number) =>
					renderSlot(slots, 'default', {
						key: row[props.primaryKey],
						row,
						index
					})
			);
		};
	}
});
