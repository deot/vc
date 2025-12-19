/** @jsxImportSource vue */

import { defineComponent, computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { preZero } from '@deot/helper-utils';
import { debounce } from 'lodash-es';
import { props as countdownProps } from './countdown-props';
import { getTimestamp, formatter } from './utils';
import { Customer } from '../customer';

const COMPONENT_NAME = 'vc-countdown';

export const Countdown = defineComponent({
	name: COMPONENT_NAME,
	props: countdownProps,
	emits: ['change', 'complete', 'error'],
	setup(props, { emit, slots }) {
		const day = ref('');
		const hour = ref('');
		const minute = ref('');
		const second = ref('');
		const millisecond = ref('');

		const showResult = computed(() => {
			return !props.render && !slots.default;
		});
		// 周期
		const T = computed(() => {
			return props.t;
		});
		// 毫秒被除数
		const msDividend = computed(() => {
			if (props.t < 10) {
				return 1000;
			} else if (props.t < 100) {
				return 100;
			} else {
				return 10;
			}
		});
		// 偏移值
		const serverOffset = computed(() => {
			return props.serverTime
				? (getTimestamp(props.serverTime) - (new Date()).getTime())
				: 0;
		});
		// 目标时间
		const targetTimestamp = computed(() => {
			if (!props.targetTime && getTimestamp(props.targetTime)) {
				emit('error', '请设定时间以及格式');
				return 0;
			}

			return getTimestamp(props.targetTime);
		});

		const result = computed(() => {
			if (!showResult.value) return;
			let v: string;

			v = formatter(props.format, [day.value, hour.value, minute.value, second.value, millisecond.value]);

			// 过滤00*
			if (props.trim) {
				const regex = new RegExp(
					`00(${formatter(props.format, Array.from({ length: 5 }, () => '|'))})?`,
					'g'
				);
				v = v.replace(regex, '');
			}

			return v;
		});

		const binds = computed(() => {
			if (showResult.value) return {};
			return {
				day: day.value,
				hour: hour.value,
				minute: minute.value,
				second: second.value,
				millisecond: millisecond.value,
				format: props.format,
				tag: props.tag,
				trim: props.trim,
			};
		});

		let timer: any;
		const run = () => {
			const currentTime = new Date((new Date()).getTime() + serverOffset.value).getTime();
			const timestamp = targetTimestamp.value - currentTime;

			const _second = 1000;
			const _minute = _second * 60;
			const _hour = _minute * 60;
			const _day = _hour * 24;

			day.value = preZero(Math.floor(timestamp / _day));
			hour.value = preZero(Math.floor((timestamp % _day) / _hour));
			minute.value = preZero(Math.floor((timestamp % _hour) / _minute));
			second.value = preZero(Math.floor((timestamp % _minute) / _second));
			millisecond.value = String(Math.floor(timestamp % 1000 / (1000 / msDividend.value))); // msDividend越小，取的毫秒级的位数应该越大

			if (timestamp <= 0) {
				stop();

				emit('change', {
					timestamp: 0,
					day: '00',
					hour: '00',
					minute: '00',
					second: '00',
					millisecond: '00',
				});

				emit('complete');
			} else {
				emit('change', {
					timestamp,
					day: day.value,
					hour: hour.value,
					minute: minute.value,
					second: second.value,
					millisecond: millisecond.value,
				});
			}
		};

		const start = () => {
			if (targetTimestamp.value) {
				timer && clearInterval(timer);
				timer = setInterval(run, T.value);
			}
		};

		const stop = () => {
			timer && clearInterval(timer);
		};

		const restart = debounce(() => {
			stop();
			start();
		}, 200, { leading: true });

		watch(() => props.targetTime, restart);
		watch(() => props.serverTime, restart);

		onMounted(start);
		onBeforeUnmount(stop);

		const Content = props.tag;
		return () => {
			if (slots.default) {
				return (
					// @ts-ignore
					<Content class="vc-countdown">
						{ slots.default(binds.value) }
					</Content>
				);
			}
			if (props.render) {
				return (
					<Customer
						class="vc-countdown"
						// @ts-ignore
						render={props.render}
						{...binds.value}
					/>
				);
			}
			return (
				// @ts-ignore
				<Content class="vc-countdown" innerHTML={result.value} />
			);
		};
	}
});
