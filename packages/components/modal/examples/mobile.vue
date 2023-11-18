<template>
	<div style="padding: 100px">
		<MModalView 
			v-model="visible1"
			:mask-closable="true"
			title="标题1"
			content="账号密码不一致，请重试"
			@close="handleClose"
			@cancel="handleCancel"
			@ok="handleOk"
		/>
		<MModalView 
			v-model="visible2"
			:mode="mode"
			:mask-closable="true"
			title="标题1"
			@close="handleClose"
			@cancel="handleCancel"
			@ok="handleOk"
		>
			<div @click="handleClick4">
				portal: 确定，取消
			</div>
			<!-- <vcm-input v-model="value" /> -->
		</MModalView>
		<MModalView 
			v-model="visible3"
			:mode="mode"
			:mask-closable="true"
			:cancel-text="false"
			title="标题1"
			content="啦啦啦啦"
			@close="handleClose"
			@cancel="handleCancel"
			@ok="handleOk"
		/>
		<MModalView 
			v-model="visible4"
			:mask-closable="true"
			content="账号密码不一致，请重试"
			@close="handleClose"
			@cancel="handleCancel"
			@ok="handleOk"
		/>
		<div @click="handleClick1">
			normal: 基本
		</div>		
		<div @click="handleClick2">
			normal: 自定义slot content
		</div>
		<div @click="handleClick3">
			normal: 1个按钮
		</div>
		<div @click="handleClick4">
			portal: 确定，取消
		</div>
		<div @click="handleClick5">
			portal: 多个按钮
		</div>
		<div @click="handleClick6">
			portal: operation
		</div>	
		<div @click="handleClick7">
			normal: 无标题
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MModal, MModalView } from '../index.m';
import { VcInstance } from '../../vc/index';

window.vc = VcInstance;

const mode = ref('alert');
const visible1 = ref(false);
const visible2 = ref(false);
const visible3 = ref(false);
const visible4 = ref(false);

const handleClose = () => {
	console.log('关闭后都会触发');
};

const handleCancel = () => {
	console.log('点击取消这个按钮时回调');
};

const handleOk = (e) => {
	console.log('点击确定这个按钮时回调');
	return new Promise((resolve) => {
		setTimeout(resolve, 3000);
	});
};

const handleClick1 = () => {
	visible1.value = !visible1.value;
};

const handleClick2 = () => {
	visible2.value = !visible2.value;
};

const handleClick3 = () => {
	visible3.value = !visible3.value;
};

const handleClick4 = () => {
	MModal.alert({
		title: '标题1',
		content: '啦啦',
		onOk: () => {
			console.log('点击确定这个按钮时回调');
		},
		onCancel: () => {
			setTimeout(() => {
				console.log('点击确定这个按钮时回调');
			}, 3000);
			return true;
		},
		onClose: () => {
			console.log('关闭后都会触发');
		}
	});
};

const handleClick5 = () => {
	MModal.alert({
		title: '标题1',
		content: '啦啦',
		actions: [
			{
				text: '1',
				onPress: () => console.log(`点击了第1个按钮`)
			},
			{
				text: '2',
				onPress: () => console.log(`点击了第2个按钮`)
			},
			{
				text: '3',
				onPress: () => console.log(`点击了第3个按钮`)
			}
		]
	});
};

const handleClick6 = () => {
	MModal.operation({
		actions: [
			{
				text: '1',
				onPress: () => console.log(`点击了第1个按钮`)
			},
			{
				text: '2',
				onPress: () => console.log(`点击了第2个按钮`)
			},
			{
				text: '3',
				onPress: () => console.log(`点击了第3个按钮`)
			}
		]
	});
};

const handleClick7 = () => {
	visible4.value = !visible4.value;
};
</script>
