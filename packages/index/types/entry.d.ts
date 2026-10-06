/**
 * `@deot/vc/full`、`@deot/vc/desktop`、`@deot/vc/mobile` 共用的类型
 * 构建工具仅生成 dist/index.d.ts，子入口的类型需在此手动维护，签名须与 src/index.{full,desktop,mobile}.ts 保持一致
 */
import type { App, Component } from 'vue';
import type { VcOptions } from '@deot/vc-components';

export * from '../dist/index';

export declare const Components: Record<string, Component>;

export declare const createVcPlugin: (
	options?: VcOptions,
	transfromComponentKey?: (name: string) => string
) => {
	install: (app: App) => void;
};
