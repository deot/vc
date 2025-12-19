type SeparatedOptions = {
	separator: string;
	decimal: string;
};
export const separated2value = (value: string | number, options: SeparatedOptions) => {
	if (typeof value === 'number' || typeof value !== 'string') return value;
	const escapeRegExp = (s: string) => s.replace(/([.,'  ])/g, '\\$1');
	const sep = escapeRegExp(options.separator);
	const dec = escapeRegExp(options.decimal);
	const num = (value || '').replace(new RegExp(sep, 'g'), '').replace(new RegExp(dec, 'g'), '.');
	return parseFloat(num);
};

type ValueOptions = {
	precision: number;
	decimal: string;
	separator: string;
	zeroless?: boolean;
	numerals?: string[];
};
export const value2separated = (value: string | number, options: ValueOptions) => {
	const num = typeof value === 'number' ? value : parseFloat(value);
	if (value === '' || Number.isNaN(num)) {
		return {
			negative: '',
			integer: '',
			decimal: '',
			separated: '',
			float: '',
			value: ''
		};
	};
	const negative = (num < 0) ? '-' : '';

	let [integer, decimal = ''] = `${Math.abs(num)}`.split('.');
	let separated = integer;
	if (options.separator) {
		let v = '';
		let j = 0;
		const factor = 3;
		for (let i = 0, len = separated.length; i < len; ++i) {
			if (i !== 0 && (j % factor) === 0) {
				v = options.separator + v;
			}
			j++;
			v = separated[len - i - 1] + v;
		}
		separated = v;
	}

	const precision$ = options.zeroless ? Math.min(options.precision, decimal.length) : options.precision;
	if (precision$) {
		decimal = decimal.slice(0, precision$).padEnd(precision$, '0');
	} else {
		decimal = '';
	}

	if (options?.numerals?.length) {
		separated = separated.replace(/[0-9]/g, w => options.numerals![+w]);
		decimal = decimal.replace(/[0-9]/g, w => options.numerals![+w]);
	}

	const _decimal = decimal ? options.decimal + decimal : '';
	return {
		negative,
		integer,
		decimal,
		separated,
		float: `${negative}${integer}${_decimal}`,
		value: `${negative}${separated}${_decimal}`
	};
};
