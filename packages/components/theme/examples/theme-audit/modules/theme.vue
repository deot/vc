<template>
	<div class="audit-stack">
		<Theme tag="div" color="vc-foreground-color"
			background-color="vc-background-color-light" border-color="vc-border-color"
			class="audit-theme__surface is-bordered">
			Theme：全局正文、表面与边框映射
		</Theme>
		<ThemeView
			background-color="vc-background-color-primary-light"
			class="audit-theme__surface" :pseudo="{ ':hover > span': { color: 'vc-color-primary' } }">
			<ThemeText color="vc-foreground-color">ThemeView / ThemeText：hover 映射主色</ThemeText>
		</ThemeView>
		<ThemeImage :variables="{ image: svgImage('ThemeImage') }" src="image" alt="主题映射图片" :width="160" :height="90" />
	</div>
</template>
<script setup>
import { Theme, ThemeView, ThemeText, ThemeImage } from '@deot/vc';
import { svgImage } from '../sample';

defineProps({ mobile: Boolean, overlayGeneration: Number });
</script>
