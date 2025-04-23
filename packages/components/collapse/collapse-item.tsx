/** @jsxImportSource vue */

import { defineComponent, ref, inject, computed, getCurrentInstance, onBeforeMount, onBeforeUnmount } from 'vue';
import { props as collapseItemProps } from './collapse-item-props';
import { Expand } from '../expand';

const COMPONENT_NAME = 'vc-collapse-item';

export const CollapseItem = defineComponent({
	name: COMPONENT_NAME,
	props: collapseItemProps,
	setup(props, { slots, expose }) {
		const Content = props.tag;
		const instance = getCurrentInstance();
		const isActive = ref(false);
		const current = ref();

		const collapse = inject('vc-collapse') as any;

		const handleToggle = () => {
			collapse.toggle({
				value: typeof props.value !== 'undefined' ? props.value : current.value,
				visible: !isActive.value
			});
		};

		const alive = computed(() => {
			return collapse.props.alive;
		});

		const styleless = computed(() => {
			return collapse.props.styleless;
		});

		const setValue = (v: number) => current.value = v;

		onBeforeMount(() => {
			collapse.add?.(instance, setValue);
		});

		onBeforeUnmount(() => {
			collapse.remove?.(instance, setValue);
		});

		expose({
			isActive,
			toggle: (v: boolean) => isActive.value = v
		});

		return () => {
			return (
				<Content
					// @ts-ignore
					class={[{ 'vc-collapse-item': !styleless.value }]}
				>
					<div
						class={[{ 'vc-collapse-item__title': !styleless.value }]}
						onClick={handleToggle}
					>
						{ slots.default?.() }
						{
							slots.icon?.({
								visible: isActive.value
							})
						}
					</div>
					<Expand
						modelValue={isActive.value}
						alive={alive.value}
						// @ts-ignore
						onChange={(v: boolean) => isActive.value = v}
					>
						<div class={[{ 'vc-collapse-item__content': !styleless.value }]}>
							{ slots.content?.() }
						</div>
					</Expand>
				</Content>
			);
		};
	}
});
