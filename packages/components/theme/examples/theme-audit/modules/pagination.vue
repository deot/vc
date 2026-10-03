<template>
	<div class="audit-scroll">
		<div class="audit-stack">
			<div v-for="item in pages" :key="item.initial" class="audit-sample" :data-state="`初始第 ${item.initial} 页`">
				<div class="audit-sample__label">初始第 {{ item.initial }} 页</div>
				<Pagination :current="item.current" :count="100" :page-size="10" show-sizer show-elevator @change="item.current = $event" />
			</div>
		</div>
	</div>
</template>
<script setup>
import { reactive } from 'vue';
import { Pagination } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const pages = reactive([1, 4, 10].map(initial => ({ initial, current: initial })));
</script>
