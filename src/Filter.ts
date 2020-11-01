export abstract class Filter<T>
{
    public constructor()
    {

    }

    private _id : string;
    public get id() : string {
        return this._id;
    }
    public set id(v: string)
    {
        this._id = v;
    }

    private _type : string;
    public get type() : string {
        return this._type;
    }
    public set type(v: string)
    {
        this._type = v;
    }

}
