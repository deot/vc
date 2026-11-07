/** @jsxImportSource vue */

import { defineComponent, provide } from 'vue';
import { MCustomer } from '../../customer/index.m';
import { hasCustomerValue } from '../../customer/utils';
import { props as listProps } from './list-props';

const COMPONENT_NAME = 'vcm-list';

export const MList = defineComponent({
	name: COMPONENT_NAME,
	props: listProps,
	setup(props, { slots }) {
		provide('vc-list', { props });
		return () => {
			const Tag = props.tag as any;
			const header = slots.header || props.header;
			const footer = slots.footer || props.footer;
			return (
				<Tag class={['vcm-list', { 'is-border': props.border }]}>
					{hasCustomerValue(header) && <MCustomer wrap class="vcm-list__header" render={header} />}
					<div class="vcm-list__body">{slots.default?.()}</div>
					{hasCustomerValue(footer) && <MCustomer wrap class="vcm-list__footer" render={footer} />}
				</Tag>
			);
		};
	}
});
