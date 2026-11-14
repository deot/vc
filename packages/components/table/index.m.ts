import { MTable } from './mobile/table.tsx';
import { TableColumn } from './table-column';
import './style.scss';
import './mobile/style.scss';

// 列只收集配置，两端共用
export const MTableColumn = TableColumn;
export {
	MTable
};
