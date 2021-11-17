import { Column, IDataRow, IColumnDesc, ILinkColumnDesc, IValueColumnDesc, INumberColumnDesc, ValueColumn } from 'lineupjs';

interface FerretFilter {
  local: Set<number>,
  global: Set<number>
}

export default class FerretColumn extends ValueColumn<number> {
  static readonly EVENT_FILTER_CHANGED = 'filterChanged';
  
  private _currentFilter : FerretFilter = {
    local: new Set<number>(),
    global: new Set<number>()
  }
  public get currentFilter() : FerretFilter {
    return this._currentFilter;
  }

  protected createEventList() {
    return super
      .createEventList()
      .concat([
        FerretColumn.EVENT_FILTER_CHANGED
      ]);
  }

  public getValue(row: IDataRow): number {
    return this.getRaw(row);
  }

  public getRaw(row: IDataRow): number {
    return row.v[(this.desc as any).column];
  }

  public getNumber(row: IDataRow): number {
    return this.getRaw(row);
  }


  public isFiltered(): boolean {
    return this.currentFilter.local.size > 0 || this.currentFilter.global.size > 0;
  }

  public getFilter(): FerretFilter {
    let local =  new Set([...this.currentFilter.local]);
    let global =  new Set([...this.currentFilter.global]);
    return {local: local, global: global};
  }


  public addValueFilter(value: number, type: 'local' | 'global')
  {
    const lastFilter = this.getFilter();
    switch (type)
    {
      case 'local':
        this.currentFilter.local.add(value);
        break;
        case 'global':
        this.currentFilter.global.add(value);
        break;
    }

    this.triggerEvent(lastFilter);
  }

  public triggerEvent(oldFilter: FerretFilter): void
  {
    this.fire(
      [FerretColumn.EVENT_FILTER_CHANGED, Column.EVENT_DIRTY_VALUES, Column.EVENT_DIRTY],
      oldFilter,
      this.getFilter()
    );
  }

  // setFilter(index: number | null) {
  //   console.log('inside setFilter')
  //   if (index === null)
  //   {
  //     return;
  //   }

  //   const lastFilter = this.getFilter();
  //   this.currentFilter = !this.currentFilter;
  //   this.fire(
  //     [FerretColumn.EVENT_FILTER_CHANGED, Column.EVENT_DIRTY_VALUES, Column.EVENT_DIRTY],
  //     lastFilter,
  //     this.getFilter()
  //   );
  // }

  /**
   * filter the current row if any filter is set
   * @param row
   * @returns {boolean}
   */
  filter(row: IDataRow) {
    const thisValue = this.getValue(row);
    if (this.currentFilter.local.has(thisValue))
    {
      return false;
    }
    for (let key in row.v)
    {
      let value = row.v[key];
      if (this.currentFilter.global.has(value))
      {
        return false;
      }
    }
    return true;
  }

  clearFilter() {
    const was = this.isFiltered();

    const lastFilter = this.getFilter();
    this.currentFilter.local.clear();
    this.currentFilter.global.clear();
    this.triggerEvent(lastFilter);

    return was;
  }

}