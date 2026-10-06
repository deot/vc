import type { ExtractPropTypes, PropType } from 'vue';
import { pick, mapValues } from 'lodash-es';
import type { Props as CustomerProps } from '../customer/customer-props';
import { props as tourProps } from './tour-props';

const tourKeys = [
	'contentClass',
	'contentStyle',
	'maskStyle',
	'progressFormatter',
	'previousText',
	'nextText',
	'finishText',
	'skipText',
	'previousButtonOptions',
	'nextButtonOptions',
	'finishButtonOptions',
	'skipButtonOptions'
] as const;

const tourDefaultKeys = [
	'placement',
	'arrow',
	'closable',
	'width',
	'footer',
	'mask',
	'maskClosable',
	'escClosable',
	'stagePadding',
	'stageRadius',
	'disableActiveInteraction',
	'showProgress',
	'progressType',
	'animated',
	'duration',
	'keyboard',
	'scrollIntoViewOptions',
	'advanceOnClick',
	'waitForElement',
	'skipMissingElement',
	'maskClickBehavior'
] as const;

// 步骤未传的参数保留 undefined，才能继承 Tour（包括 Boolean 参数）。
const tourDefaultProps = mapValues(
	pick(tourProps, tourDefaultKeys),
	(value: any) => ({ ...value, default: undefined })
) as Pick<typeof tourProps, typeof tourDefaultKeys[number]>;

export const props = {
	...(pick(tourProps, tourKeys) as Pick<typeof tourProps, typeof tourKeys[number]>),
	...tourDefaultProps,
	element: [String, Object, Function],
	title: [String, Function] as PropType<string | CustomerProps['render']>,
	content: [String, Function] as PropType<string | CustomerProps['render']>
};
export type Props = ExtractPropTypes<typeof props>;
