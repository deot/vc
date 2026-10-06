import type { Component } from 'vue';
import { defineVcPlugin } from '@deot/vc-components';
import { DesktopComponents } from './desktop';

export * from '@deot/vc-shared';
export * from '@deot/vc-hooks';
export * from '@deot/vc-components';
export * from '@deot/vc-locale';

/**
 * 仅注册桌面端组件
 */
export const Components: Record<string, Component> = DesktopComponents;

export const createVcPlugin = defineVcPlugin(Components);
