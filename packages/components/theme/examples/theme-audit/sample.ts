export const svgImage = (label = 'Theme', fill = '#456CF6') => 'data:image/svg+xml,' + encodeURIComponent(
	`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
		<rect width="320" height="180" rx="12" fill="${fill}"/>
		<circle cx="260" cy="30" r="70" fill="#fff" opacity=".12"/>
		<text x="24" y="106" fill="#fff" font-size="26" font-family="sans-serif">${label}</text>
	</svg>`
);
