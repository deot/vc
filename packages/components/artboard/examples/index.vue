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

let undoable = false;
let redoable = false;

const handleUndo = () => {
	if (!undoable) {
		Message.warning('已经没有回退的步骤了');
		return;
	}
	artboard.value.undo();
};
const handleRedo = () => {
	if (!redoable) {
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

const handleChange = ({ snapshots, current, allowUndo, allowRedo }) => {
	console.log('snapshots :', snapshots);
	console.log('current :', current);
	undoable = allowUndo;
	redoable = allowRedo;
};

const handlePopup = () => {
	Sign.popup();
};

</script>
