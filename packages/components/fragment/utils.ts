import { Fragment } from 'vue';
import type { Component, VNode } from 'vue';

/**
 * 展开v-for、<template>产生的Fragment，只保留指定类型的组件
 * @param vnodes ~
 * @param types 要保留的组件
 * @param result ~
 * @returns ~
 */
export const getChildren = (vnodes: VNode[] = [], types: Component[], result: VNode[] = []) => {
	vnodes.forEach((vnode) => {
		if (vnode.type === Fragment && Array.isArray(vnode.children)) {
			getChildren(vnode.children as VNode[], types, result);
		} else if (types.includes(vnode.type as Component)) {
			result.push(vnode);
		}
	});
	return result;
};
