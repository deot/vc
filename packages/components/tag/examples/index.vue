<template>
	<div>
		<Tag color="default">
			default
		</Tag>
		<Tag color="primary">
			primary
		</Tag>
		<Tag color="success">
			success
		</Tag>
		<Tag color="error">
			error
		</Tag>
		<Tag color="warning">
			warning
		</Tag>
		<br><br>
		<Tag type="border" closable color="primary">
			标签一
		</Tag>
		<Tag type="border" closable color="success">
			标签二
		</Tag>
		<Tag type="border" closable color="error">
			标签三
		</Tag>
		<Tag type="border" closable color="warning">
			标签四
		</Tag>
		<br><br>
		<Tag type="dot" closable color="primary">
			标签一
		</Tag>
		<Tag type="dot" closable color="success">
			标签二
		</Tag>
		<Tag type="dot" closable color="error">
			标签三
		</Tag>
		<Tag type="dot" closable color="warning">
			标签四
		</Tag>
		<br><br>
		<Tag checkable color="primary">
			标签一
		</Tag>
		<Tag checkable color="success">
			标签二
		</Tag>
		<Tag checkable color="error">
			标签三
		</Tag>
		<Tag checkable color="warning">
			标签四
		</Tag>
		<br><br>
		<Tag
			v-for="item in count"
			:key="item"
			:value="item"
			closable
			@close="handleClose"
		>
			标签{{ item + 1 }}
		</Tag>
		<span @click="handleAdd">添加标签</span>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Tag } from '..';

const count = ref([0, 1, 2]);
const handleAdd = () => {
	if (count.value.length) {
		count.value.push(count.value[count.value.length - 1] + 1);
	} else {
		count.value.push(0);
	}
};
const handleClose = (event, name) => {
	const index = count.value.indexOf(name);
	count.value.splice(index, 1);
};

</script>
