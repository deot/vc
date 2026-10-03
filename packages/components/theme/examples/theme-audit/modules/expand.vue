<template>
	<div class="audit-stack">
		<div class="audit-row"><Button @click="visible = !visible">{{ visible ? '收起' : '展开' }}</Button><Checkbox v-model="alive">保留内容</Checkbox></div>
		<Expand v-model="visible" :alive="alive"><div class="audit-utility-surface">展开内容<br>观察动画中的文字、背景与边框。</div></Expand>
		<p class="audit-hint">继承主题：不添加组件专属颜色。</p>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Expand, Button, Checkbox } from '@deot/vc';

const visible = ref(true);
const alive = ref(true);
</script>
