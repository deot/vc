// @file 含该组件内所有类型定义
import type { TreeValue } from '../select/utils';

export interface CellChangeOptions {
	[key: string]: any;
	value: TreeValue;
	rowIndex: number;
	columnIndex: number;
	sync?: boolean;
}
