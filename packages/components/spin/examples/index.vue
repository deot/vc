<template>
	<div>
		<Spin :size="15" />
		<Spin />
		<Spin :size="45" />
		<br>
		<br>
		<br>
		<br>
		<br>
		<Spin>
			<template #loading>
				<spin>
					loading slot
				</spin>
			</template>
		</Spin>
		<br>
		<br>
		<br>
		<br>
		<br>
		<Spin>
			loading....
		</Spin>
	</div>
</template>
<script setup>
import { Spin } from '..';

</script>
