<template>
	<div style="padding: 200px">
		<Popconfirm
			v-model="visible"
			:trigger="trigger"
			title="Are you sure to delete this task?"
			type="info"
			@close="handleClose"
			@visible-change="handleChange"
			@cancel="handleCancel"
			@ok="handleOk"
		>
			<Button type="primary">
				点我
			</Button>
			<template #content>
				<div>222</div>
			</template>
		</Popconfirm>

		<Button @click="handleVisible">
			外部点击
		</Button>
		<Button @click="handleTrigger">
			{{ trigger }}
		</Button>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Popconfirm } from '..';
import { Button } from '../../button/index';

const visible = ref(false);
const trigger = ref('hover');

let wait;
let timer;

const handleVisible = () => {
	if (!wait) {
		visible.value = !visible.value;
	}
};

const handleClose = () => {
	console.log('关闭后都会触发');
	wait = 1;
	timer = setTimeout(() => {
		wait = 0;
	}, 200);
};

const handleCancel = () => {
	console.log('点击取消这个按钮时回调');
};

const handleOk = () => {
	return new Promise((resolve, reject) => {
		setTimeout(reject, 1000);
	});
};

const handleTrigger = () => {
	trigger.value = trigger.value === 'hover' ? 'click' : 'hover';
};

const handleChange = (v) => {
	console.log('visible-change', v);
};
</script>
