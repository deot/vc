import type { Component } from 'vue';
import { defineVcPlugin } from '@deot/vc-components';
import { DesktopComponents } from './desktop';
import { MobileComponents } from './mobile';

export * from './index';

/**
 * 全量注册：桌面端 + 移动端
 * 子入口共用 types/entry.d.ts，故统一声明为 Record<string, Component>
 */
export const Components: Record<string, Component> = {
	...DesktopComponents,
	...MobileComponents
};

export const createVcPlugin = defineVcPlugin(Components);
