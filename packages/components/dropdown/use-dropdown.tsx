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
 * Dropdown 与 MDropdown 共用：显隐状态、v-model 同步、close 与触发区内容
 * @param props ~
 * @param context ~
 * @param context.slots ~
 * @param context.emit ~
 * @param context.expose ~
 * @param options ~
 * @param options.mobile 移动端（MDropdown）：根节点加标记类 vcm-dropdown，caret 为实心三角，尺寸由 mobile/style.scss 覆盖局部变量
 * @returns ~
 */
export const useDropdown = (
	props: Props,
	{ slots, emit, expose }: SetupContext<['update:modelValue', 'ready', 'close', 'visible-change', 'click']>,
	options: { mobile?: boolean } = {}
) => {
	const name = options.mobile ? 'vc-dropdown vcm-dropdown' : 'vc-dropdown';
	// caret 的图标：桌面端与 Select 触发框的箭头一致；移动端为实心三角（向上的三角由样式转成向下）
	const caretIcon = options.mobile ? 'triangle-up' : 'down';
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
		return [name, { 'is-active': isActive.value }];
	});

	// 触发区：默认插槽，caret 时其后接箭头（展开时由样式翻转）
	const renderTrigger = () => {
		return [
			slots.default?.(),
			props.caret && (<Icon type={caretIcon} class="vc-dropdown__icon" />)
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
