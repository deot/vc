/** @jsxImportSource vue */

import { ref, shallowRef, computed, defineComponent, renderList, renderSlot, watch, onBeforeUnmount } from 'vue';
import { ric, cic } from './utils.ts';

const COMPONENT_NAME = 'vc-defer';

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
	emits: ['complete'],
	setup(props, { slots, emit }) {
		const currentValue = shallowRef<any[]>([]);
		const currentCount = ref(0);
		const isUnmount = ref(false);
		const isCompletedOnce = ref(false);
		const maxCount = computed(() => props.data.length);
		const disabled = computed(() => props.disabled || (props.once && isCompletedOnce.value));

		let idleId: any;

		const clear = () => {
			idleId && cic(idleId);
		};

		const runByIdleCallback = () => {
			return new Promise((resolve) => {
				const schedule = (deadline: IdleDeadline) => {
					const max = maxCount.value;
					const step = props.concurrency;
					let count = currentCount.value;

					while (
						!isUnmount.value
						&& count < max
						&& (deadline.didTimeout || deadline.timeRemaining() > 0)
					) {
						count += step;
					}
					currentCount.value = count;

					if (isUnmount.value) return resolve(0);
					if (count >= max) {
						return resolve(1);
					}
					idleId = ric(schedule);
				};
				idleId = ric(schedule);
			});
		};

		const run = async () => {
			if (disabled.value) return;
			const start = Date.now();
			clear();
			currentCount.value = 0;

			if (maxCount.value <= 0) return;
			if (await runByIdleCallback()) {
				const timestamp = Date.now() - start;
				isCompletedOnce.value = true;
				emit('complete', timestamp);
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
			() => disabled.value,
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
				disabled.value ? currentValue.value : currentValue.value.slice(0, currentCount.value),
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
