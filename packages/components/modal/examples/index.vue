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
			v-model="visible1"
			:mask-closable="true"
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
			v-model="visible2"
			:mask="false"
			:mask-closable="false"
			:esc-closable="false"
			scrollable
			draggable
			title="标题2"
			ok-text="保存2"
			cancel-text="关闭2"
			@close="handleClose"
			@cancel="handleCancel"
			@ok="handleOk"
		>
			可以拖拽
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
const visible1 = ref(true);
const visible2 = ref(false);
let hasReject = false;

const handleModal1 = () => {
	visible1.value = !visible1.value;
};
const handleModal2 = () => {
	visible2.value = !visible2.value;
};
const handleModal3 = async () => {
	await AnyModal.popup({});
};
const handleModal4 = () => {
	Modal.warning({
		title: 'warning',
		content: () => {
			return [
				h('input', {
					type: 'textarea',
				})
			];
		},
		okText: '啦啦啦啦',
		mask: true,
		closeWithCancel: true,
		maskClosable: true,
		portalClass: 'is-padding-none',
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
			hasReject
				? resolve()
				: (reject(), (hasReject = true));
		}, 1000);
	}).catch((err) => {
		return Promise.reject(err);
	});
};
</script>
