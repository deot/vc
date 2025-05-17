/** @jsxImportSource vue */

import { defineComponent, ref, computed, watch } from 'vue';
import { Icon } from '../icon/index';
import { props as tagProps } from './tag-props';

const COMPONENT_NAME = 'vc-tag';

export const Tag = defineComponent({
	name: COMPONENT_NAME,
	props: tagProps,
	emits: ['close', 'change'],
	setup(props, { emit, slots }) {
		const isChecked = ref(true);
		const classes = computed(() => {
			return {
				[`is-${props.color}`]: true,
				[`is-${props.type}`]: true,
				[`is-unchecked`]: !isChecked.value
			};
		});

		const handleClose = (e) => {
			emit('close', e, props.value || undefined);
		};

		const handleCheck = () => {
			if (!props.checkable) return;

			isChecked.value = !isChecked.value;

			emit('change', isChecked.value, props.value || undefined);
		};

		watch(
			() => props.checked,
			(v) => {
				isChecked.value = !!v;
			},
			{ immediate: true }
		);
		return () => {
			return (
				<div
					class={[classes.value, 'vc-tag']}
					// @ts-ignore
					onClickStop={handleCheck}
				>
					<div class="vc-tag__wrapper">
						{
							props.type === 'dot' && (
								<div>
									<span class="vc-tag__dot" />
								</div>
							)
						}
						<span>
							{ slots.default?.() }
						</span>
						{
							props.closable && (
								<Icon
									type="close"
									class="vc-tag__close"
									// @ts-ignore
									onClick={handleClose}
								/>
							)
						}
					</div>
				</div>
			);
		};
	}
});
