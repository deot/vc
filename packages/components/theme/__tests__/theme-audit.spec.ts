// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc';
import * as sass from 'sass';
import {
	createChanges, exportCss, exportScss, parameterProperty, parameterValue, readParameters,
	readSaved, restoreParameter, setParameter, validValue
} from '../examples/theme-audit/model';
import {
	COMPONENT_COUNT, GROUPS, MOBILE_COMPONENTS, MOBILE_ONLY
} from '../examples/theme-audit/catalogue';
import { balanceGrid } from '../examples/theme-audit/grid-layout';

const path = new URL('../examples/theme-audit/parameters.module.scss',
	import.meta.url);
const compiled = sass.compile(path.pathname).css;
const exports = Object.fromEntries([...compiled.matchAll(/^\s+([\w-]+): ([^;]+);$/gm)].map(match => [match[1], match[2]]));
const parameters = readParameters(exports);
const find = (name: string) => parameters.find(parameter => parameter.name === name)!;
const supports = (_property: string, value: string) => value !== 'invalid';

describe('Theme audit demo: balanced grid', () => {
	it.each([[8, 15, 23, 27], [22, 13, 20], [10, 18, 32, 26, 7, 16]])('minimizes the two-column height difference for %j', (...spans) => {
		const items = spans.map(span => ({ span, wide: false }));
		const layout = balanceGrid(items, 2);
		const totals = [0, 0];
		layout.forEach((item) => { totals[item.column - 1] += item.span; });
		const sum = spans.reduce((total, span) => total + span, 0);
		let minimum = sum;
		for (let mask = 0; mask < 2 ** spans.length; mask++) {
			const left = spans.reduce((total, span, index) => total + (mask & (1 << index) ? span : 0), 0);
			minimum = Math.min(minimum, Math.abs(sum - left * 2));
		}
		expect(Math.abs(totals[0] - totals[1])).toBe(minimum);
		expect(layout[0].column).toBe(1);
		for (const column of [1, 2]) {
			const entries = layout.filter(item => item.column === column);
			entries.slice(1).forEach((item, index) => expect(item.row).toBe(entries[index].row + entries[index].span));
		}
	});
	it('puts full-row cards first without stretching and preserves source order in one column', () => {
		const items = [{ span: 5, wide: false }, { span: 12, wide: true }, { span: 9, wide: false }];
		const desktop = balanceGrid(items, 2);
		expect(desktop[1]).toEqual({ row: 1, column: 1, span: 12, width: 2 });
		expect(desktop[0].row).toBe(13);
		expect(desktop[2].row).toBe(13);
		expect(balanceGrid(items, 1).map(item => [item.row, item.width])).toEqual([[1, 1], [6, 1], [18, 1]]);
	});
	it('keeps columns stable while cards grow or shrink, without adding blank space', () => {
		const items = [8, 15, 23, 27].map(span => ({ span, wide: false }));
		const columns = balanceGrid(items, 2).map(item => item.column);
		for (const span of [2, 60, 8]) {
			const changed = items.map((item, index) => ({ ...item, span: index === 1 ? span : item.span }));
			const layout = balanceGrid(changed, 2, columns);
			expect(layout.map(item => item.column)).toEqual(columns);
			for (const column of [1, 2]) {
				const entries = layout.filter(item => item.column === column);
				expect(entries[0].row).toBe(1);
				entries.slice(1).forEach((item, index) => expect(item.row).toBe(entries[index].row + entries[index].span));
			}
		}
	});
});

describe('Theme audit demo: source parameters',
	() => {
		it('exports every source token, keeping paired and shared shapes',
			() => {
				const theme = readFileSync(new URL('../../style/theme.scss',
					import.meta.url),
				'utf8');
				const names = [...theme.matchAll(/^\t([a-z][a-z-]+):/gm)].map(match => match[1]);
				expect(parameters.map(parameter => parameter.name)).toEqual(names);
				expect(parameters).toHaveLength(50);
				expect(parameters.filter(parameter => parameter.mode === 'paired')).toHaveLength(27);
				expect(parameters.filter(parameter => parameter.mode === 'shared')).toHaveLength(23);
				expect(parameters.filter(parameter => parameter.kind === 'color')).toHaveLength(40);
				expect(parameters.filter(parameter => parameter.kind === 'shadow')).toHaveLength(3);
				expect(parameters.filter(parameter => parameter.kind === 'dimension')).toHaveLength(7);
			});
		it('groups the shared neutral color with its family and preserves both theme values', () => {
			const names = parameters.map(parameter => parameter.name);
			const index = names.indexOf('color-neutral');
			expect(names.slice(index, index + 3)).toEqual(['color-neutral', 'color-neutral-light', 'color-neutral-deep']);
			expect(find('color-neutral-light')).toMatchObject({ mode: 'paired', kind: 'color', light: '#EDEFF1', dark: '#3B4354' });
			const variables = sass.compile(new URL('../../style/variables.scss', import.meta.url).pathname).css;
			expect(variables.match(/--vc-color-neutral-light: #EDEFF1;/g)).toHaveLength(2);
			expect(variables.match(/--vc-color-neutral-light: #3B4354;/g)).toHaveLength(2);
		});
		it('orders the existing grades without inventing missing shades', () => {
			const names = parameters.map(parameter => parameter.name);
			expect(names.filter(name => /^color-dark(?:$|-)/.test(name))).toEqual([
				'color-dark', 'color-dark-light', 'color-dark-lighter', 'color-dark-lightest', 'color-dark-extralight'
			]);
			expect(names.filter(name => /^color-light(?:$|-)/.test(name))).toEqual([
				'color-light', 'color-light-deep', 'color-light-deeper', 'color-light-deepest', 'color-light-extradeep'
			]);
			expect(names.filter(name => /^background-color(?:-(?:light|lighter|lightest))?$/.test(name))).toEqual([
				'background-color', 'background-color-light', 'background-color-lighter', 'background-color-lightest'
			]);
			expect(names.filter(name => /^color-primary(?:$|-)/.test(name))).toEqual([
				'color-primary', 'color-primary-light', 'color-primary-lighter'
			]);
			expect(new Set(names).size).toBe(50);
			expect(names.some(name => name.endsWith('-muted'))).toBe(false);
		});
		it.each([
			['background-color-light', '#F7F8FA', '#2D3444'],
			['background-color-lighter', '#FAFAFA', '#292F3E'],
			['background-color-lightest', '#fff', '#252b3a'],
			['background-color-primary-light', '#E6F7FF', '#273E5E'],
			['background-color-error-light', 'rgba(245, 63, 63, 0.15)', 'rgba(245, 63, 63, 0.15)'],
			['foreground-color-light', '#667383', '#C9C9C9']
		])('preserves the paired values and transparency of %s', (name, light, dark) => {
			expect(find(name)).toMatchObject({ light, dark, kind: 'color' });
		});
		it('keeps SCSS and CSS export order tied to the source while values change', () => {
			const changes = createChanges();
			setParameter(find('background-color-light'), changes, 'dark', '#abcdef');
			setParameter(find('color-neutral-light'), changes, 'light', '#123456');
			const names = parameters.map(parameter => parameter.name);
			const scss = exportScss(parameters, changes);
			expect([...scss.matchAll(/^\t([a-z][a-z-]+):/gm)].map(match => match[1])).toEqual(names);
			const cssNames = [...exportCss(parameters, changes).matchAll(/--vc-([a-z-]+):/g)].map(match => match[1]);
			expect(cssNames).toEqual([...names, ...names, ...names, ...names]);
		});
		it('matches all seven sidebar groups and covers 72 families including Theme',
			() => {
				const names = GROUPS.flatMap(group => [...group.names]);
				expect(names).toHaveLength(71);
				expect(new Set(names).size).toBe(71);
				expect(COMPONENT_COUNT).toBe(72);
				const html = readFileSync(new URL('../../../../index.html', import.meta.url), 'utf8');
				const source = html.slice(html.indexOf('const componentGroups ='), html.indexOf('const componentName ='));
				const sidebar = runInNewContext(source + 'componentGroups').filter((group: any) => group.label.zh !== '配置');
				expect(GROUPS.map(group => ({ label: group.label, names: [...group.names] }))).toEqual(sidebar.map((group: any) => ({
					label: group.label.zh,
					names: group.items.map((item: string) => item.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join(''))
				})));
				expect(MOBILE_COMPONENTS.has('Button')).toBe(false);
				expect(MOBILE_COMPONENTS.has('TimePicker')).toBe(false);
				expect([...MOBILE_ONLY].every(name => MOBILE_COMPONENTS.has(name))).toBe(true);
			});
		it('has exactly one compilable SFC per component without old group wrappers',
			() => {
				const directory = new URL('../examples/theme-audit/modules/', import.meta.url);
				const expected = [...GROUPS.flatMap(group => [...group.names]), 'Theme']
					.map(name => name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() + '.vue').sort();
				expect(readdirSync(directory).sort()).toEqual(expected);
				for (const filename of expected) {
					const text = readFileSync(new URL(filename, directory), 'utf8');
					const { descriptor, errors } = parse(text, { filename });
					expect(errors, filename).toEqual([]);
					expect(descriptor.template, filename).not.toBeNull();
					expect(descriptor.script, filename).toBeNull();
					expect(descriptor.scriptSetup, filename).not.toBeNull();
					expect(descriptor.template!.content, filename).not.toMatch(/(?:^|\s)style\s*=/);
					expect(() => compileScript(descriptor, { id: filename }), filename).not.toThrow();
					expect(compileTemplate({ id: filename, filename, source: descriptor.template!.content }).errors, filename).toEqual([]);
					expect(text, filename).not.toContain('PortalView');
					expect(text, filename).toContain('from \'@deot/vc\'');
					expect(text).not.toMatch(/(?:Control|Data|Display|Media|Feedback|Inherit)Samples/);
				}
			});
		it('maps validation to actual CSS property types',
			() => {
				expect(parameterProperty(find('color-primary'))).toBe('color');
				expect(parameterProperty(find('box-shadow'))).toBe('box-shadow');
				expect(parameterProperty(find('font-size-large'))).toBe('font-size');
				expect(parameterProperty(find('line-height-limit'))).toBe('line-height');
				expect(parameterProperty(find('border-radius'))).toBe('border-radius');
			});
	});

describe('Theme audit demo: BEM styles', () => {
	it('limits media previews without shrinking the component cards or stretching result images', () => {
		const css = sass.compile(new URL('../examples/theme-audit/style.scss', import.meta.url).pathname).css;
		const declarations = (selector: string) => css.slice(css.indexOf(`${selector} {`)).split('}')[0];
		expect(declarations('.audit-image-crop__workspace')).toContain('max-width: 360px');
		expect(declarations('.audit-carousel')).toContain('max-width: 480px');
		expect(declarations('.audit-image')).toContain('max-width: 360px');
		expect(declarations('.audit-result-image')).toContain('align-self: flex-start');
		expect(declarations('.audit-result-image')).toContain('max-width: min(100%, 360px)');
		expect(declarations('.audit-result-image')).toContain('height: auto');
		expect(declarations('.audit-card')).not.toContain('max-width:');
	});
	it('compiles the page stylesheet and preserves theme, grid and state selectors', () => {
		const stylesheet = new URL('../examples/theme-audit/style.scss', import.meta.url);
		const css = sass.compile(stylesheet.pathname).css;
		for (const selector of [
			'.theme-audit.is-dark', '.audit-panel__heading', '.audit-gallery__controls',
			'.audit-card.is-wide', '.audit-cards.is-masonry', '.audit-parameter.is-changed .audit-parameter__name',
			'.audit-carousel__image.is-card', '.audit-calendar .audit-calendar__date.is-disabled', '.audit-popup__content'
		]) expect(css).toContain(selector);
		expect(css).not.toMatch(/(?:varfix|tablevarfix)\(/);
	});
});

describe('Theme audit demo: changes and persistence',
	() => {
		it('edits shared values for both modes and paired values independently',
			() => {
				const changes = createChanges();
				setParameter(find('color-primary'),
					changes,
					'light',
					'#123456');
				setParameter(find('background-color-lightest'),
					changes,
					'dark',
					'#334455');
				expect(parameterValue(find('color-primary'),
					changes,
					'dark')).toBe('#123456');
				expect(parameterValue(find('background-color-lightest'),
					changes,
					'dark')).toBe('#334455');
				expect(parameterValue(find('background-color-lightest'),
					changes,
					'light')).toBe('#fff');
			});
		it('restores a single parameter without clearing other changes',
			() => {
				const changes = createChanges();
				setParameter(find('color-primary'),
					changes,
					'light',
					'#123456');
				setParameter(find('background-color-lightest'),
					changes,
					'light',
					'#abcdef');
				setParameter(find('background-color-lightest'),
					changes,
					'dark',
					'#334455');
				restoreParameter(find('background-color-lightest'),
					changes);
				expect(changes).toEqual({
					shared: { 'color-primary': '#123456' },
					light: {},
					dark: {}
				});
				setParameter(find('color-primary'),
					changes,
					'light',
					find('color-primary').light);
				expect(changes).toEqual(createChanges());
			});
		it.each([
			'', 'invalid', '#fff; color: red', 'var(--other)', 'url(x)',
			'color-mix(in srgb, red, blue)', 'currentColor', 'inherit'
		])('rejects unsafe or invalid value %s',
			(value) => {
				expect(validValue(find('color-primary'),
					value,
					supports)).toBe(false);
			});
		it('accepts concrete colors, transparent values, shadows and dimensions',
			() => {
				expect(validValue(find('color-primary'),
					'#123456',
					supports)).toBe(true);
				expect(validValue(find('color-mask'),
					'rgba(1, 2, 3, .4)',
					supports)).toBe(true);
				expect(validValue(find('box-shadow'),
					'0 2px 8px rgba(0, 0, 0, .2)',
					supports)).toBe(true);
				expect(validValue(find('font-size'),
					'16px',
					supports)).toBe(true);
			});
		it('merges only known, valid and correctly scoped saved values',
			() => {
				const saved = readSaved(JSON.stringify({
					mode: 'system',
					changes: {
						shared: {
							'color-primary': '#123456',
							'background-color-lightest': '#ff0000',
							'unknown-token': '#abc'
						},
						light: {
							'background-color-lightest': '#abcdef',
							'color-primary': '#000'
						},
						dark: { 'background-color-lightest': 'invalid' }
					}
				}),
				parameters,
				supports);
				expect(saved).toEqual({
					mode: 'system',
					changes: {
						shared: { 'color-primary': '#123456' },
						light: { 'background-color-lightest': '#abcdef' },
						dark: {}
					}
				});
			});
		it('recovers malformed storage and unsupported modes',
			() => {
				expect(readSaved('{broken',
					parameters,
					supports)).toEqual({
					mode: 'light',
					changes: createChanges()
				});
				expect(readSaved('null',
					parameters,
					supports)).toEqual({
					mode: 'light',
					changes: createChanges()
				});
				expect(readSaved('{"mode":"wrong"}',
					parameters,
					supports).mode).toBe('light');
			});
	});

describe('Theme audit demo: copy output',
	() => {
		it('compiles complete SCSS preserving maps and shared values',
			() => {
				const changes = createChanges();
				setParameter(find('color-primary'),
					changes,
					'light',
					'rgba(12, 34, 56, .7)');
				setParameter(find('background-color-lightest'),
					changes,
					'dark',
					'#334455');
				const output = exportScss(parameters,
					changes);
				expect(output).toContain('color-primary: rgba(12, 34, 56, .7),');
				expect(output).toContain('background-color-lightest: (light: #fff, dark: #334455),');
				expect([...output.matchAll(/^\t[a-z][a-z-]+:/gm)]).toHaveLength(50);
				expect(() => sass.compileString(output + '\n@use "sass:map"; .proof { color: map.get($theme, color-primary); }')).not.toThrow();
			});
		it('outputs all values with system and forced modes in the correct order',
			() => {
				const output = exportCss(parameters,
					createChanges());
				expect(output.startsWith(':root {')).toBe(true);
				expect(output).toContain('@media (prefers-color-scheme: dark)');
				expect(output.indexOf('[data-vc-theme="light"]')).toBeGreaterThan(output.indexOf('@media'));
				expect(output.indexOf('[data-vc-theme="dark"]')).toBeGreaterThan(output.indexOf('[data-vc-theme="light"]'));
				expect([...output.matchAll(/--vc-color-primary:/g)]).toHaveLength(4);
				expect([...output.matchAll(/--vc-[\w-]+:/g)]).toHaveLength(200);
			});
		it('isolates the live style to this page and leaves system mode available',
			() => {
				const output = exportCss(parameters,
					createChanges(),
					'body.vc-theme-audit-page');
				expect(output).toContain('body.vc-theme-audit-page:not([data-vc-theme])');
				expect(output).toContain('body.vc-theme-audit-page[data-vc-theme="dark"]');
				expect(output).not.toContain(':root');
			});
	});
