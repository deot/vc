<template>
	<div class="dropdown-states-demo">
		<Dropdown v-model="isVisible" trigger="click" placement="bottom-left" arrow @click="handleClick">
			<Button>点击选择排序</Button>
			<template #content>
				<DropdownMenu>
					<DropdownItem value="time" :selected="sort === 'time'" :closable="false" label="按时间排序" />
					<DropdownItem value="name" :selected="sort === 'name'" :closable="false" label="按名称排序" />
					<DropdownItem disabled label="无权限操作" />
					<DropdownItem value="done" divided label="完成并关闭" />
				</DropdownMenu>
			</template>
		</Dropdown>
		<p>排序：{{ sort }}；菜单{{ isVisible ? '已展开' : '已关闭' }}</p>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { Button } from '../../button';
import { Dropdown, DropdownMenu, DropdownItem } from '..';

const isVisible = ref(false);
const sort = ref('time');
const handleClick = (value) => {
	if (value !== 'done') sort.value = value;
};
</script>

<style scoped>
.dropdown-states-demo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	justify-content: space-between;
	min-height: 220px;
	padding: 24px;
}
</style>
