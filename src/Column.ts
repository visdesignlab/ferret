export type ColumnTypes = 'Number' | 'Label' | 'Mixed' | 'Categorical';

export abstract class Column<T> {
    public constructor() {
        this._values = [];
        this._visible = true;
    }

    private _id: string;
    public get id(): string {
        return this._id;
    }
    public set id(v: string) {
        this._id = v;
    }

    protected _values: T[];
    public get values(): T[] {
        return this._values;
    }

    protected _type: ColumnTypes;
    public get type(): ColumnTypes {
        return this._type;
    }

    public get length(): number {
        return this._values.length;
    }

    protected _visible: Boolean;
    public get visible(): Boolean {
        return this._visible;
    }

    public set visible(visible: Boolean) {
        this._visible = visible;
    }

    protected _position: number;
    public get position(): number {
        return this._position;
    }

    public set position(position: number) {
        this._position = position;
    }
}
