/** @jsxImportSource vue */

import type { SetupContext } from 'vue';
import { computed } from 'vue';
import { getInstance } from '@deot/vc-hooks';
import type { Props } from './dropdown-item-props';
import { Icon } from '../icon';

/**
 * DropdownItem 与 MDropdownItem 共用
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param context.emit ~
 * @param options ~
 * @param options.mobile 移动端（MDropdownItem）：根节点加标记类 vcm-dropdown-item，选中时右侧显示对勾
 * @returns render
 */
export const useDropdownItem = (
	props: Props,
	{ slots, emit }: SetupContext<['click']>,
	options: { mobile?: boolean } = {}
) => {
	const name = options.mobile ? 'vc-dropdown-item vcm-dropdown-item' : 'vc-dropdown-item';
	const owner = getInstance('dropdown', 'dropdownId')!;

	const currentValue = computed(() => {
		const v = typeof props.value === 'undefined'
			? props.label
			: props.value;

		return v;
	});

	const classes = computed(() => {
		return {
			'is-selected': props.selected,
			'is-divided': props.divided,
			'is-disabled': props.disabled
		};
	});

	const handleClick = (e: any) => {
		if (props.disabled) return;

		emit('click', currentValue.value, e);
		owner.emit('click', currentValue.value, e);

		props.closable && owner.exposed?.close();
	};

	return () => {
		return (
			<li
				class={[classes.value, name]}
				onClick={handleClick}
			>
				{ slots.default ? slots.default?.() : props.label }
				{ options.mobile && props.selected && (<Icon type="correct" class="vc-dropdown-item__icon" />) }
			</li>
		);
	};
};
