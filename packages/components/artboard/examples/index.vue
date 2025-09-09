<template>
	<div class="v-artboard">
		<Artboard
			ref="artboard"
			:options="{ strokeStyle: 'red', shadowColor: 'red' }"
			:width="300"
			:height="200"
			@change="handleChange"
		/>
		<div style="margin-top: 20px;">
			<Button @click="handleReset">
				重置画布
			</Button>
			<Button @click="handleGetImg">
				生成图片
			</Button>
			<Button @click="handleUndo">
				回退一步
			</Button>
			<Button @click="handleRedo">
				取消回退
			</Button>
		</div>
		<img :src="src" alt="">

		<Button @click="handlePopup">弹层</Button>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { Message } from '../../message';
import { Button } from '../../button';
import { Artboard } from '../artboard';
import { Sign } from './popup';

const src = ref('');
const artboard = ref(null);

let undo = false;
let redo = false;

const handleUndo = () => {
	if (!undo) {
		Message.warning('已经没有回退的步骤了');
		return;
	}
	artboard.value.undo();
};
const handleRedo = () => {
	if (!redo) {
		Message.warning('已经没有撤销的步骤了');
		return;
	}
	artboard.value.redo();
};

const handleReset = () => {
	console.log(artboard);
	artboard.value.reset();
};

const handleGetImg = () => {
	src.value = artboard.value.canvas.toDataURL();
};

const handleChange = ({ snapshots, current }) => {
	console.log('snapshots :', snapshots);
	console.log('current :', current);
	if (current === 0) {
		undo = false;
	} else if (current === snapshots.length) {
		undo = true;
		redo = false;
	} else {
		undo = true;
		redo = true;
	}
};

const handlePopup = () => {
	Sign.popup();
};

</script>
