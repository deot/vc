import {
	computed, onBeforeUnmount, onMounted, reactive, ref, watch
} from 'vue';
import parameterExports from './parameters.module.scss';
import {
	createChanges, exportCss, parameterValue, readParameters, readSaved,
	restoreParameter, setParameter, STORAGE_KEY, validValue
} from './model';
import type { AuditMode, ThemeParameter } from './model';

export const PARAMETERS = readParameters(parameterExports);

export const useAuditTheme = () => {
	const mode = ref<AuditMode>('light');
	const changes = reactive(createChanges());
	const previews = reactive(createChanges());
	const errors = reactive<Record<string, string>>({});
	const isSystemDark = ref(false);
	const storageMessage = ref('配置自动保存在本地，不写入源码');
	const effectiveMode = computed(() => mode.value === 'system' ? (isSystemDark.value ? 'dark' : 'light') : mode.value);
	const isChanged = (parameter: ThemeParameter) => Object.values(changes).some(bucket => parameter.name in bucket);
	const changedCount = computed(() => PARAMETERS.filter(isChanged).length);
	const liveChanges = computed(() => ({
		shared: {
			...changes.shared,
			...previews.shared
		},
		light: {
			...changes.light,
			...previews.light
		},
		dark: {
			...changes.dark,
			...previews.dark
		}
	}));
	let style: HTMLStyleElement | undefined;
	let observer: MutationObserver | undefined;
	let media: MediaQueryList | undefined;
	let originalMode: string | null = null;
	let hadClass = false;
	let debugButton: HTMLElement | undefined;
	let debugControls: { element: HTMLElement; hidden: HTMLElement['hidden'] }[] = [];
	let originalDebugLabel = '';
	const updateSystem = () => { isSystemDark.value = !!media?.matches; };
	const clearPreviews = () => {
		for (const bucket of ['shared', 'light', 'dark'] as const) {
			for (const name of Object.keys(previews[bucket])) delete previews[bucket][name];
		}
	};
	const errorKey = (parameter: ThemeParameter, editorMode = effectiveMode.value) => parameter.mode === 'shared'
		? parameter.name
		: `${parameter.name}-${editorMode}`;
	const cancelPreview = (parameter: ThemeParameter, editorMode = effectiveMode.value) => {
		delete previews[parameter.mode === 'shared' ? 'shared' : editorMode][parameter.name];
	};
	const handleCommit = (parameter: ThemeParameter, value: string, editorMode = effectiveMode.value) => {
		if (!validValue(parameter,
			value)) {
			errors[errorKey(parameter, editorMode)] = '请输入有效的具体 CSS 值';
			return false;
		}
		delete errors[errorKey(parameter, editorMode)];
		cancelPreview(parameter, editorMode);
		setParameter(parameter,
			changes,
			editorMode,
			value);
		return true;
	};
	const handlePreview = (parameter: ThemeParameter, value: string, editorMode = effectiveMode.value) => {
		if (validValue(parameter,
			value)) {
			const bucket = parameter.mode === 'shared' ? 'shared' : editorMode;
			previews[bucket][parameter.name] = value;
		}
	};
	const handleRestore = (parameter: ThemeParameter) => {
		restoreParameter(parameter,
			changes);
		restoreParameter(parameter,
			previews);
		delete errors[parameter.name];
		delete errors[errorKey(parameter, 'light')];
		delete errors[errorKey(parameter, 'dark')];
	};
	const handleReset = () => {
		for (const parameter of PARAMETERS) handleRestore(parameter);
	};
	const save = () => {
		try {
			localStorage.setItem(STORAGE_KEY,
				JSON.stringify({
					mode: mode.value,
					changes
				}));
		} catch {
			storageMessage.value = '本地存储不可用：仍可调试和复制，刷新后不保留';
		}
	};
	onMounted(() => {
		originalMode = document.body.getAttribute('data-vc-theme');
		hadClass = document.body.classList.contains('vc-theme-audit-page');
		debugButton = Array.from(document.body.children).find(element => (
			element.tagName === 'BUTTON' && element.textContent?.startsWith('theme:')
		)) as HTMLElement | undefined;
		originalDebugLabel = debugButton?.textContent ?? '';
		debugControls = Array.from(document.body.children).filter(element => (
			element.tagName === 'BUTTON' && /^(theme|vars):/.test(element.textContent ?? '')
		)).map(element => ({ element: element as HTMLElement, hidden: (element as HTMLElement).hidden }));
		debugControls.forEach(({ element }) => { element.hidden = true; });
		try {
			const saved = readSaved(localStorage.getItem(STORAGE_KEY),
				PARAMETERS,
				CSS.supports.bind(CSS));
			Object.assign(changes,
				saved.changes);
			mode.value = saved.mode;
		} catch {
			storageMessage.value = '本地存储不可用：仍可调试和复制，刷新后不保留';
		}
		media = matchMedia('(prefers-color-scheme: dark)');
		updateSystem();
		media.addEventListener('change',
			updateSystem);
		document.body.classList.add('vc-theme-audit-page');
		style = document.createElement('style');
		style.dataset.themeAudit = 'variables';
		document.head.appendChild(style);
		watch(liveChanges,
			(value) => {
				style!.textContent = exportCss(PARAMETERS,
					value,
					'body.vc-theme-audit-page');
			},
			{
				deep: true,
				immediate: true
			});
		watch(mode,
			(value) => {
				clearPreviews();
				if (value === 'system') document.body.removeAttribute('data-vc-theme');
				else document.body.setAttribute('data-vc-theme',
					value);
				if (debugButton) debugButton.textContent = `theme: ${value}`;
			},
			{ immediate: true });
		observer = new MutationObserver(() => {
			const value = document.body.getAttribute('data-vc-theme');
			mode.value = value === 'light' || value === 'dark' ? value : 'system';
		});
		observer.observe(document.body,
			{
				attributes: true,
				attributeFilter: ['data-vc-theme']
			});
		watch([mode, changes],
			save,
			{ deep: true });
	});
	onBeforeUnmount(() => {
		observer?.disconnect();
		media?.removeEventListener('change',
			updateSystem);
		style?.remove();
		if (!hadClass) document.body.classList.remove('vc-theme-audit-page');
		if (originalMode === null) document.body.removeAttribute('data-vc-theme');
		else document.body.setAttribute('data-vc-theme',
			originalMode);
		if (debugButton) debugButton.textContent = originalDebugLabel;
		debugControls.forEach(({ element, hidden }) => { element.hidden = hidden; });
	});
	return {
		liveChanges,
		errorKey,
		mode,
		effectiveMode,
		changes,
		errors,
		changedCount,
		isChanged,
		storageMessage,
		handleCommit,
		handlePreview,
		handleRestore,
		handleReset,
		handleCancelPreview: cancelPreview,
		value: (parameter: ThemeParameter, editorMode = effectiveMode.value) => parameterValue(parameter,
			changes,
			editorMode)
	};
};
