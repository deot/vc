export class VcError {
	message?: string;
	
	constructor(target?: string, message?: any) {
		if (!message || !target) return;
		
		message = `[@deot/vc - ${target}]: ${message}`;
		this.message = message;

		/* istanbul ignore next -- @preserve */ 
		process.env.NODE_ENV === 'development' && console.error(message);
	}
}