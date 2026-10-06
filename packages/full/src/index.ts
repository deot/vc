import type { Component } from 'vue';
import { defineVcPlugin } from '@deot/vc-components';
import { DesktopComponents } from './desktop';
import { MobileComponents } from './mobile';

export * from '@deot/vc-shared';
export * from '@deot/vc-hooks';
export * from '@deot/vc-components';
export * from '@deot/vc-locale';

/**
 * 全量注册：桌面端 + 移动端
 * 三个入口共用同一份 index.d.ts，故统一声明为 Record<string, Component>
 */
export const Components: Record<string, Component> = {
	...DesktopComponents,
	...MobileComponents
};

export const createVcPlugin = defineVcPlugin(Components);
