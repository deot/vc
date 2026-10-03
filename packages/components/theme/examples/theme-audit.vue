<template>
	<div class="theme-audit" :class="{ 'is-dark': effectiveMode === 'dark' }" :data-preview-mode="effectiveMode">
		<div class="audit-layout">
			<aside class="audit-panel" aria-label="主题参数编辑器">
				<div class="audit-panel__heading">
					<h2 class="audit-panel__title">主题参数 <small>{{ changedCount }} 项已修改</small></h2>
					<p class="audit-panel__description">{{ PARAMETERS.length }} 个参数 · {{ COMPONENT_COUNT }} 个组件</p>
					<div class="audit-config-actions">
						<div class="audit-config-field">预览主题
							<RadioGroup v-model="mode" type="button" aria-label="预览主题" class="audit-config-radio">
								<RadioButton v-for="option in themeModeOptions" :key="option.value" :label="option.value">
									{{ option.label }}
								</RadioButton>
							</RadioGroup>
						</div>
						<div class="audit-config-field">复制格式
							<RadioGroup v-model="exportFormat" type="button" aria-label="复制格式" class="audit-config-radio">
								<RadioButton v-for="option in exportFormatOptions" :key="option.value" :label="option.value">
									{{ option.label }}
								</RadioButton>
							</RadioGroup>
						</div>
					</div>
					<details class="audit-export">
						<summary class="audit-export-heading">
							<span>查看导出代码</span>
							<span class="audit-config-buttons" @click.stop.prevent>
								<Button size="small" @click="handleResetAll">重置</Button>
								<Clipboard :tag="Button" :value="exportCode" size="small" type="primary">复制</Clipboard>
							</span>
						</summary>
						<textarea :value="exportCode" readonly aria-label="导出代码" class="audit-code" @focus="$event.target.select()" />
					</details>
					<input v-model="parameterSearch" class="audit-native-input" placeholder="搜索参数名称" aria-label="搜索参数">
				</div>
				<Scroller class="audit-panel__scroller" content-class="audit-panel__content">
					<section v-for="group in parameterGroups" :key="group.label" class="audit-parameter-group">
						<h3 class="audit-parameter-group__heading">{{ group.label }} <small>{{ group.parameters.length }}</small></h3>
						<div
							v-for="parameter in group.parameters" :key="parameter.name"
							class="audit-parameter" :class="{ 'is-changed': isChanged(parameter) }" :data-parameter="parameter.name"
						>
							<div class="audit-parameter__heading">
								<span class="audit-parameter__name">{{ parameter.name }}</span>
								<span class="audit-parameter__type">{{ parameter.mode === 'shared' ? '共用' : '亮 / 暗' }}</span>
								<Button class="audit-parameter__reset" size="mini" type="text"
									:aria-label="`恢复 ${parameter.name}`" @click="handleRestoreOne(parameter)">↺</Button>
							</div>
							<div class="audit-parameter__values">
								<div v-for="editorMode in parameterModes(parameter)" :key="editorMode" :data-editor-mode="editorMode">
									<label :for="`audit-${errorKey(parameter, editorMode)}`" class="audit-parameter__mode">
										{{ modeLabel(parameter, editorMode) }}
									</label>
									<div class="audit-parameter__edit">
										<ColorPicker
											v-if="parameter.kind === 'color'" :model-value="pickerValue(value(parameter, editorMode))"
											alpha format="rgb" portal-class="audit-parameter-picker"
											@change="handlePickerCommit(parameter, $event, editorMode)"
											@color-change="handlePreview(parameter, $event, editorMode)"
											@visible-change="!$event && handleCancelPreview(parameter, editorMode)"
										/>
										<Input
											class="audit-parameter__input" :input-id="`audit-${errorKey(parameter, editorMode)}`"
											:model-value="drafts[errorKey(parameter, editorMode)] ?? value(parameter, editorMode)"
											controllable :allow-dispatch="false"
											:aria-invalid="!!errors[errorKey(parameter, editorMode)]"
											:aria-label="`${parameter.name} ${modeLabel(parameter, editorMode)}参数值`"
											@update:model-value="drafts[errorKey(parameter, editorMode)] = $event"
											@blur="handleTextCommit(parameter, editorMode)" @enter="handleTextCommit(parameter, editorMode)"
										/>
									</div>
									<div
										v-if="parameter.kind === 'shadow'" class="audit-shadow-preview"
										:style="{ boxShadow: value(parameter, editorMode) }"
									>阴影预览</div>
									<p v-if="errors[errorKey(parameter, editorMode)]" class="audit-error" role="alert">
										{{ errors[errorKey(parameter, editorMode)] }}
									</p>
								</div>
							</div>
						</div>
					</section>
					<p v-if="!parameterGroups.length">没有匹配的参数。</p>
				</Scroller>
			</aside>
			<main class="audit-gallery">
				<div class="audit-gallery__controls">
					<div class="audit-gallery__filters">
						<input v-model="componentSearch" class="audit-native-input" placeholder="搜索组件，例如 Input / Table" aria-label="搜索组件">
						<Select
							v-model="platform" :data="platformOptions" :clearable="false" aria-label="展示平台"
							class="audit-gallery__platform"
						/>
					</div>
					<nav class="audit-nav" aria-label="组件分类">
						<button v-for="group in GROUPS" :key="group.id" class="audit-nav__item" type="button" @click="handleNavigate(group.id)">
							{{ group.label }} <small>{{ group.names.length }}</small>
						</button>
					</nav>
					<p class="audit-hint">普通、禁用、选中状态并排展示；hover / focus / 按下 / 拖动请真实操作。弹层随当前主题显示。</p>
				</div>
				<article
					v-if="showTheme"
					class="audit-card audit-theme-mapping" data-component="Theme"
				>
					<header class="audit-card__heading"><h3>Theme</h3><span class="audit-card__meta">配置 · 主题映射</span></header>
					<GallerySamples name="Theme" :platform="platform" />
				</article>
				<section v-for="group in visibleGroups" :id="`audit-group-${group.id}`" :key="group.id" class="audit-group">
					<h2 class="audit-group__heading"><span>{{ group.label }}</span><small>{{ group.names.length }} 个展示项</small></h2>
					<AuditGrid>
						<article
							v-for="name in group.names" :id="`audit-component-${name}`" :key="name" class="audit-card"
							:class="{ 'is-wide': ['Button', 'Table', 'Calendar', 'Editor'].includes(name) }" :data-component="name"
						>
							<header class="audit-card__heading">
								<h3>{{ name }}</h3><span class="audit-card__meta">{{ MOBILE_COMPONENTS.has(name) ? '含移动端' : '通用' }}</span>
							</header>
							<GallerySamples :name="name" :platform="platform" />
						</article>
					</AuditGrid>
				</section>
				<p v-if="!visibleGroups.length && !showTheme" class="audit-empty">没有匹配的组件。</p>
			</main>
		</div>
	</div>
</template>

<script setup>
import { computed, provide, reactive, ref } from 'vue';
import { ColorPicker, Input, Button, Select, RadioGroup, RadioButton, Clipboard, Scroller } from '@deot/vc';
import { COMPONENT_COUNT, GROUPS, MOBILE_COMPONENTS, MOBILE_ONLY } from './theme-audit/catalogue';
import GallerySamples from './theme-audit/gallery.vue';
import AuditGrid from './theme-audit/audit-grid.vue';
import { exportCss, exportScss } from './theme-audit/model';
import { PARAMETERS, useAuditTheme } from './theme-audit/use-audit-theme';

const {
	mode, effectiveMode, changes, liveChanges, errors, errorKey, changedCount, isChanged, value,
	handleCommit, handlePreview, handleCancelPreview, handleRestore, handleReset
} = useAuditTheme();
provide('theme-audit', { effectiveMode, liveChanges });
const drafts = reactive({});
const parameterSearch = ref('');
const componentSearch = ref('');
const parameterQuery = computed(() => parameterSearch.value.trim().toLowerCase());
const componentQuery = computed(() => componentSearch.value.trim().toLowerCase());
const showTheme = computed(() => 'theme'.includes(componentQuery.value));
const platform = ref('all');
const exportFormat = ref('scss');
const themeModeOptions = [
	{ value: 'light', label: '亮色' }, { value: 'dark', label: '暗色' }, { value: 'system', label: '跟随系统' }
];
const exportFormatOptions = [{ value: 'scss', label: 'SCSS' }, { value: 'css', label: 'CSS' }];
const platformOptions = [
	{ value: 'all', label: '桌面 + 移动端' }, { value: 'desktop', label: '桌面端' }, { value: 'mobile', label: '移动端与通用组件' }
];
const exportCode = computed(() => exportFormat.value === 'scss' ? exportScss(PARAMETERS, changes) : exportCss(PARAMETERS, changes));
const visibleGroups = computed(() => GROUPS.map(group => ({
	...group,
	names: group.names.filter(name => (
		name.toLowerCase().includes(componentQuery.value)
		&& !(platform.value === 'desktop' && MOBILE_ONLY.has(name))
	))
})).filter(group => group.names.length));
const parameterGroups = computed(() => [
	['颜色 · color-*', 'color-'], ['背景 · background-color-*', 'background-color'],
	['边框 · border-color-*', 'border-color'], ['文字 · foreground-color-*', 'foreground-color'],
	['阴影 · box-shadow-*', 'box-shadow'], ['尺寸与属性', 'dimensions']
].map(([label, prefix]) => ({
	label,
	parameters: PARAMETERS.filter(parameter => (prefix === 'dimensions' ? parameter.kind === 'dimension' : parameter.name.startsWith(prefix))
		&& parameter.name.toLowerCase().includes(parameterQuery.value))
})).filter(group => group.parameters.length));
const modeLabel = (parameter, editorMode) => parameter.mode === 'shared' ? '共用' : editorMode === 'light' ? '亮色' : '暗色';
const parameterModes = parameter => parameter.mode === 'shared' ? ['light'] : ['light', 'dark'];
const handleTextCommit = (parameter, editorMode) => {
	const key = errorKey(parameter, editorMode);
	if (drafts[key] === undefined) return;
	if (handleCommit(parameter, drafts[key], editorMode)) delete drafts[key];
};
const handlePickerCommit = (parameter, newValue, editorMode) => {
	if (handleCommit(parameter, newValue, editorMode)) delete drafts[errorKey(parameter, editorMode)];
};
const handleRestoreOne = (parameter) => {
	handleRestore(parameter);
	parameterModes(parameter).forEach(editorMode => delete drafts[errorKey(parameter, editorMode)]);
};
const handleResetAll = () => {
	handleReset();
	Object.keys(drafts).forEach(name => delete drafts[name]);
};
const handleNavigate = id => document.getElementById(`audit-group-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
// 颜色文本可以用具名色或现代 rgb()；取色器统一接收浏览器规范化后的 hex/rgba。
let colorContext;
const pickerValue = (color) => {
	if (typeof document === 'undefined') return color;
	colorContext ??= document.createElement('canvas').getContext('2d');
	if (!colorContext) return color;
	colorContext.fillStyle = '#000';
	colorContext.fillStyle = color;
	return colorContext.fillStyle;
};
</script>

<style lang="scss">
@use './theme-audit/style';
</style>
