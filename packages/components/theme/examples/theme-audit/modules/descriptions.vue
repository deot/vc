<template>
	<div class="audit-stack">
		<Descriptions title="标题" :data="data" :options="options" />
		<Descriptions theme="border" :data="data" :options="options" />
	</div>
</template>
<script setup>
import { Descriptions } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });

const data = { name: '条目 1', type: '类型 A', status: '进行中', desc: '说明文字' };
const options = [
	{ label: '名称', prop: 'name' },
	{ label: '类型', prop: 'type', tooltip: '提示' },
	{ label: '状态', prop: 'status' },
	{ label: '说明', prop: 'desc', span: 24 }
];
</script>
