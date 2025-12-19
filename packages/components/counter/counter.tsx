/** @jsxImportSource vue */

import { computed, defineComponent, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { props as counterProps } from './counter-props';
import { separated2value, value2separated } from './utils';
import { Customer } from '../customer';

const COMPONENT_NAME = 'vc-counter';

export const Counter = defineComponent({
	name: COMPONENT_NAME,
	props: counterProps,
	emits: ['begin', 'complete'],
	setup(props, { emit, expose, slots }) {
		const startTime = ref<number | null>(null);
		const duration = ref(props.duration);
		const remaining = ref(duration.value);

		const startVal = ref(0);
		const endVal = ref(separated2value(props.value!, props));
		const frameVal = ref(startVal.value);
		const finalEndVal = ref<number | null>(null);

		const useEasing = ref(!!props.easing);
		const isStart = ref(false);
		const isPaused = ref(false);
		const isComplete = ref(false);
		const countdown = ref(false);

		const rAF = ref<number | null>(null);

		const prints = reactive({
			negative: '',
			integer: '',
			decimal: '',
			separated: '',
			float: '',
			value: ''
		});

		// t: current time, b: beginning value, c: change in value, d: duration
		const easing = computed(() => {
			return typeof props.easing === 'function'
				? props.easing
				: (t: number, b: number, c: number, d: number): number => c * (-Math.pow(2, -10 * t / d) + 1) * 1024 / 1023 + b;
		});

		const displayValue = computed(() => {
			if (
				props.value === ''
				|| (typeof props.value !== 'string' && typeof props.value !== 'number')
			) {
				return props.placeholder;
			}

			return prints.value;
		});

		const binds = computed(() => {
			return {
				...prints,
				value: displayValue.value
			};
		});

		const determineDirectionAndSmartEasing = () => {
			const v = finalEndVal.value !== null ? finalEndVal.value : endVal.value;
			countdown.value = (startVal.value > v);
			const animateAmount = v - startVal.value;
			if (Math.abs(animateAmount) > props.smartEasingThreshold && props.easing) {
				finalEndVal.value = v;
				const up = (countdown.value) ? 1 : -1;
				endVal.value = v + (up * props.smartEasingAmount);
				duration.value = duration.value / 2;
			} else {
				endVal.value = v;
				finalEndVal.value = null;
			}
			if (finalEndVal.value !== null) {
				useEasing.value = false;
			} else {
				useEasing.value = !!props.easing;
			}
		};

		const run = () => {
			const done = (timestamp: number) => {
				if (!startTime.value) { startTime.value = timestamp; }

				const progress = timestamp - startTime.value;
				remaining.value = duration.value - progress;

				if (useEasing.value) {
					if (countdown.value) {
						frameVal.value = startVal.value - easing.value(progress, 0, startVal.value - endVal.value, duration.value);
					} else {
						frameVal.value = easing.value(progress, startVal.value, endVal.value - startVal.value, duration.value);
					}
				} else {
					frameVal.value = startVal.value + (endVal.value - startVal.value) * (progress / duration.value);
				}

				const wentPast = countdown.value ? frameVal.value < endVal.value : frameVal.value > endVal.value;
				frameVal.value = wentPast ? endVal.value : frameVal.value;

				print(frameVal.value);

				if (progress < duration.value) {
					rAF.value = requestAnimationFrame(done);
				} else if (finalEndVal.value !== null) {
					update(finalEndVal.value);
				} else {
					emit('complete');
					isComplete.value = true;
				}
			};

			determineDirectionAndSmartEasing();
			rAF.value = requestAnimationFrame(done);
		};

		const print = (num: number) => {
			Object.assign(prints, value2separated(num, props));
		};

		const resetDuration = () => {
			startTime.value = null;
			duration.value = props.duration;
			remaining.value = duration.value;
		};
		const cancel = () => {
			if (rAF.value === null || typeof rAF.value === 'undefined') return;
			cancelAnimationFrame(rAF.value!);
		};

		const start = () => {
			if (isComplete.value || isStart.value) return;
			cancel();
			resetDuration();
			isPaused.value = false;
			isComplete.value = false;
			startVal.value = 0;
			frameVal.value = 0;

			isStart.value = true;
			emit('begin');

			if (duration.value > 0) {
				run();
			} else {
				print(endVal.value);
			}
		};
		const pause = () => {
			if (isComplete.value) return;
			if (!isPaused.value) {
				cancel();
			}
			isPaused.value = true;
		};

		const resume = () => {
			if (isComplete.value) return;
			if (isPaused.value) {
				startTime.value = null;
				duration.value = remaining.value;
				startVal.value = frameVal.value;
				run();
			}
			isPaused.value = false;
		};

		const update = (newEndVal: string | number) => {
			if (!isStart.value) return;
			cancel();
			startTime.value = null;
			endVal.value = +newEndVal;

			if (endVal.value === frameVal.value) {
				return;
			}

			startVal.value = frameVal.value;
			if (finalEndVal.value === null) {
				resetDuration();
			}
			finalEndVal.value = null;
			run();
		};

		const end = () => {
			if (isComplete.value) return;
			cancel();
			resetDuration();
			startVal.value = +props.value!;
			frameVal.value = startVal.value;
			print(frameVal.value);
			emit('complete');
			isComplete.value = true;
		};

		const restart = () => {
			isStart.value = false;
			isComplete.value = false;
			start();
		};

		watch(
			() => props.value,
			() => {
				if (props.controllable || !isStart.value) return;
				update(props.value!);
			}
		);

		watch(
			() => props.precision,
			() => {
				if (props.controllable || !isStart.value || !isComplete.value) return;
				print(+props.value!);
			}
		);

		expose({
			start,
			pause,
			resume,
			update,
			end,
			restart,
			cancel,
			print
		});

		onMounted(() => !props.controllable && start());
		onBeforeUnmount(cancel);

		const Content = props.tag;
		return () => {
			if (slots.default) {
				return (
					// @ts-ignore
					<Content class="vc-counter">
						{ slots.default(binds.value) }
					</Content>
				);
			}
			if (props.render) {
				return (
					<Customer
						class="vc-counter"
						// @ts-ignore
						render={props.render}
						{...binds.value}
					/>
				);
			}
			return (
				// @ts-ignore
				<Content class="vc-counter">
					{displayValue.value}
				</Content>
			);
		};
	}
});
