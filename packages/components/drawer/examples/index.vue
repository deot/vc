<template>
	<div>
		<Button @click="handleDrawerBottom">
			Bottom抽屉
		</Button>
		<Button @click="handleDrawerRight">
			Right抽屉
		</Button>
		<Button @click="handleDrawerPortal">
			new Portal
		</Button>
		<Button type="primary" @click="handleDrawerOpen">
			Drawer.open
		</Button>
		<div style="height: 1000px" />
		<Drawer
			v-model="isActiveRight"
			title="Right"
			:width="500"
			:mask="false"
			:scrollable="true"
		>
			<div>
				我是content2
			</div>
		</Drawer>
		<Drawer
			v-model="isActiveBottom"
			title="Bottom"
			:height="500"
			:footer="false"
			placement="bottom"
		>
			我是content1
		</Drawer>
	</div>
</template>
<script setup>
import { ref, h } from 'vue';
import { Drawer } from '..';
import { Button } from '../../button';
import { AnyDrawer } from './popup';

const isActiveBottom = ref(false);
const isActiveRight = ref(false);

const handleDrawerBottom = () => {
	isActiveBottom.value = true;
};

const handleDrawerRight = () => {
	isActiveRight.value = true;
};

const handleDrawerPortal = () => {
	AnyDrawer.popup();
};

const handleDrawerOpen = () => {
	Drawer.open({
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
}
</script>
