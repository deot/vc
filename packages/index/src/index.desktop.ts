import type { Component } from 'vue';
import { defineVcPlugin } from '@deot/vc-components';
import { DesktopComponents } from './desktop';

export * from './index';

/**
 * 仅注册桌面端组件
 * 子入口共用 types/entry.d.ts，故统一声明为 Record<string, Component>
 */
export const Components: Record<string, Component> = DesktopComponents;

export const createVcPlugin = defineVcPlugin(Components);
