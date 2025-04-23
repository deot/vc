<template>
	<Scroller class="demo" :native="false">
		<div style="min-width: 600px; height: 100vh; display: flex;">
			<div style="display: flex; flex: 0 0 200px;">left</div>
			<div style="display: flex; flex-direction: column; height: 100%; width: 100%;">
				<div>header</div>
				<div style="flex: 1; overflow: hidden;">
					<Resizer style="padding: 40px; background: gray;" @resize="handleResize">
						<template #default="{ style, height, width }">
							<Scroller style="border: 1px solid red; box-sizing: border-box;" :style="style">
								<div v-for="item in 1000" :key="item">
									item: {{ item }}
									width: {{ width }}
									height: {{ height }}
									style: {{ style }}
									item: {{ item }}
									width: {{ width }}
									height: {{ height }}
									style: {{ style }}
									item: {{ item }}
									width: {{ width }}
									height: {{ height }}
									style: {{ style }}
								</div>
							</Scroller>
						</template>
					</Resizer>
				</div>
				<div>footer</div>
			</div>
		</div>
	</Scroller>
</template>
<script setup>
import { Resizer } from '..';
import { Scroller } from '../../scroller';

const handleResize = (e) => {
	console.log(e);
};
</script>
<style>
body {
	margin: 0;
}
.demo {
	background: #E8E9EE;
	width: 100vw;
	height: 100vh;
	position: relative;
}
</style>
