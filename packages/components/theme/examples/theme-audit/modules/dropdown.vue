<template>
	<Dropdown v-model="visible" trigger="click" placement="bottom-left" arrow @close="visible = false" @portal-fulfilled="visible = false">
		<Button>打开状态菜单</Button>
		<template #content>
			<DropdownMenu>
				<DropdownItem label="普通项" value="normal" :closable="false" />
				<DropdownItem label="选中项" selected :closable="false" />
				<DropdownItem label="禁用项" disabled />
				<DropdownItem label="分组分隔项" divided />
			</DropdownMenu>
		</template>
	</Dropdown>
</template>
<script setup>
import { ref, watch } from 'vue';
import { Button, Dropdown, DropdownMenu, DropdownItem } from '@deot/vc';

const props = defineProps({ mobile: Boolean, overlayGeneration: Number });
const visible = ref(false);
watch(() => props.overlayGeneration, () => { visible.value = false; });
</script>
