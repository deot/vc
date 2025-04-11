<template>
	<div style="padding: 20px">
		<h1>Basic</h1>
		<Alert closable title="sss">
			sss
		</Alert>
		<br>
		<Alert closable title="sss">
			<template #desc>
				<div>desc</div>
			</template>
		</Alert>
		<br>
		<Alert closable title="sss" />
	</div>
</template>
<script setup>
import { Alert } from '..';

</script>
