import { defineComponent } from 'vue';
import { props as dropdownItemProps } from './dropdown-item-props';
import { useDropdownItem } from './use-dropdown-item';

const COMPONENT_NAME = 'vc-dropdown-item';

export const DropdownItem = defineComponent({
	name: COMPONENT_NAME,
	emits: ['click'],
	props: dropdownItemProps,
	setup(props, context) {
		return useDropdownItem(props, context);
	}
});
