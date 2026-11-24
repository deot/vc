/**
 * 日期能力的唯一入口：组件都从这里取 dayjs，对外的值仍是 Date | string，Dayjs 对象不出组件
 * 	- 目前用自带的 ./_dayjs（dayjs 的最小子集，不增加依赖）
 * 	- 以后改为依赖 dayjs 时只改这里，并删除 ./_dayjs：
 * 		import dayjs, { type ConfigType } from 'dayjs';
 * 		import customParseFormat from 'dayjs/plugin/customParseFormat';
 * 		dayjs.extend(customParseFormat);
 * 		export { dayjs, type ConfigType };
 */
export { default as dayjs, type ConfigType } from './_dayjs';
