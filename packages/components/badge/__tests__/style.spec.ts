// @vitest-environment node
import * as sass from 'sass';
import postcss from 'postcss';

const compile = (path: string) => postcss.parse(sass.compile(new URL(path, import.meta.url).pathname).css);

const declsFor = (css: postcss.Root, selector: string, property: string) => {
	const values: string[] = [];
	css.walkRules((rule) => {
		if (rule.selectors.includes(selector)) {
			rule.walkDecls(property, (declaration) => {
				values.push(declaration.value);
			});
		}
	});
	return values;
};

const rem = (n: number) => `calc(var(--vc-rem) * ${n})`;

// 两端共用同一份规则，只有尺寸不同：桌面端为 px，移动端为 750 稿（随 --vc-rem 缩放）
describe.each([
	{
		platform: 'desktop',
		name: 'vc-badge',
		path: '../style.scss',
		size: { height: '20px', padding: '6px', fontSize: '12px', dot: '6px', inset: '2px', ring: '2px', label: ['14px', '22px', '8px'] }
	},
	{
		platform: 'mobile',
		name: 'vcm-badge',
		path: '../mobile/style.scss',
		size: { height: rem(32), padding: rem(8), fontSize: rem(24), dot: rem(16), inset: rem(4), ring: rem(4), label: [rem(28), rem(44), rem(16)] }
	}
])('Badge $platform styles', ({ name, path, size }) => {
	const css = compile(path);
	const decls = (selector: string, property: string) => declsFor(css, selector, property);

	it('status colors come from the theme and can be overridden per component', () => {
		const colors = {
			default: 'color-neutral',
			pending: 'color-primary',
			success: 'color-success',
			warning: 'color-warning',
			error: 'color-error'
		};
		for (const [status, color] of Object.entries(colors)) {
			expect(decls(`.${name}__status-dot.is-${status}`, 'background-color'), status)
				.toEqual([`var(--vc-badge-${color}, var(--vc-${color}))`]);
		}
	});

	it('the ring around corner badges uses the surface color', () => {
		const ring = `0 0 0 ${size.ring} var(--vc-badge-background-color-lightest, var(--vc-background-color-lightest))`;
		expect(decls(`.${name}__value`, 'box-shadow')).toEqual([ring]);
		expect(decls(`.${name}__dot`, 'box-shadow')).toEqual([ring]);
	});

	it('sizes of the number, dot, status dot and label', () => {
		const value = `.${name}__value`;
		expect(decls(value, 'height')).toEqual([size.height]);
		expect(decls(value, 'min-width')).toEqual([size.height]);
		expect(decls(value, 'line-height')).toEqual([size.height]);
		expect(decls(value, 'padding')).toEqual([`0 ${size.padding}`]);
		expect(decls(value, 'font-size')).toEqual([size.fontSize]);
		expect(decls(value, 'top')).toEqual([size.inset]);
		expect(decls(value, 'right')).toEqual([size.inset]);

		for (const dot of [`.${name}__dot`, `.${name}__status-dot`]) {
			expect(decls(dot, 'width'), dot).toEqual([size.dot]);
			expect(decls(dot, 'height'), dot).toEqual([size.dot]);
		}

		const label = `.${name}__label`;
		expect([decls(label, 'font-size'), decls(label, 'line-height'), decls(label, 'margin-left')].flat()).toEqual(size.label);
	});

	it('the label baseline is the baseline of the whole badge', () => {
		expect(decls(`.${name}__label`, 'align-self')).toEqual(['baseline']);
	});

	it('enter and leave keep the corner translate, standalone badges only scale', () => {
		expect(decls(`.${name}__zoom-enter-from`, 'transform')).toEqual(['translate(50%, -50%) scale(0.2)']);
		expect(decls(`.${name}__zoom-leave-to`, 'transform')).toEqual(['translate(50%, -50%) scale(0.2)']);
		expect(decls(`.${name}.is-standalone > .${name}__zoom-enter-from`, 'transform')).toEqual(['scale(0.2)']);
		expect(decls(`.${name}.is-standalone > .${name}__zoom-leave-to`, 'transform')).toEqual(['scale(0.2)']);
		expect(decls(`.${name}.is-standalone .${name}__value`, 'transform')).toEqual(['none']);
	});

	it('the number change animation uses its own keyframes', () => {
		let keyframes = 0;
		css.walkAtRules('keyframes', (rule) => {
			rule.params === `${name}-scale` && keyframes++;
		});
		expect(keyframes).toBe(1);
		expect(decls(`.${name}__content.is-changed`, 'animation')[0]).toMatch(new RegExp(`^${name}-scale `));
	});
});

it('the desktop styles do not depend on --vc-rem', () => {
	let uses = 0;
	compile('../style.scss').walkDecls((declaration) => {
		declaration.value.includes('--vc-rem') && uses++;
	});
	expect(uses).toBe(0);
});
