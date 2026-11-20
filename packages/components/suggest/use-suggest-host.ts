import { camelize, computed, ref, toHandlerKey, watch } from 'vue';
import type { Ref } from 'vue';
import { pick } from 'lodash-es';
import { useNativeEmitter } from '../input/use-native-emitter';

interface HostOptions {
	props: Record<string, any>;
	// 宿主（Input / Textarea 及移动端）的属性定义：组件声明了同样的属性，原样传给宿主
	hostProps: Record<string, unknown>;
	// 宿主的事件：除 handled 外原样转发
	hostEmits: readonly string[];
	// 由组件自己处理后再发出的宿主事件（update:modelValue、enter 已在这里处理）
	handled: string[];
	emit: (event: any, ...args: any[]) => void;
	expose: (exposed: Record<string, any>) => void;
	// 联想（useSuggest 的返回值）：宿主之后创建，用到时再取
	getSuggest: () => { consumeEnter: () => boolean; close: () => void };
}

/**
 * AutoComplete 与 Mention 共用：把宿主（Input / Textarea）的能力原样交出去
 * 	- 属性：组件声明了宿主的全部属性（有类型），按宿主的属性定义挑出来传给宿主
 * 	- 事件：宿主的事件参数不变地转发；update:modelValue 带原生事件，选中联想项时（commit）为 undefined
 * 	- enter：回车选中联想项时，同一次按键的 keyup 不再发出
 * 	- 方法：暴露宿主的 focus / blur / click（同 useNativeEmitter），另加 close
 * @param options ~
 * @returns host：宿主的 ref；value：宿主的文字；binds / listeners：展开到宿主上；update / commit：输入、选中后更新文字；getElement：宿主内的原生节点
 */
export const useSuggestHost = (options: HostOptions) => {
	const { props, hostProps, hostEmits, handled, emit, expose, getSuggest } = options;
	const host = ref<any>();
	const value = ref(String(props.modelValue ?? ''));
	const keys = Object.keys(hostProps).filter(key => key !== 'modelValue');
	const skipped = new Set(['update:modelValue', 'enter', ...handled]);

	watch(() => props.modelValue, (v) => {
		value.value = String(v ?? '');
	});

	const binds = computed(() => pick(props, keys));

	const listeners = Object.fromEntries(
		hostEmits
			.filter(name => !skipped.has(name))
			.map(name => [toHandlerKey(camelize(name)), (...args: any[]) => emit(name, ...args)])
	);

	// 输入：带原生事件
	const update = (next: string, e?: Event) => {
		value.value = next;
		emit('update:modelValue', next, e);
	};

	// 选中联想项：没有原生事件
	const commit = (next: string) => {
		value.value = next;
		emit('update:modelValue', next, undefined);
		emit('input', next, undefined);
		emit('change', next, undefined);
	};

	const handleEnter = (e: KeyboardEvent) => {
		!getSuggest().consumeEnter() && emit('enter', e);
	};

	expose({
		...useNativeEmitter(host as Ref<HTMLElement | undefined>),
		close: () => getSuggest().close()
	});

	const getElement = <T extends Element>(selector: string) => (host.value?.$el?.querySelector?.(selector) || null) as T | null;

	return {
		host,
		value,
		binds,
		listeners: { ...listeners, onEnter: handleEnter },
		update,
		commit,
		getElement
	};
};
