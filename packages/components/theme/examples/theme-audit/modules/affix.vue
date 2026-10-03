<template>
	<div class="audit-stack">
		<p class="audit-hint">在局部区域滚动，检查普通与吸附状态；不会吸附到检查页顶部。</p>
		<div class="audit-utility-surface audit-affix">
			<p class="audit-affix__intro">向下滚动</p>
			<Affix :fixed="false" :offset="0" :z-index="1">
				<template #default="{ active }"><Button :type="active ? 'primary' : 'default'">{{ active ? '已吸附' : '普通状态' }}</Button></template>
			</Affix>
			<div class="audit-affix__content">局部滚动内容 · 继承主题</div>
		</div>
		<Affix disabled><Button disabled>禁用吸附</Button></Affix>
	</div>
</template>
<script setup>
import { Affix, Button } from '@deot/vc';
</script>
