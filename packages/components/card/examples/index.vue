<template>
	<div class="card-demo">
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

		<Card title="标题较长时省略显示，附加内容排在标题右侧而不会遮挡标题文字" icon="search">
			<template #extra>
				<Button size="small" type="primary">
					操作
				</Button>
			</template>
			附加内容为按钮时占用标题栏的内边距，标题栏高度不变（48px）。
		</Card>

		<Card>
			<template #extra>
				<a href="javascript:;">更多</a>
			</template>
			无标题时，附加内容位于右上角。
		</Card>
	</div>
</template>
<script setup>
import { Card } from '..';
import { Button } from '../../button';
</script>

<style>
.card-demo {
	display: grid;
	max-width: 420px;
	padding: 40px;
	gap: 16px;
}
</style>
