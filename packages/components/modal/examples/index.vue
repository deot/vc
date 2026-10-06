<template>
	<div style="padding: 100px">
		<Button @click="handleModal1">
			点击出现对话框
		</Button>
		<Button @click="handleModal2">
			点击出现对话框,点击遮罩不能关闭
		</Button>
		<Button @click="handleModal3">
			new Portal
		</Button>
		<Button type="primary" @click="handleModal4">
			Modal.methods
		</Button>
		<div style="width: 100%; height: 2000px" />
		<ModalView
			v-model="isVisible1"
			:mask-closable="true"
			height="auto"
			title="标题1"
			@close="handleClose"
			@cancel="handleCancel"
			@ok="handleOk"
		>
			<Button type="primary" @click="handleModal4">
				Modal.methods
			</Button>
			<template #footer>
				222
			</template>
		</ModalView>
		<ModalView
			v-model="isVisible2"
			:mask="false"
			:mask-closable="false"
			:esc-closable="false"
			:height="500"
			:width="500"
			draggable
			border
			title="标题2"
			ok-text="保存2"
			cancel-text="关闭2"
			@close="handleClose"
			@cancel="handleCancel"
			@ok="handleOk"
		>
			<div>可以拖拽</div>
			<div>可以拖拽</div>
			<div>可以拖拽</div>
			<div>可以拖拽</div>
			<div>可以拖拽</div>
			<div>可以拖拽</div>
			<div>可以拖拽</div>
		</ModalView>
	</div>
</template>
<script setup>
import { h, ref } from 'vue';
import { Button } from '../../button';
import { Modal, ModalView } from '..';
import { AnyModal } from './popup';
import { VcInstance } from '../../vc';

window.vc = VcInstance;
const isVisible1 = ref(true);
const isVisible2 = ref(false);
let isRejected = false;

const handleModal1 = () => {
	isVisible1.value = !isVisible1.value;
};
const handleModal2 = () => {
	isVisible2.value = !isVisible2.value;
};
const handleModal3 = async () => {
	await AnyModal.popup({});
};
const handleModal4 = () => {
	Modal.warning({
		title: 'warning',
		width: 500,
		content: () => {
			return [
				h('div', '确认后将提交当前示例内容，请检查填写结果。')
			];
		},
		okText: '确认',
		mask: true,
		closeWithCancel: true,
		maskClosable: true,
		// contentClass: 'is-padding-none',
		// draggable: true,
		onOk: () => {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve();
				}, 1000);
			});
		},
		onCancel: () => {
			setTimeout(() => {
				console.log('cancel');
			});
			return false;
		},

		onClose: () => {
			console.log('关闭后都会触发');
		}
	});
};

const handleClose = () => {
	console.log('关闭后都会触发');
};

const handleCancel = () => {
	console.log('点击取消这个按钮时回调');
};

const handleOk = () => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			isRejected
				? resolve()
				: (reject(), (isRejected = true));
		}, 1000);
	}).catch((err) => {
		return Promise.reject(err);
	});
};
</script>
