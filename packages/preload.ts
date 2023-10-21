import "./components/style";

document.body.style.background = `var(--vc-background-color)`;
document.body.style.color = `var(--vc-foreground-color)`;

const el = document.createElement('div');

el.style.position = 'fixed';
el.style.top = '0';
el.style.right = '0';
el.style.cursor = 'pointer';
document.body.appendChild(el);

const key = "data-vc-theme";
let theme = document.body.getAttribute(key) || 'light';

const flip = (v: string) => (v === 'dark' ? 'light' : 'dark');
const setTheme = () => {
	document.body.setAttribute(key, theme);
	el.innerHTML = theme;
};

setTheme();
el.addEventListener('click', () => {
	theme = flip(theme);
	setTheme();
});
