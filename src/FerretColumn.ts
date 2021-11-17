import { Column, IDataRow, IColumnDesc, ILinkColumnDesc, IValueColumnDesc, INumberColumnDesc, ValueColumn } from 'lineupjs';

export default class FerretColumn extends ValueColumn<number> {
  static readonly EVENT_FILTER_CHANGED = 'filterChanged';
  
  private _currentFilter : Set<number> = new Set<number>();
  public get currentFilter() : Set<number> {
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


  isFiltered() {
    return this.currentFilter.size > 0;
  }

  getFilter() {
    return new Set([...this.currentFilter]);
  }


  public addValueFilter(value: number, type: 'local' | 'global')
  {
    const lastFilter = this.getFilter();
    this.currentFilter.add(value);
    this.triggerEvent(lastFilter);
  }

  public triggerEvent(oldFilter: Set<number>): void
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
    return !this.currentFilter.has(this.getValue(row));
  }

  clearFilter() {
    const was = this.isFiltered();

    const lastFilter = this.getFilter();
    this.currentFilter.clear();
    this.triggerEvent(lastFilter);

    return was;
  }

}