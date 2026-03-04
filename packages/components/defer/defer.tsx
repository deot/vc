/** @jsxImportSource vue */

import { ref, computed, defineComponent, renderList, renderSlot, watch, onBeforeUnmount } from 'vue';
import { ric, cid } from './ric.ts';

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
		}
	},
	emits: ['complete'],
	setup(props, { slots, emit }) {
		const currentValue = ref<any[]>([]);
		const currentCount = ref(0);
		const isUnmount = ref(false);

		const maxCount = computed(() => props.data.length);

		let idleId: any;

		const clear = () => {
			idleId && cid(idleId);
		};

		const runByIdleCallback = () => {
			return new Promise((resolve) => {
				const schedule = (deadline: IdleDeadline) => {
					while (
						!isUnmount.value
						&& currentCount.value < maxCount.value
						&& (deadline.didTimeout || deadline.timeRemaining() > 0)
					) {
						currentCount.value += props.concurrency;
					}

					if (isUnmount.value) return resolve(0);
					if (currentCount.value >= maxCount.value) {
						return resolve(1);
					}
					idleId = ric(schedule);
				};
				idleId = ric(schedule);
			});
		};

		const run = async () => {
			if (props.disabled) return;
			const start = Date.now();
			clear();
			currentCount.value = 0;

			if (maxCount.value <= 0) return;
			if (await runByIdleCallback()) {
				const timestamp = Date.now() - start;
				console.log('[@deot/vc-defer]:', `${timestamp}ms / ${maxCount.value}`);
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
