/** @jsxImportSource vue */

import { defineComponent, shallowRef, getCurrentInstance, onMounted, onUnmounted, watch } from 'vue';
import { debounce } from 'lodash-es';
import { Resize } from '@deot/helper-resize';
import { EVENTS } from './constants';
import { props as chartProps } from './chart-props';

const COMPONENT_NAME = 'vc-chart';

export const Chart = defineComponent({
	name: COMPONENT_NAME,
	props: chartProps,
	emits: [
		...EVENTS,
		'ready'
	],
	setup(props, { emit, slots, expose }) {
		const instance = getCurrentInstance()!;

		const chart = shallowRef<any>(null);
		const echartsInstance = shallowRef<any>(null);
		const manualOptions = shallowRef<any>(null);

		let resizeHandler: any;
		let lastArea = 0;

		const getArea = () => {
			const el = instance.vnode.el!;
			return el.offsetWidth * el.offsetHeight;
		};

		const mergeOptions = (options: any, notMerge: any, lazyUpdate?: any) => {
			if (props.manualUpdate) {
				manualOptions.value = options;
			}

			if (!chart.value) return;
			chart.value.setOption(options, notMerge, lazyUpdate);
		};

		const handleResize = () => {
			if (lastArea === 0) {
				// emulate initial render for initially hidden charts
				mergeOptions({}, true);
				chart.value.resize();
				mergeOptions(props.options || manualOptions.value || {}, true);
			} else {
				chart.value.resize();
			}
			lastArea = getArea();
		};

		const init = () => {
			if (chart.value || !echartsInstance.value) {
				return;
			}

			chart.value = echartsInstance.value.init(instance.vnode.el, props.theme, props.pluginOptions);
			if (props.group) {
				chart.value.group = props.group;
			}

			chart.value.setOption(manualOptions.value || props.options || {}, true);

			// expose ECharts events as custom events
			EVENTS.forEach((event) => {
				chart.value.on(event, (params) => {
					emit(event, params);
				});
			});

			if (props.resize !== false) {
				lastArea = getArea();
				resizeHandler && Resize.off(instance.vnode.el as any, resizeHandler);
				resizeHandler = props.resize === 0 || props.resize === true ? handleResize : debounce(handleResize, props.resize, { leading: true });

				Resize.on(instance.vnode.el as any, resizeHandler);
			}
		};

		const destroy = () => {
			if (!chart.value) return;

			if (props.resize !== false) {
				resizeHandler && Resize.off(instance.vnode.el as any, resizeHandler);
				resizeHandler = null;
			}
			chart.value.dispose();
			chart.value = null;
		};

		const refresh = () => {
			if (!chart.value) return;

			destroy();
			init();
		};

		watch(
			() => props.group,
			(v) => {
				chart.value && (chart.value.group = v);
			}
		);

		if (!props.manualUpdate) {
			watch(
				() => props.options,
				(val, oldVal) => {
					if (!chart.value && val) {
						init();
					} else {
						chart.value.setOption(val, val !== oldVal);
					}
				},
				{ deep: !props.watchShallow }
			);
		}

		const watched = ['theme', 'pluginOptions', 'resize', 'manualUpdate', 'watchShallow'];
		watched.forEach(prop => watch(() => props[prop], refresh, { deep: true }));

		onMounted(async () => {
			const echarts = (window as any).echarts || await import('echarts');
			// 兼容webpack 3.0/4.0 写法
			echartsInstance.value = echarts.default ? echarts.default : echarts;

			props.options && init();

			emit('ready', {
				instance: chart.value,
				dependencies: {
					echarts: echartsInstance.value
				}
			});
		});

		expose({
			chart,
			refresh
		});

		onUnmounted(destroy);
		return () => {
			return (
				<div class="vc-chart" style="width: 100%; height: 100%">
					{ slots?.default?.() }
				</div>
			);
		};
	}
});
