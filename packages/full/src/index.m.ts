import type { Component } from 'vue';
import { defineVcPlugin } from '@deot/vc-components';
import { MobileComponents } from './mobile';

export * from '@deot/vc-shared';
export * from '@deot/vc-hooks';
export * from '@deot/vc-components';
export * from '@deot/vc-locale';

/**
 * 仅注册移动端组件
 */
export const Components: Record<string, Component> = MobileComponents;

export const createVcPlugin = defineVcPlugin(Components);
