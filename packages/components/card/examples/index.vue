<template>
	<div style="margin: 40px">
		<Card>
			<template #title>
				<p>标题插槽示例</p>
			</template>
			<template #extra>
				<p>Content of card</p>
			</template>
			<p>Content of card</p>
			<p>Content of card</p>
		</Card>
	</div>
</template>
<script setup>
import { Card } from '..';

</script>
