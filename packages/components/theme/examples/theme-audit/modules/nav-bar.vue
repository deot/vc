<template>
	<MNavBar title="标题" back="返回" @back="() => {}">
		<template #right>
			<MIcon type="share" />
		</template>
	</MNavBar>
</template>
<script setup>
import { MNavBar, MIcon } from '@deot/vc';

defineProps({ mobile: Boolean, overlayGeneration: Number });
</script>
