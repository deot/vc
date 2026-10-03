<template>
	<div class="audit-stack">
		<Fragment>
			<div class="audit-utility-surface">第一个节点 · 普通正文</div>
			<div class="audit-utility-surface is-muted">第二个节点 · 次要文字</div>
		</Fragment>
		<p class="audit-hint">继承主题：Fragment 不生成包装元素。</p>
	</div>
</template>
<script setup>
import { Fragment } from '@deot/vc';
</script>
