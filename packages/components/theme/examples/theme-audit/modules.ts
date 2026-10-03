/// <reference types="vite/client" />
import type { Component } from 'vue';
import { GROUPS } from './catalogue';
import type { AuditComponentName } from './catalogue';

const files = import.meta.glob<{ default: Component }>('./modules/*.vue', { eager: true });
const filename = (name: string) => name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
export const MODULES = Object.fromEntries([...GROUPS.flatMap(group => [...group.names]), 'Theme'].map(name => [
	name, files[`./modules/${filename(name)}.vue`].default
])) as Record<AuditComponentName, Component>;
