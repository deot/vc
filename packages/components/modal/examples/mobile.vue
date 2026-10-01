<template>
	<div style="padding: 100px">
		<MModalView
			v-model="isVisible1"
			:mask-closable="true"
			title="标题1"
			content="输入内容不一致，请重试，请重试"
			@close="handleClose"
			@cancel="handleCancel"
			@ok="handleOk"
		/>
		<MModalView
			v-model="isVisible2"
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
			v-model="isVisible3"
			:mode="mode"
			:mask-closable="true"
			:cancel-text="false"
			title="标题1"
			content="确认"
			@close="handleClose"
			@cancel="handleCancel"
			@ok="handleOk"
		/>
		<MModalView
			v-model="isVisible4"
			:mask-closable="true"
			content="输入内容不一致，请重试，请重试"
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
const isVisible1 = ref(false);
const isVisible2 = ref(false);
const isVisible3 = ref(false);
const isVisible4 = ref(false);

const handleClose = () => {
	console.log('关闭后都会触发');
};

const handleCancel = () => {
	console.log('点击取消这个按钮时回调');
};

const handleOk = () => {
	console.log('点击确定这个按钮时回调');
	return new Promise((resolve) => {
		setTimeout(resolve, 3000);
	});
};

const handleClick1 = () => {
	isVisible1.value = !isVisible1.value;
};

const handleClick2 = () => {
	isVisible2.value = !isVisible2.value;
};

const handleClick3 = () => {
	isVisible3.value = !isVisible3.value;
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
		data: [
			{
				content: '1',
				onClick: () => console.log(`点击了第1个按钮`)
			},
			{
				content: '2',
				onClick: () => console.log(`点击了第2个按钮`)
			},
			{
				content: '3',
				onClick: () => console.log(`点击了第3个按钮`)
			}
		]
	});
};

const handleClick6 = () => {
	MModal.operation({
		data: [
			{
				content: '1',
				onClick: () => console.log(`点击了第1个按钮`)
			},
			{
				content: '2',
				onClick: () => console.log(`点击了第2个按钮`)
			},
			{
				content: '3',
				onClick: () => console.log(`点击了第3个按钮`)
			}
		]
	});
};

const handleClick7 = () => {
	isVisible4.value = !isVisible4.value;
};
</script>
