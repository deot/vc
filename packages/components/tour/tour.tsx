/** @jsxImportSource vue */

import {
	defineComponent,
	shallowRef,
	ref,
	provide,
	watch,
	onMounted,
	onUpdated,
	onBeforeUnmount,
	getCurrentInstance,
	camelize,
	toHandlerKey
} from 'vue';
import { omit } from 'lodash-es';
import type { PortalLeaf } from '../portal/portal-leaf';
import { props as tourProps, emits as tourEmits } from './tour-props';
import { TourPortal } from './tour-view';
import type { useTour } from './use-tour';
import type { TourProvide, TourStepDeclaration } from './types';

const COMPONENT_NAME = 'vc-tour';

// 转发到弹层实例的方法
type Method = keyof ReturnType<typeof useTour>['api'] | 'close';

export const Tour = defineComponent({
	name: COMPONENT_NAME,
	inheritAttrs: false,
	props: tourProps,
	emits: [...tourEmits],
	setup(props, { slots, emit, expose, attrs }) {
		const instance = getCurrentInstance()!;
		const declarations = shallowRef<TourStepDeclaration[]>([]);
		const isActive = ref(false);
		let tourInstance: PortalLeaf | undefined;

		const orderDeclarations = () => {
			const ordered = [...declarations.value].sort((first, second) => {
				const a = first.getNode?.();
				const b = second.getNode?.();
				if (!a || !b || a === b) return 0;
				return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
			});
			if (ordered.some((step, index) => step !== declarations.value[index])) declarations.value = ordered;
		};
		provide<TourProvide>('vc-tour', {
			add: (step) => {
				declarations.value = [...declarations.value, step];
			},
			remove: (step) => {
				declarations.value = declarations.value.filter(item => item !== step);
			}
		});

		// 转发弹层事件；visible-change 同时记录弹层是否实际显示
		const listeners = {
			...Object.fromEntries(tourEmits.map(name => [toHandlerKey(camelize(name)), (...args: any[]) => emit(name, ...args)])),
			onVisibleChange: (value: boolean) => {
				isActive.value = value;
				emit('visible-change', value);
			}
		};
		const getOptions = () => {
			return {
				...omit(props, ['modelValue']),
				...listeners,
				steps: declarations.value.length
					? declarations.value.map(step => ({ ...step.options, slots: step.slots, onClose: step.onClose }))
					: props.steps,
				wrapperClass: [props.wrapperClass, attrs.class]
			};
		};
		const open = () => {
			if (tourInstance) return;
			tourInstance = TourPortal.popup({
				...getOptions(),
				element: props.getPopupContainer?.() || 'body',
				slots,
				parent: instance.parent!,
				onDestroyed: () => {
					tourInstance = undefined;
					isActive.value = false;
				}
			});
		};
		const update = () => {
			if (tourInstance?.propsData) tourInstance.propsData.value = getOptions();
		};

		watch(
			() => props.modelValue,
			async (value) => {
				if (value) open();
				else if (!isActive.value) tourInstance?.destroy();
				else {
					const currentInstance = tourInstance;
					if (!await currentInstance?.wrapper?.close('model') && tourInstance === currentInstance) {
						emit('update:modelValue', true);
					}
				}
			},
			{ flush: 'post' }
		);

		// 深度监听捕获 steps 原地修改和 TourStep 参数变化；插槽、attrs 变化会重新渲染，在 onUpdated 中同步
		watch(
			[() => props, () => declarations.value],
			update,
			{ deep: true, flush: 'post' }
		);

		onMounted(() => {
			orderDeclarations();
			props.modelValue && open();
		});
		onUpdated(() => {
			orderDeclarations();
			update();
		});
		onBeforeUnmount(() => tourInstance?.destroy());

		// 未打开时调用实例方法返回 false
		const call = (name: Method, ...args: any[]): Promise<boolean> => tourInstance?.wrapper?.[name](...args) ?? Promise.resolve(false);
		expose({
			next: () => call('next'),
			previous: () => call('previous'),
			goTo: (index: number) => call('goTo', index),
			finish: () => call('finish'),
			skip: () => call('skip'),
			close: () => call('close'),
			refresh: async () => { await tourInstance?.wrapper?.refresh(); }
		});
		return () => <div style="display: none">{slots?.default?.()}</div>;
	}
});
