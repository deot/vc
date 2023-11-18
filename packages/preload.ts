import "./components/style";

// 设置 viewport 的内容
let metaViewport = document.querySelector('meta[name="viewport"]');
metaViewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no');


// 设置主题
const el = document.createElement('button');
el.style.position = 'fixed';
el.style.top = '0';
el.style.right = '0';
el.style.cursor = 'pointer';
el.style.zIndex = '9999999';
document.body.appendChild(el);

el.addEventListener('click', () => {
	const key = "data-vc-theme";
	let v = document.body.getAttribute(key);
	v = !v || v === 'dark' ? 'light' : 'dark';

	document.body.setAttribute(key, v);
	el.innerHTML = `theme: ${v}`;
});
el.dispatchEvent(new Event('click'));


// 设置主题值
const tEl = document.createElement('button');
tEl.style.position = 'fixed';
tEl.style.top = '22px';
tEl.style.right = '0';
tEl.style.cursor = 'pointer';
tEl.style.zIndex = '9999999';
document.body.appendChild(tEl);

tEl.addEventListener('click', () => {
	let style = {
		background: `var(--vc-background-color)`,
		color: `var(--vc-foreground-color)`,
	};

	const key = "data-vc-value";
	let v = document.body.getAttribute(key);
	v = !v || v === 'unset' ? 'set' : 'unset';

	document.body.setAttribute(key, v);
	tEl.innerHTML = `vars: ${v}`;

	if (v === 'set') {
		document.body.style.background = style.background;
		document.body.style.color = style.color;
	} else {
		document.body.style.background = '';
		document.body.style.color = '';
	}
});
tEl.dispatchEvent(new Event('click'));
