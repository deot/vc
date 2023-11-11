<template>
	<VFragment>
		<div @click="handleClick">
			点我
		</div>
		<div>2</div>
		<div>3</div>
		<div>4</div>
		<div>5</div>
	</VFragment>
</template>
<script setup>
import { Fragment as VFragment} from '..';

const handleClick = () => {
	alert('你点击了我');
};
</script>
