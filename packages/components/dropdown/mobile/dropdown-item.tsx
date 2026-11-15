import { defineComponent } from 'vue';
import { props as dropdownItemProps } from '../dropdown-item-props';
import { useDropdownItem } from '../use-dropdown-item';

const COMPONENT_NAME = 'vcm-dropdown-item';

/**
 * 移动端菜单项：整行，尺寸随 --vc-rem 缩放（750 稿），选中时右侧显示对勾；属性、事件、插槽与 DropdownItem 相同
 */
export const MDropdownItem = defineComponent({
	name: COMPONENT_NAME,
	emits: ['click'],
	props: dropdownItemProps,
	setup(props, context) {
		return useDropdownItem(props, context, { mobile: true });
	}
});
