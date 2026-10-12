import { configure } from '@deot/dev-eslint';

// 组件源码中的 HTML 统一经由 Customer 写入：只有它会经过全局的 sanitize
const HTML_SINKS = [
	// JSX 属性
	'JSXAttribute[name.name=/^(innerHTML|v-html|vHtml|srcdoc)$/]',
	// h(tag, { innerHTML }) / { '.innerHTML': … }
	'Property[key.name=/^(innerHTML|srcdoc)$/]',
	'Property[key.value=/(^|[.^])(innerHTML|srcdoc)$/]',
	// el.innerHTML = … / el['outerHTML'] = …
	'AssignmentExpression[left.property.name=/^(innerHTML|outerHTML|srcdoc)$/]',
	'AssignmentExpression[left.property.value=/^(innerHTML|outerHTML|srcdoc)$/]',
	// 其它把字符串解析成 HTML 的方法
	'CallExpression[callee.property.name=/^(insertAdjacentHTML|createContextualFragment|setHTMLUnsafe)$/]',
	'CallExpression[callee.object.name=\'document\'][callee.property.name=/^(write|writeln)$/]',
	'CallExpression[callee.name=\'createStaticVNode\']'
];

export default configure(
	{},
	{
		files: ['packages/components/**/*.{ts,tsx}'],
		ignores: [
			'**/__tests__/**',
			'**/examples/**',
			'packages/components/customer/customer.ts'
		],
		rules: {
			'no-restricted-syntax': [
				'error',
				{
					selector: HTML_SINKS.join(', '),
					message: '组件内不要直接写入 HTML，请使用 Customer（packages/components/customer）'
				}
			]
		}
	}
);
