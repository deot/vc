/** @jsxImportSource vue */

import type { SetupContext } from 'vue';
import { watch, ref, computed } from 'vue';
import { getUid } from '@deot/helper-utils';
import { Icon } from '../icon';

interface Props {
	modelValue: boolean;
	caret: boolean;
}

/**
 * 显隐状态、v-model 同步、close 与触发区内容
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param context.emit ~
 * @param context.expose ~
 * @returns ~
 */
export const useDropdown = (
	props: Props,
	{ slots, emit, expose }: SetupContext<['update:modelValue', 'ready', 'close', 'visible-change', 'click']>
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

	const classes = computed(() => {
		return ['vc-dropdown', { 'is-active': isActive.value }];
	});

	// 触发区：默认插槽，caret 时其后接箭头（与 Select 触发框的箭头一致，展开时由样式翻转）
	const renderTrigger = () => {
		return [
			slots.default?.(),
			props.caret && (<Icon type="down" class="vc-dropdown__icon" />)
		];
	};

	return {
		isActive,
		classes,
		renderTrigger,
		handleChange,
		close
	};
};
