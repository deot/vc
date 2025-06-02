export interface UploadFile {
	uploadId: string;
	current: number;
	total: number;
	percent: number;
	// File
	size: number;
	name: string;
	target: File;
};
