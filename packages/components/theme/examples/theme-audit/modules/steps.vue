<template>
	<div class="audit-scroll">
		<div class="audit-stack">
			<div v-for="item in states" :key="item.type" class="audit-sample" :data-state="item.type">
				<div class="audit-sample__label">{{ item.type }}</div>
				<div class="audit-steps">
					<Steps v-model="item.value" :type="item.type" clickable>
						<Step v-for="(status, index) in ['success', 'pending', 'error', 'default']" :key="index"
							:title="`步骤 ${index + 1}`"
							:description="status" :status="status" :disabled="index === 3" />
					</Steps>
				</div>
			</div>
		</div>
	</div>
</template>
<script setup>
import { reactive } from 'vue';
import { Steps, Step } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
const states = reactive(['default', 'dot', 'arrow', 'navigation'].map(type => ({ type, value: 2 })));
</script>
