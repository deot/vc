import { defineComponent } from 'vue';
import { props as descriptionsGroupProps } from './descriptions-group-props';

const COMPONENT_NAME = 'vc-descriptions-group';

// 只用于声明，由Descriptions读取props与插槽统一渲染
export const DescriptionsGroup = defineComponent({
	name: COMPONENT_NAME,
	props: descriptionsGroupProps,
	setup() {
		return () => null;
	}
});
