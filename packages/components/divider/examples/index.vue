<template>
	<div style="padding: 20px;">
		<div>
			<span>1</span>
			<Divider vertical />
			<span>2</span>
			<Divider vertical />
			<span>3</span>
		</div>
		<div>
			<Divider />
			<span>1</span>
			<Divider placement="left">
				2
			</Divider>
			<span>3</span>
			<Divider>4</Divider>
			<span>5</span>
			<Divider placement="right">
				6
			</Divider>
		</div>
	</div>
</template>
<script setup>
import { Divider } from '..';

</script>
