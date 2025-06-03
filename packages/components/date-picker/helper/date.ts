const TOKEN_REGEX = /d{1,4}|M{1,4}|YY(?:YY)?|S{1,3}|Do|ZZ|([HhMsDm])\1?|[aA]|"[^"]*"|'[^']*'/g;
const TWO_DIGITS_REGEX = /\d\d?/;
const THREE_DIGITS_REGEX = /\d{3}/;
const FOUR_DIGITS_REGEX = /\d{4}/;

const WORD_REGEX = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;

/**
 * time-picker & date-picker 日期格式化工具
 */
class DateUtilManager {
	i18n: any;
	masks: any;
	format: any;
	formatFlags: any;
	parse: any;
	parseFlags: any;

	constructor() {
		this._createI18n();
		this._createMasks();
		this._createFormat();
		this._createParse();
	}

	_createI18n() {
		const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		const monthNamesShort = this.shorten(monthNames, 3);
		const dayNamesShort = this.shorten(dayNames, 3);
		this.i18n = {
			dayNamesShort,
			dayNames,
			monthNamesShort,
			monthNames,
			amPm: ['am', 'pm'],
			DoFn: (D: number) => {
				// 原来的：return D + ['th', 'st', 'nd', 'rd'][D % 10 > 3 ? 0 : (D - D % 10 !== 10) * D % 10];
				return D + ['th', 'st', 'nd', 'rd'][D % 10 > 3 ? 0 : ((D - +((D % 10) !== 10)) * D) % 10];
			}
		};
	}

	_createMasks() {
		this.masks = {
			default: 'ddd MMM dd YYYY HH:mm:ss',
			shortDate: 'M/D/YY',
			mediumDate: 'MMM d, YYYY',
			longDate: 'MMMM d, YYYY',
			fullDate: 'dddd, MMMM d, YYYY',
			shortTime: 'HH:mm',
			mediumTime: 'HH:mm:ss',
			longTime: 'HH:mm:ss.SSS'
		};
	}

	_createFormat() {
		this._initFormatFlags();
		this.format = (dateObj: Date | number, mask: string, i18nSettings: any) => {
			const i18n = i18nSettings || this.i18n;

			if (typeof dateObj === 'number') {
				dateObj = new Date(dateObj);
			}

			if (Object.prototype.toString.call(dateObj) !== '[object Date]' || isNaN(dateObj.getTime())) {
				throw new Error('Invalid Date in fecha.format');
			}

			mask = this.masks[mask] || mask || this.masks.default;

			return mask.replace(TOKEN_REGEX, ($0) => {
				return $0 in this.formatFlags ? this.formatFlags[$0](dateObj, i18n) : $0.slice(1, $0.length - 1);
			});
		};
	}

	_createParse() {
		this._initParseFlags();
		this.parse = (dateStr: any, format: any, i18nSettings: any) => {
			const i18n = i18nSettings || this.i18n;

			if (typeof format !== 'string') {
				throw new Error('Invalid format in this.parse');
			}

			format = this.masks[format] || format;

			// Avoid regular expression denial of service, fail early for really long strings
			// https://www.owasp.org/index.php/Regular_expression_Denial_of_Service_-_ReDoS
			if (dateStr.length > 1000) {
				return false;
			}

			let isValid = true;
			const dateInfo: any = {};
			format.replace(TOKEN_REGEX, ($0: any) => {
				if (this.parseFlags[$0]) {
					const info = this.parseFlags[$0];
					const index = dateStr.search(info[0]);
					if (!~index) {
						isValid = false;
					} else {
						dateStr.replace(info[0], (result: any) => {
							info[1](dateInfo, result, i18n);
							dateStr = dateStr.substr(index + result.length);
							return result;
						});
					}
				}

				return this.parseFlags[$0] ? '' : $0.slice(1, $0.length - 1);
			});

			if (!isValid) {
				return false;
			}

			const today = new Date();
			if (dateInfo.isPm === true && dateInfo.hour != null && +dateInfo.hour !== 12) {
				dateInfo.hour = +dateInfo.hour + 12;
			} else if (dateInfo.isPm === false && +dateInfo.hour === 12) {
				dateInfo.hour = 0;
			}

			let date: any;
			if (dateInfo.timezoneOffset != null) {
				dateInfo.minute = +(dateInfo.minute || 0) - +dateInfo.timezoneOffset;
				date = new Date(Date.UTC(dateInfo.year || today.getFullYear(), dateInfo.month || 0, dateInfo.day || 1,
					dateInfo.hour || 0, dateInfo.minute || 0, dateInfo.second || 0, dateInfo.millisecond || 0));
			} else {
				date = new Date(dateInfo.year || today.getFullYear(), dateInfo.month || 0, dateInfo.day || 1,
					dateInfo.hour || 0, dateInfo.minute || 0, dateInfo.second || 0, dateInfo.millisecond || 0);
			}
			return date;
		};
	}

	_initFormatFlags() {
		this.formatFlags = {
			Do: (dateObj: Date, i18n: any) => {
				return i18n.DoFn(dateObj.getDate());
			},
			D: (dateObj: Date) => {
				return dateObj.getDate();
			},
			DD: (dateObj: Date) => {
				return this.pad(dateObj.getDate());
			},
			DDD: (dateObj: Date, i18n: any) => {
				return i18n.dayNamesShort[dateObj.getDay()];
			},
			DDDD: (dateObj: Date, i18n: any) => {
				return i18n.dayNames[dateObj.getDay()];
			},
			M: (dateObj: Date) => {
				return dateObj.getMonth() + 1;
			},
			MM: (dateObj: Date) => {
				return this.pad(dateObj.getMonth() + 1);
			},
			MMM: (dateObj: Date, i18n: any) => {
				return i18n.monthNamesShort[dateObj.getMonth()];
			},
			MMMM: (dateObj: Date, i18n: any) => {
				return i18n.monthNames[dateObj.getMonth()];
			},
			YY: (dateObj: Date) => {
				return String(dateObj.getFullYear()).substr(2);
			},
			YYYY: (dateObj: Date) => {
				return dateObj.getFullYear();
			},
			h: (dateObj: Date) => {
				return dateObj.getHours() % 12 || 12;
			},
			hh: (dateObj: Date) => {
				return this.pad(dateObj.getHours() % 12 || 12);
			},
			H: (dateObj: Date) => {
				return dateObj.getHours();
			},
			HH: (dateObj: Date) => {
				return this.pad(dateObj.getHours());
			},
			m: (dateObj: Date) => {
				return dateObj.getMinutes();
			},
			mm: (dateObj: Date) => {
				return this.pad(dateObj.getMinutes());
			},
			s: (dateObj: Date) => {
				return dateObj.getSeconds();
			},
			ss: (dateObj: Date) => {
				return this.pad(dateObj.getSeconds());
			},
			S: (dateObj: Date) => {
				return Math.round(dateObj.getMilliseconds() / 100);
			},
			SS: (dateObj: Date) => {
				return this.pad(Math.round(dateObj.getMilliseconds() / 10), 2);
			},
			SSS: (dateObj: Date) => {
				return this.pad(dateObj.getMilliseconds(), 3);
			},
			a: (dateObj: Date, i18n: any) => {
				return dateObj.getHours() < 12 ? i18n.amPm[0] : i18n.amPm[1];
			},
			A: (dateObj: Date, i18n: any) => {
				return dateObj.getHours() < 12 ? i18n.amPm[0].toUpperCase() : i18n.amPm[1].toUpperCase();
			},
			ZZ: (dateObj: Date) => {
				const o = dateObj.getTimezoneOffset();
				// 原来的： return (o > 0 ? '-' : '+') + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4);
				return (o > 0 ? '-' : '+') + this.pad(Math.floor(Math.abs(o) / 60) * 100 + (Math.abs(o) % 60), 4);
			}
		};
	}

	_initParseFlags() {
		this.parseFlags = {
			d: [TWO_DIGITS_REGEX, (d: any, v: any) => {
				d.day = v;
			}],
			M: [TWO_DIGITS_REGEX, (d: any, v: any) => {
				d.month = v - 1;
			}],
			YY: [TWO_DIGITS_REGEX, (d: any, v: any) => {
				const da = new Date();
				const cent = +('' + da.getFullYear()).substr(0, 2);
				d.year = '' + (v > 68 ? cent - 1 : cent) + v;
			}],
			h: [TWO_DIGITS_REGEX, (d: any, v: any) => {
				d.hour = v;
			}],
			m: [TWO_DIGITS_REGEX, (d: any, v: any) => {
				d.minute = v;
			}],
			s: [TWO_DIGITS_REGEX, (d: any, v: any) => {
				d.second = v;
			}],
			YYYY: [FOUR_DIGITS_REGEX, (d: any, v: any) => {
				d.year = v;
			}],
			S: [/\d/, (d: any, v: any) => {
				d.millisecond = v * 100;
			}],
			SS: [/\d{2}/, (d: any, v: any) => {
				d.millisecond = v * 10;
			}],
			SSS: [THREE_DIGITS_REGEX, (d: any, v: any) => {
				d.millisecond = v;
			}],
			D: [TWO_DIGITS_REGEX, this.noop],
			ddd: [WORD_REGEX, this.noop],
			MMM: [WORD_REGEX, this.monthUpdate('monthNamesShort')],
			MMMM: [WORD_REGEX, this.monthUpdate('monthNames')],
			a: [WORD_REGEX, (d: any, v: any, i18n: any) => {
				const val = v.toLowerCase();
				if (val === i18n.amPm[0]) {
					d.isPm = false;
				} else if (val === i18n.amPm[1]) {
					d.isPm = true;
				}
			}],
			/* eslint-disable */
			ZZ: [/[\+\-]\d\d:?\d\d/, (d: any, v: any) => {
				let parts = (v + '').match(/([\+\-]|\d\d)/gi);
			    let minutes: any;
    
				if (parts) {
					minutes = +((parts[1] as any) * 60) + parseInt(parts[2], 10);
					d.timezoneOffset = parts[0] === '+' ? minutes : -minutes;
				}
            }]
            /* eslint-enable */
		};
		this.parseFlags.DD = this.parseFlags.d;
		this.parseFlags.dddd = this.parseFlags.ddd;

		this.parseFlags.Do = this.parseFlags.dd = this.parseFlags.d;
		this.parseFlags.mm = this.parseFlags.m;

		this.parseFlags.hh = this.parseFlags.H = this.parseFlags.HH = this.parseFlags.h;
		this.parseFlags.MM = this.parseFlags.M;
		this.parseFlags.ss = this.parseFlags.s;
		this.parseFlags.A = this.parseFlags.a;
	}

	noop() {}

	shorten(arr: string[], sLen: number) {
		const newArr: string[] = [];
		for (let i = 0, len = arr.length; i < len; i++) {
			newArr.push(arr[i].substr(0, sLen));
		}
		return newArr;
	}

	monthUpdate(arrName: string) {
		return (d: any, v: string, i18n: any) => {
			const index = i18n[arrName].indexOf(v.charAt(0).toUpperCase() + v.substr(1).toLowerCase());
			if (~index) {
				d.month = index;
			}
		};
	}

	pad(val: number | string, len?: number) {
		val = String(val);
		len = len || 2;
		while (val.length < len) {
			val = '0' + val;
		}
		return val;
	}
}

export const DateUtil = new DateUtilManager();
