/** @jsxImportSource vue */

import { defineComponent } from 'vue';
import { props as calendarProps } from '../calendar-props';
import { MButton } from '../../button/index.m';
import { MScroller } from '../../scroller/index.m';
import { useCalendar } from '../use-calendar';

const COMPONENT_NAME = 'vcm-calendar';

// 与 Calendar 结构相同：尺寸由 vcm-calendar 上的局部变量换成 750 稿，左右滑动翻页
export const MCalendar = defineComponent({
	name: COMPONENT_NAME,
	props: calendarProps,
	emits: ['update:modelValue', 'update:panelDate', 'update:mode', 'change', 'date-click'],
	setup(props, context) {
		return useCalendar(props, context, { mobile: true, Button: MButton, Scroller: MScroller });
	}
});
