<template>
	<button 
		@click="handleChange"
	>
		当前主题：{{ current }}
	</button>
	<ThemeView 
		:pseudo="{
			before: {
				background: 'color-before',
			},
			':hover > span': {
				color: 'color-hover',
			}
		}"
		style="font-size: 30px"
		background-color="color-background" 
		border-color="color-border"
	>
		<ThemeText color="color-primary">文字颜色：跟随主题</ThemeText>
	</ThemeView>
</template>
<script lang="ts" setup>
import { ref } from 'vue';
import { ThemeText, ThemeView } from '..';
import { VcInstance } from '../../vc';

const variables = {
	light: {
		'color-primary': '#000',
		'color-border': 'red',
		'color-background': 'white',
		'color-before': 'green',
		'color-hover': 'pink'
	},
	dark: {
		'color-primary': '#fff',
		'color-border': 'blue',
		'color-background': '#000',
		'color-before': 'yellow',
		'color-hover': 'orange'
	}
}
const current = ref();

const reset = () => {
	VcInstance.configure({
		Theme: {
			variables: variables[current.value]
		}
	});
}

const handleChange = () => {
	current.value = current.value === 'dark' 
		? 'light'
		: 'dark';

	reset();
}

reset();
</script>

<style lang="scss">

.v-theme__block {
	display: inline-block; 
	padding: 10px 5px; 
	border-width: 2px; 
	border-style: solid;
	&:before {
		width: 100%;
		height: 5px;
		content: ' ';
		display: block;
	}
}
</style>