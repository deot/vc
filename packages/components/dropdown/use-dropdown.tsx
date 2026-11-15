import type { SetupContext } from 'vue';
import { watch, ref } from 'vue';
import { getUid } from '@deot/helper-utils';
import type { Props } from './dropdown-props';

/**
 * Dropdown 与 MDropdown 共用：显隐状态、v-model 同步与 close
 * @param props ~
 * @param context ~
 * @param context.emit ~
 * @param context.expose ~
 * @returns ~
 */
export const useDropdown = (
	props: Props,
	{ emit, expose }: SetupContext<['update:modelValue', 'ready', 'close', 'visible-change', 'click']>
) => {
	const isActive = ref(false);
	const dropdownId = ref(getUid('dropdown'));

	watch(
		() => props.modelValue,
		(v) => {
			isActive.value = v;
		},
		{ immediate: true }
	);

	/**
	 * v-model 同步, 外部的数据改变时不会触发
	 */
	const sync = () => {
		emit('update:modelValue', isActive.value);
		emit('visible-change', isActive.value);
	};

	const handleChange = (v: boolean) => {
		isActive.value = v;
		sync();
	};

	const close = () => {
		isActive.value = false;
		sync();
	};

	expose({
		close,
		dropdownId
	});

	return {
		isActive,
		handleChange,
		close
	};
};
