<template>
	<div class="audit-stack">
		<Customer :render="renderContent" />
		<p class="audit-hint">继承主题：自定义渲染普通正文、次要文字及主色。</p>
	</div>
</template>
<script setup>
import { h } from 'vue';
import { Customer } from '@deot/vc';

const renderContent = () => h('div',
	{ class: 'audit-utility-surface' },
	[
		h('p',
			'普通正文'), h('p',
			{ class: 'audit-customer__muted' },
			'次要文字'),
		h('p',
			{ class: 'audit-customer__primary' },
			'主色内容')
	]);
</script>
