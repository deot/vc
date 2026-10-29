export type GridBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/**
 * 固定值，或按容器宽度取值的响应式对象：{ xs, sm, md, lg, xl, xxl }
 */
export type GridResponsive<T> = T | Partial<Record<GridBreakpoint, T>>;

export type GridColumns = number | string | Array<number | string>;

export type GridGap = number | [number, number];

export type GridSpan = number | 'auto';

export type GridJustify = 'start' | 'center' | 'end' | 'stretch';

export type GridAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

export type GridJustifyContent = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';

export type GridSpanResult = [number, number] | { rowspan?: number; colspan?: number } | undefined | void;
