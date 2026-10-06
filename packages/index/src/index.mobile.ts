import type { Component } from 'vue';
import { defineVcPlugin } from '@deot/vc-components';
import { MobileComponents } from './mobile';

export * from './index';

/**
 * 仅注册移动端组件
 * 子入口共用 types/entry.d.ts，故统一声明为 Record<string, Component>
 */
export const Components: Record<string, Component> = MobileComponents;

export const createVcPlugin = defineVcPlugin(Components);
