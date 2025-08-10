import type { ExtractPropTypes } from 'vue';
import { pick } from 'lodash-es';
import { props as selectProps } from '../select/select-props';
import { props as treeProps } from './tree-props';

const treeKeys = [
	'checkStrictly',
	'data',
	'max'
] as const;

export const props = {
	...selectProps,
	...(pick(treeProps, treeKeys) as Pick<typeof treeProps, typeof treeKeys[number]>),
};
export type Props = ExtractPropTypes<typeof props>;
