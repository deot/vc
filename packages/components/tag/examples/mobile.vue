<template>
	<div class="m-tag-demo">
		<h3>default</h3>
		<div class="m-tag-demo__row">
			<MTag v-for="color in colors" :key="color" :color="color">
				{{ color }}
			</MTag>
		</div>

		<h3>border</h3>
		<div class="m-tag-demo__row">
			<MTag v-for="color in colors" :key="color" type="border" :color="color">
				{{ color }}
			</MTag>
		</div>

		<h3>dot</h3>
		<div class="m-tag-demo__row">
			<MTag v-for="color in colors" :key="color" type="dot" :color="color">
				{{ color }}
			</MTag>
		</div>

		<h3>closable</h3>
		<div class="m-tag-demo__row">
			<MTag
				v-for="item in tags"
				:key="item"
				:value="item"
				type="border"
				color="primary"
				closable
				@close="handleClose"
			>
				{{ item }}
			</MTag>
			<MTag type="dot" color="success" closable>
				dot
			</MTag>
			<MTag color="warning" closable>
				default
			</MTag>
		</div>

		<h3>checkable</h3>
		<div class="m-tag-demo__row">
			<MTag
				v-for="(color, index) in colors.slice(1)"
				:key="color"
				:checked="index % 2 === 0"
				:color="color"
				checkable
			>
				选项 {{ index + 1 }}
			</MTag>
		</div>
	</div>
</template>

<script setup>
import { ref } from 'vue';
import { MTag } from '../index.m';

const colors = ['default', 'primary', 'success', 'warning', 'error'];
const tags = ref(['标签一', '标签二', '标签三']);

const handleClose = (e, value) => {
	tags.value = tags.value.filter(item => item !== value);
};
</script>

<style>
.m-tag-demo {
	padding: 16px;
}

.m-tag-demo__row {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	row-gap: calc(var(--vc-rem) * 16);
	margin-bottom: 16px;
}
</style>
