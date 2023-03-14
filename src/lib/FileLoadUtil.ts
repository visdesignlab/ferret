export type CallbackFunction = (data: ArrayBuffer, filename: string) => void;

export class FileLoadUtil {
    constructor(fileLoadCallback: CallbackFunction) {
        this.FileLoadCallback = fileLoadCallback;
    }

    private _FileLoadCallback: CallbackFunction;
    public get FileLoadCallback(): CallbackFunction {
        return this._FileLoadCallback;
    }
    public set FileLoadCallback(v: CallbackFunction) {
        this._FileLoadCallback = v;
    }

    public OpenFile(event: Event): any {
        const input = event.target as HTMLInputElement;
        const inputFile: File = input.files[0];
        const filename: string = inputFile.name;

        let reader: FileReader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                throw 'Warning: this should be parsed as a ArrayBuffer, not a string';
            }
            let data: ArrayBuffer = reader.result;
            this.parseArrayBuffer(data, filename);
        };
        reader.readAsArrayBuffer(inputFile);
    }

    private parseArrayBuffer(data: ArrayBuffer, filename: string): void {
        this.FileLoadCallback(data, filename);
    }
}
