<template>
	<div>
		<Spin :size="15" />
		<Spin />
		<Spin :size="45" />
		<div style="--vc-spin-foreground-color: #909399; --vc-spin-color-primary: #1db88c; margin-top: 16px">
			<Spin />
			<Spin foreground="#64758b" background="#e6a23c" />
		</div>
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
