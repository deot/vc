<template>
	<div>
		<div>
			<MInput
				v-model="value[0]"
				style="width: 200px"
				clearable
				enter-text="搜索"
				placeholder="显示placeholder"
				@change="handleChange"
				@focus="handleFocus"
				@blur="handleBlur"
				@enter="handleEnter"
			/>
			<div>
				<MInput 
					v-model="value[1]"
					clearable
					placeholder="显示placeholder"
					@change="handleChange"
					@focus="handleFocus"
					@blur="handleBlur"
					@enter="handleEnter"
				>
					<template #append>
						<div>
							ico2222n
						</div>
					</template>
				</MInput>
			</div>
			<br>
			<br>
			<MInputNumber :model-value="value[2]" :max="10" @input="handleInput" />
			<br>
			<br>
			<MForm>
				<MFormItem>
					<MInputNumber 
						v-model="value[3]"
						:max="100"
						@tip="handleTip"
						@after="handleChangeAfter"
					/>
				</MFormItem>
				<MFormItem>
					<MInputNumber 
						v-model="value[4]" 
						:step="false" 
					/>
				</MFormItem>
			</MForm>
			<br>
			<br>
			<MInputSearch 
				v-model="value[5]"
				placeholder="搜索" 
				clearable
				@cancel="handleCancel"
			/>

			<MInputNumber v-model="value[6]" :max="10" disabled />
		</div>
	</div>
</template>
<script setup>
import { ref } from 'vue';
import { MInput, MInputNumber, MInputSearch } from '../index.m';
import { MForm, MFormItem } from '../../form/index.m';
const value = ref(Array.from({ length: 6 }).map(() => 10));

setTimeout(() => {
	value[3] = 0;
}, 3000);

const handleInput = (e) => {
	value[2] = e;
	console.log(e);
};

const handleChange = () => {
	console.log(value.value);
};

const handleFocus = () => {
	console.log('聚焦的回调');
};
const handleBlur = () => {
	console.log('失焦的回调');
};
const handleEnter = () => {
	console.log('回车键的回调');
};
const handleTip = ({ value }) => {
	console.log(value, '超出的提示');
};

const handleCancel = () => {
	alert('cancel');
};

const handleChangeAfter = (value) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			reject(true);
		}, 1000);
	})
}
</script>
