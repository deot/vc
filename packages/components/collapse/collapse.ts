import { h, defineComponent, watch, ref, getCurrentInstance, provide, onMounted, nextTick } from 'vue';
import { props as collapseProps } from './collapse-props';

const COMPONENT_NAME = 'vc-collapse';

export const Collapse = defineComponent({
	name: COMPONENT_NAME,
	props: collapseProps,
	emits: ['update:moodelValue', 'change'],
	setup(props, { slots, emit }) {
		const instance = getCurrentInstance()!;
		const currentValue = ref<any>();
		const items = ref<any[]>([]);

		/**
		 * v-model 同步
		 */
		const sync = () => {
			const v = props.accordion ? currentValue.value[0] : currentValue.value;
			emit('update:moodelValue', v);
			emit('change', v);
		};

		const setActive = () => {
			const activeKey = currentValue.value;

			// onMounted优先与add中nextTick执行
			nextTick(() => {
				items.value.forEach((child, index) => {
					const value = typeof child.props.value !== 'undefined'
						? child.props.value
						: index;
					child.exposed.toggle(activeKey.indexOf(value) > -1);
				});
			});
		};

		const toggle = (item: any) => {
			const activeKey = currentValue.value;
			const index = activeKey.indexOf(item.value);

			if (!item.visible) {
				if (index > -1) {
					activeKey.splice(index, 1);
				}
			} else if (index < 0) {
				activeKey.push(item.value);
			}

			currentValue.value = props.accordion ? activeKey.slice(-1) : activeKey;
			sync();
		};

		// 添加元素
		const add = (item: any, setValue: any) => {
			if (!item) return;
			// vnode动态时排序
			nextTick(() => {
				if (instance.vnode.el) {
					const index = Array
						.from(instance.vnode.el.children)
						.filter(i => /vcm?-collapse-item/.test((i as any).className))
						.indexOf(item.vnode.el);
					if (index != -1) {
						items.value.splice(index, 0, item);
						typeof item.props.value === 'undefined' && (
							setValue(index)
						);
						return;
					}
				}
				items.value.push(item);
				typeof item.props.value === 'undefined' && (
					setValue(items.value.length - 1)
				);
			});
		};

		// 删除元素
		const remove = (item: any, setValue: any) => {
			if (!item) return;
			items.value.splice(items.value.indexOf(item), 1);
			// v-if的影响
			items.value.forEach((_, index) => setValue(index));
		};

		provide('vc-collapse', {
			props,
			toggle,
			add,
			remove
		});

		watch(
			() => props.modelValue,
			(v) => {
				if (v === currentValue.value) return;
				currentValue.value = props.accordion && typeof v !== 'undefined'
					? Array.isArray(v) ? v : [v]
					: Array.isArray(v) ? v : [];
			},
			{ immediate: true }
		);

		watch(
			() => currentValue.value,
			setActive,
			{ deep: true }
		);

		onMounted(setActive);
		return () => {
			return h(
				props.tag,
				{
					class: [{ 'vc-collapse': !props.styleless }]
				},
				slots.default?.()
			);
		};
	}
});
