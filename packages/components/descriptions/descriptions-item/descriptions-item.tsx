import { defineComponent } from 'vue';
import { props as descriptionsItemProps } from './descriptions-item-props';

const COMPONENT_NAME = 'vc-descriptions-item';

// 只用于声明，由Descriptions读取props与插槽统一渲染
export const DescriptionsItem = defineComponent({
	name: COMPONENT_NAME,
	props: descriptionsItemProps,
	setup() {
		return () => null;
	}
});
