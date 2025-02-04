import { EventAggregator } from 'aurelia-event-aggregator';
import {
  BackendService,
  Column,
  ColumnSort,
  CurrentSorter,
  GridOption,
  SlickEventHandler,
  SortChangedArgs,
  FieldType,
  EmitterType,
} from '../../models';
import { Sorters } from '../../sorters';
import { SortService } from '../sort.service';

declare var Slick: any;

const gridOptionMock = {
  enablePagination: true,
  backendServiceApi: {
    service: undefined,
    preProcess: jest.fn(),
    process: jest.fn(),
    postProcess: jest.fn(),
  }
} as GridOption;

const dataViewStub = {
  refresh: jest.fn(),
  sort: jest.fn(),
  reSort: jest.fn(),
};

const backendServiceStub = {
  clearSorters: jest.fn(),
  getCurrentFilters: jest.fn(),
  getCurrentPagination: jest.fn(),
  getCurrentSorters: jest.fn(),
  processOnSortChanged: (event: Event, args: SortChangedArgs) => 'backend query',
} as unknown as BackendService;

const gridStub = {
  autosizeColumns: jest.fn(),
  getColumnIndex: jest.fn(),
  getOptions: () => gridOptionMock,
  getColumns: jest.fn(),
  getSortColumns: jest.fn(),
  invalidate: jest.fn(),
  onLocalSortChanged: jest.fn(),
  onSort: new Slick.Event(),
  render: jest.fn(),
  setSortColumns: jest.fn(),
};

describe('SortService', () => {
  let service: SortService;
  let slickgridEventHandler: SlickEventHandler;
  let ea: EventAggregator;

  beforeEach(() => {
    ea = new EventAggregator();
    service = new SortService(ea);
    slickgridEventHandler = service.eventHandler;
  });

  afterEach(() => {
    delete gridOptionMock.backendServiceApi;
    jest.clearAllMocks();
    service.dispose();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  it('should dispose of the event handler', () => {
    const spy = jest.spyOn(slickgridEventHandler, 'unsubscribeAll');
    service.dispose();
    expect(spy).toHaveBeenCalled();
  });

  describe('clearSorting method', () => {
    let mockSortedCol: ColumnSort;
    const mockColumns = [{ id: 'lastName', field: 'lastName' }, { id: 'firstName', field: 'firstName' }] as Column[];

    beforeEach(() => {
      mockSortedCol = { sortCol: { id: 'lastName', field: 'lastName', width: 100 }, sortAsc: true, grid: gridStub };
      gridOptionMock.backendServiceApi = {
        service: backendServiceStub,
        process: () => new Promise((resolve) => resolve(jest.fn()))
      };
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    });

    it('should clear the backend sorting by triggering a query event when method argument is undefined (default to true)', () => {
      const eaSpy = jest.spyOn(ea, 'publish');
      const spySetColumns = jest.spyOn(gridStub, 'setSortColumns');
      const spySortChanged = jest.spyOn(service, 'onBackendSortChanged');

      service.bindBackendOnSort(gridStub, dataViewStub);
      gridStub.onSort.notify(mockSortedCol, new Slick.EventData(), gridStub);
      service.clearSorting();

      expect(spySetColumns).toHaveBeenCalledWith([]);
      expect(spySortChanged).toHaveBeenCalled();
      expect(eaSpy).toHaveBeenCalledWith(`sortService:sortCleared`, true);
    });

    it('should clear the local sorting by triggering a query event when method argument is undefined (default to true)', () => {
      const eaSpy = jest.spyOn(ea, 'publish');
      const spySetColumns = jest.spyOn(gridStub, 'setSortColumns');
      const spySortChanged = jest.spyOn(service, 'onLocalSortChanged');

      service.bindLocalOnSort(gridStub, dataViewStub);
      gridStub.onSort.notify(mockSortedCol, new Slick.EventData(), gridStub);
      service.clearSorting();

      expect(eaSpy).toHaveBeenCalledWith(`sortService:sortCleared`, true);
      expect(spySortChanged).toHaveBeenCalled();
      expect(spySetColumns).toHaveBeenCalledWith([]);
      expect(service.getCurrentLocalSorters()).toEqual([]);
    });

    it('should clear the backend sorting without triggering a query event when method argument is set to false', () => {
      const eaSpy = jest.spyOn(ea, 'publish');
      const spySetColumns = jest.spyOn(gridStub, 'setSortColumns');
      const spyClearSorters = jest.spyOn(backendServiceStub, 'clearSorters');

      service.bindBackendOnSort(gridStub, dataViewStub);
      gridStub.onSort.notify(mockSortedCol, new Slick.EventData(), gridStub);
      service.clearSorting(false);

      expect(eaSpy).toHaveBeenCalledWith(`sortService:sortCleared`, true);
      expect(spyClearSorters).toHaveBeenCalled();
      expect(spySetColumns).toHaveBeenCalledWith([]);
    });

    it('should clear the local sorting without triggering a query event when method argument is set to false', () => {
      const eaSpy = jest.spyOn(ea, 'publish');
      const spySetColumns = jest.spyOn(gridStub, 'setSortColumns');

      service.bindLocalOnSort(gridStub, dataViewStub);
      gridStub.onSort.notify(mockSortedCol, new Slick.EventData(), gridStub);
      service.clearSorting(false);

      expect(eaSpy).toHaveBeenCalledWith(`sortService:sortCleared`, true);
      expect(spySetColumns).toHaveBeenCalledWith([]);
      expect(service.getCurrentLocalSorters()).toEqual([]);
    });
  });

  describe('bindBackendOnSort method', () => {
    beforeEach(() => {
      gridOptionMock.backendServiceApi = {
        service: backendServiceStub,
        process: () => new Promise((resolve) => resolve(jest.fn()))
      };
    });

    it('should call "onBackendSortChanged" when "onSort" event triggered', () => {
      const spy = jest.spyOn(service, 'onBackendSortChanged');

      service.bindBackendOnSort(gridStub, dataViewStub);
      gridStub.onSort.notify({ multiColumnSort: true, sortCols: [], grid: gridStub }, new Slick.EventData(), gridStub);

      expect(spy).toHaveBeenCalledWith(expect.anything(), { grid: gridStub, multiColumnSort: true, sortCols: [] });
    });
  });

  describe('bindLocalOnSort method', () => {
    it('should bind to "onLocalSortChanged" and expect some events being triggered when a single sort is called', () => {
      const eaSpy = jest.spyOn(ea, 'publish');
      const spyCurrentSort = jest.spyOn(service, 'getCurrentLocalSorters');
      const spyOnLocalSort = jest.spyOn(service, 'onLocalSortChanged');
      const mockSortedCol = { sortCol: { id: 'lastName', field: 'lastName', width: 100 }, sortAsc: true } as ColumnSort;

      service.bindLocalOnSort(gridStub, dataViewStub);
      gridStub.onSort.notify(mockSortedCol, new Slick.EventData(), gridStub);

      expect(spyCurrentSort).toHaveBeenCalled();
      expect(eaSpy).toHaveBeenCalledWith(`sortService:sortChanged`, [{ columnId: 'lastName', direction: 'ASC' }]);
      expect(spyOnLocalSort).toHaveBeenCalledWith(gridStub, dataViewStub, [mockSortedCol]);
    });

    it('should bind to "onLocalSortChanged" and expect some events being triggered when "multiColumnSort" is enabled and multiple sorts are called', () => {
      const eaSpy = jest.spyOn(ea, 'publish');
      const spyCurrentSort = jest.spyOn(service, 'getCurrentLocalSorters');
      const spyOnLocalSort = jest.spyOn(service, 'onLocalSortChanged');
      const mockSortedCols: ColumnSort[] = [
        { sortAsc: true, sortCol: { id: 'lastName', field: 'lastName', width: 100 } },
        { sortAsc: false, sortCol: { id: 'firstName', field: 'firstName', width: 75 } }
      ];

      service.bindLocalOnSort(gridStub, dataViewStub);
      gridStub.onSort.notify({ multiColumnSort: true, sortCols: mockSortedCols, grid: gridStub }, new Slick.EventData(), gridStub);

      expect(spyCurrentSort).toHaveBeenCalled();
      expect(eaSpy).toHaveBeenCalledWith(`sortService:sortChanged`, [{ columnId: 'lastName', direction: 'ASC' }, { columnId: 'firstName', direction: 'DESC' }]);
      expect(spyOnLocalSort).toHaveBeenCalledWith(gridStub, dataViewStub, mockSortedCols);
    });
  });

  describe('bindBackendOnSort & onBackendSortChanged methods', () => {
    const spyProcess = jest.fn();
    const spyPreProcess = jest.fn();
    const spyPostProcess = jest.fn();

    beforeEach(() => {
      gridOptionMock.backendServiceApi = {
        service: backendServiceStub,
        preProcess: spyPreProcess,
        postProcess: spyPostProcess,
        process: () => new Promise((resolve) => resolve(spyProcess))
      };
    });

    it('should expect some events being triggered when a single sort is called', () => {
      const mockColumn = { id: 'lastName', field: 'lastName', width: 100 } as Column;
      const expectedSortCol = { columnId: 'lastName', direction: 'ASC' } as CurrentSorter;
      const eaSpy = jest.spyOn(ea, 'publish');
      const spyBackendCurrentSort = jest.spyOn(gridOptionMock.backendServiceApi.service, 'getCurrentSorters').mockReturnValue([expectedSortCol]);
      const spyBackendProcessSort = jest.spyOn(gridOptionMock.backendServiceApi.service, 'processOnSortChanged').mockReturnValue('backend query');
      const mockSortedCol = { sortCol: mockColumn, sortAsc: true, grid: gridStub } as ColumnSort;

      service.bindBackendOnSort(gridStub, dataViewStub);
      gridStub.onSort.notify(mockSortedCol, new Slick.EventData(), gridStub);

      expect(spyBackendCurrentSort).toHaveBeenCalled();
      expect(spyBackendProcessSort).toHaveBeenCalled();
      expect(spyPreProcess).toHaveBeenCalled();
      expect(eaSpy).toHaveBeenCalledWith(`sortService:sortChanged`, [expectedSortCol]);
    });

    it('should expect some events being triggered when "multiColumnSort" is enabled and multiple sorts are called', () => {
      const expectedSortCols = [{ columnId: 'lastName', direction: 'ASC' }, { columnId: 'firstName', direction: 'DESC' }] as CurrentSorter[];
      const eaSpy = jest.spyOn(ea, 'publish');
      const spyBackendCurrentSort = jest.spyOn(gridOptionMock.backendServiceApi.service, 'getCurrentSorters').mockReturnValue(expectedSortCols);
      const spyBackendProcessSort = jest.spyOn(gridOptionMock.backendServiceApi.service, 'processOnSortChanged').mockReturnValue('backend query');
      const mockSortedCols: ColumnSort[] = [
        { sortAsc: true, sortCol: { id: 'lastName', field: 'lastName', width: 100 } },
        { sortAsc: false, sortCol: { id: 'firstName', field: 'firstName', width: 75 } }
      ];

      service.bindBackendOnSort(gridStub, dataViewStub);
      gridStub.onSort.notify({ multiColumnSort: true, sortCols: mockSortedCols, grid: gridStub }, new Slick.EventData(), gridStub);

      expect(spyBackendCurrentSort).toHaveBeenCalled();
      expect(spyBackendProcessSort).toHaveBeenCalled();
      expect(spyPreProcess).toHaveBeenCalled();
      expect(eaSpy).toHaveBeenCalledWith(`sortService:sortChanged`, expectedSortCols);
    });
  });

  describe('emitSortChanged method', () => {
    it('should have same current sort changed when it is passed as argument to the emitSortChanged method', () => {
      const localSorterMock = { columnId: 'field1', direction: 'DESC' } as CurrentSorter;
      const eaSpy = jest.spyOn(ea, 'publish');

      service.emitSortChanged(EmitterType.local, [localSorterMock]);
      const currentLocalSorters = service.getCurrentLocalSorters();

      expect(currentLocalSorters).toEqual([localSorterMock]);
      expect(eaSpy).toHaveBeenCalledWith(`sortService:sortChanged`, currentLocalSorters);
    });
  });

  describe('onBackendSortChanged method', () => {
    const spyProcess = jest.fn();
    const spyPreProcess = jest.fn();
    const spyPostProcess = jest.fn();

    beforeEach(() => {
      gridOptionMock.backendServiceApi = {
        service: backendServiceStub,
        preProcess: spyPreProcess,
        postProcess: spyPostProcess,
        process: undefined
      };
      gridStub.getOptions = () => gridOptionMock;
    });

    it('should throw an error when not passing a grid in the args', () => {
      expect(() => service.onBackendSortChanged(undefined, undefined)).toThrowError('Something went wrong when trying to bind the "onBackendSortChanged(event, args)" function');
    });

    it('should throw an error when backend service is missing', () => {
      gridOptionMock.backendServiceApi.service = undefined;
      service.bindBackendOnSort(gridStub, dataViewStub);
      expect(() => service.onBackendSortChanged(undefined, { grid: gridStub })).toThrowError('BackendServiceApi requires at least a "process" function and a "service" defined');
    });

    it('should throw an error when backend "process" method is missing', () => {
      gridOptionMock.backendServiceApi.process = undefined;
      service.bindBackendOnSort(gridStub, dataViewStub);
      expect(() => service.onBackendSortChanged(undefined, { grid: gridStub })).toThrowError('BackendServiceApi requires at least a "process" function and a "service" defined');
    });

    it('should use an empty grid option object when grid "getOptions" method is not available', () => {
      gridStub.getOptions = undefined;

      service.bindBackendOnSort(gridStub, dataViewStub);
      expect(() => service.onBackendSortChanged(undefined, { grid: gridStub })).toThrowError('BackendServiceApi requires at least a "process" function and a "service" defined');
    });

    it('should execute the "onError" method when the Promise throws an error', (done) => {
      const errorExpected = 'promise error';
      gridOptionMock.backendServiceApi.process = () => Promise.reject(errorExpected);
      gridOptionMock.backendServiceApi.onError = (e) => jest.fn();
      const spyOnError = jest.spyOn(gridOptionMock.backendServiceApi, 'onError');

      jest.spyOn(gridOptionMock.backendServiceApi, 'process');

      service.bindBackendOnSort(gridStub, dataViewStub);
      service.onBackendSortChanged(undefined, { multiColumnSort: true, sortCols: [], grid: gridStub });

      setTimeout(() => {
        expect(spyOnError).toHaveBeenCalledWith(errorExpected);
        done();
      });
    });
  });

  describe('getCurrentColumnSorts method', () => {
    let mockSortedCol: ColumnSort;
    const mockColumns = [{ id: 'firstName', field: 'firstName' }, { id: 'lastName', field: 'lastName' }] as Column[];

    beforeEach(() => {
      mockSortedCol = { sortCol: { id: 'lastName', field: 'lastName', width: 100 }, sortAsc: true, grid: gridStub };
      gridStub.getColumns = jest.fn();
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    });

    it('should return an empty array when there is no grid object', () => {
      jest.spyOn(gridStub, 'getSortColumns').mockReturnValue([]);

      const columnSorts = service.getCurrentColumnSorts();

      expect(columnSorts).toEqual([]);
    });

    it('should return an empty array when there is not current sorting', () => {
      jest.spyOn(gridStub, 'getSortColumns').mockReturnValue([]);

      service.bindLocalOnSort(gridStub, dataViewStub);
      const columnSorts = service.getCurrentColumnSorts();

      expect(columnSorts).toEqual([]);
    });

    it('should return all current column sorts with their "sortCol" property', () => {
      const mockSortCols = [{ columnId: 'firstName', sortAsc: true }];
      jest.spyOn(gridStub, 'getSortColumns').mockReturnValue(mockSortCols);
      jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(0);

      service.bindLocalOnSort(gridStub, dataViewStub);
      const columnSorts = service.getCurrentColumnSorts();

      expect(columnSorts).toEqual([{ sortCol: { id: 'firstName', field: 'firstName' }, sortAsc: true }]);
    });

    it('should return the second sorted column without the first column since it was an exclusion', () => {
      const mockSortCols = [{ columnId: 'firstName', sortAsc: true }, { columnId: 'lastName', sortAsc: false }];
      jest.spyOn(gridStub, 'getSortColumns').mockReturnValue(mockSortCols);
      jest.spyOn(gridStub, 'getColumnIndex').mockReturnValue(1);

      service.bindLocalOnSort(gridStub, dataViewStub);
      const columnSorts = service.getCurrentColumnSorts('firstName');

      expect(columnSorts).toEqual([{ sortCol: { id: 'lastName', field: 'lastName' }, sortAsc: false }]);
    });
  });

  describe('loadLocalGridPresets method', () => {
    const mockColumns = [{ id: 'firstName', field: 'firstName' }, { id: 'lastName', field: 'lastName' }] as Column[];

    beforeEach(() => {
      gridOptionMock.presets = {
        sorters: [{ columnId: 'firstName', direction: 'ASC' }, { columnId: 'lastName', direction: 'DESC' }],
      };
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    });

    it('should load local grid presets', () => {
      const spySetCols = jest.spyOn(gridStub, 'setSortColumns');
      const spySortChanged = jest.spyOn(service, 'onLocalSortChanged');
      const expectation = [
        { columnId: 'firstName', sortAsc: true, sortCol: { id: 'firstName', field: 'firstName' } },
        { columnId: 'lastName', sortAsc: false, sortCol: { id: 'lastName', field: 'lastName' } },
      ];

      service.bindLocalOnSort(gridStub, dataViewStub);
      service.loadLocalGridPresets(gridStub, dataViewStub);

      expect(spySetCols).toHaveBeenCalledWith(expectation);
      expect(spySortChanged).toHaveBeenCalledWith(gridStub, dataViewStub, expectation);
    });
  });

  describe('undefined getColumns & getOptions', () => {
    it('should use an empty column definition when grid "getColumns" method is not available', () => {
      gridOptionMock.presets = {
        sorters: [{ columnId: 'firstName', direction: 'ASC' }, { columnId: 'lastName', direction: 'DESC' }],
      };
      const spySetCols = jest.spyOn(gridStub, 'setSortColumns');
      gridStub.getColumns = undefined;

      service.bindLocalOnSort(gridStub, dataViewStub);
      service.loadLocalGridPresets(gridStub, dataViewStub);

      expect(spySetCols).not.toHaveBeenCalled();
    });

    it('should use an empty grid option object when grid "getOptions" method is not available', () => {
      const spySetCols = jest.spyOn(gridStub, 'setSortColumns');
      gridStub.getOptions = undefined;

      service.bindLocalOnSort(gridStub, dataViewStub);
      service.loadLocalGridPresets(gridStub, dataViewStub);

      expect(spySetCols).not.toHaveBeenCalled();
    });
  });

  describe('onLocalSortChanged method', () => {
    it('should call a dataview "reSort" when the flag requires it', () => {
      const spyResort = jest.spyOn(dataViewStub, 'reSort');

      service.bindLocalOnSort(gridStub, dataViewStub);
      service.onLocalSortChanged(gridStub, dataViewStub, [], true);

      expect(spyResort).toHaveBeenCalled();
    });

    it('should call a dataview sort then a grid invalidate & render', () => {
      const mockSortedCols = [
        { sortCol: { id: 'lastName', field: 'lastName', width: 100 }, sortAsc: true },
        { sortCol: { id: 'firstName', field: 'firstName', width: 100 }, sortAsc: false },
      ] as ColumnSort[];
      const spyResort = jest.spyOn(dataViewStub, 'reSort');
      const spySort = jest.spyOn(dataViewStub, 'sort');
      const spyInvalidate = jest.spyOn(gridStub, 'invalidate');
      const spyRender = jest.spyOn(gridStub, 'render');

      service.bindLocalOnSort(gridStub, dataViewStub);
      service.onLocalSortChanged(gridStub, dataViewStub, mockSortedCols);

      expect(spySort).toHaveBeenCalled();
      expect(spyInvalidate).toHaveBeenCalled();
      expect(spyRender).toHaveBeenCalled();
      expect(spyResort).not.toHaveBeenCalled();
    });
  });

  describe('sortComparer method', () => {
    let dataset = [];

    beforeEach(() => {
      dataset = [
        { firstName: 'John', lastName: 'Doe', age: 22, address: { zip: 123456 } },
        { firstName: 'Jane', lastName: 'Doe', age: 27, address: { zip: 123456 } },
        { firstName: 'Barbara', lastName: 'Smith', age: 1, address: { zip: 222222 } },
        { firstName: 'Jane', lastName: 'Smith', age: 40, address: { zip: 333333 } },
        { firstName: 'Erla', lastName: 'Richard', age: 101, address: { zip: 444444 } },
        { firstName: 'Christopher', lastName: 'McDonald', age: 40, address: { zip: 555555 } },
      ];
    });

    afterEach(() => {
      dataset = undefined;
    });

    it('should sort the data with a sorter that is a number type', () => {
      const mockSortedCols = [
        { sortCol: { id: 'age', field: 'age', type: FieldType.number }, sortAsc: true },
      ] as ColumnSort[];

      dataset.sort((row1, row2) => service.sortComparer(mockSortedCols, row1, row2));

      expect(dataset).toEqual([
        { firstName: 'Barbara', lastName: 'Smith', age: 1, address: { zip: 222222 } },
        { firstName: 'John', lastName: 'Doe', age: 22, address: { zip: 123456 } },
        { firstName: 'Jane', lastName: 'Doe', age: 27, address: { zip: 123456 } },
        { firstName: 'Jane', lastName: 'Smith', age: 40, address: { zip: 333333 } },
        { firstName: 'Christopher', lastName: 'McDonald', age: 40, address: { zip: 555555 } },
        { firstName: 'Erla', lastName: 'Richard', age: 101, address: { zip: 444444 } },
      ]);
    });

    it('should sort the data with 2 sorters that are string type', () => {
      const mockSortedCols = [
        { sortCol: { id: 'lastName', field: 'lastName', width: 100 }, sortAsc: true },
        { sortCol: { id: 'firstName', field: 'firstName', width: 100 }, sortAsc: false },
      ] as ColumnSort[];

      dataset.sort((row1, row2) => service.sortComparer(mockSortedCols, row1, row2));

      expect(dataset).toEqual([
        { firstName: 'John', lastName: 'Doe', age: 22, address: { zip: 123456 } },
        { firstName: 'Jane', lastName: 'Doe', age: 27, address: { zip: 123456 } },
        { firstName: 'Christopher', lastName: 'McDonald', age: 40, address: { zip: 555555 } },
        { firstName: 'Erla', lastName: 'Richard', age: 101, address: { zip: 444444 } },
        { firstName: 'Jane', lastName: 'Smith', age: 40, address: { zip: 333333 } },
        { firstName: 'Barbara', lastName: 'Smith', age: 1, address: { zip: 222222 } },
      ]);
    });

    it('should sort the data with 2 sorters which one of them uses "queryField" and the other uses "queryFieldSorter"', () => {
      const mockSortedCols = [
        { sortCol: { id: 'address', field: 'address', queryField: 'lastName' }, sortAsc: true },
        { sortCol: { id: 'random', field: 'random', queryFieldSorter: 'firstName' }, sortAsc: false },
      ] as ColumnSort[];

      dataset.sort((row1, row2) => service.sortComparer(mockSortedCols, row1, row2));

      expect(dataset).toEqual([
        { firstName: 'John', lastName: 'Doe', age: 22, address: { zip: 123456 } },
        { firstName: 'Jane', lastName: 'Doe', age: 27, address: { zip: 123456 } },
        { firstName: 'Christopher', lastName: 'McDonald', age: 40, address: { zip: 555555 } },
        { firstName: 'Erla', lastName: 'Richard', age: 101, address: { zip: 444444 } },
        { firstName: 'Jane', lastName: 'Smith', age: 40, address: { zip: 333333 } },
        { firstName: 'Barbara', lastName: 'Smith', age: 1, address: { zip: 222222 } },
      ]);
    });

    it('should sort the data with a sorter that is a complex object (following the dot notation in its field name)', () => {
      const mockSortedCols = [
        { sortCol: { id: 'address', field: 'address.zip' }, sortAsc: true },
        { sortCol: { id: 'firstName', field: 'firstName', width: 100 }, sortAsc: true },
      ] as ColumnSort[];

      dataset.sort((row1, row2) => service.sortComparer(mockSortedCols, row1, row2));

      expect(dataset).toEqual([
        { firstName: 'Jane', lastName: 'Doe', age: 27, address: { zip: 123456 } },
        { firstName: 'John', lastName: 'Doe', age: 22, address: { zip: 123456 } },
        { firstName: 'Barbara', lastName: 'Smith', age: 1, address: { zip: 222222 } },
        { firstName: 'Jane', lastName: 'Smith', age: 40, address: { zip: 333333 } },
        { firstName: 'Erla', lastName: 'Richard', age: 101, address: { zip: 444444 } },
        { firstName: 'Christopher', lastName: 'McDonald', age: 40, address: { zip: 555555 } },
      ]);
    });

    it('should sort the data with a sorter that is a complex object (with a dataKey provided)', () => {
      const mockSortedCols = [
        { sortCol: { id: 'address', field: 'address', dataKey: 'zip', sorter: Sorters.objectString, }, sortAsc: true },
        { sortCol: { id: 'firstName', field: 'firstName', width: 100 }, sortAsc: true },
      ] as ColumnSort[];

      dataset.sort((row1, row2) => service.sortComparer(mockSortedCols, row1, row2));

      expect(dataset).toEqual([
        { firstName: 'Jane', lastName: 'Doe', age: 27, address: { zip: 123456 } },
        { firstName: 'John', lastName: 'Doe', age: 22, address: { zip: 123456 } },
        { firstName: 'Barbara', lastName: 'Smith', age: 1, address: { zip: 222222 } },
        { firstName: 'Jane', lastName: 'Smith', age: 40, address: { zip: 333333 } },
        { firstName: 'Erla', lastName: 'Richard', age: 101, address: { zip: 444444 } },
        { firstName: 'Christopher', lastName: 'McDonald', age: 40, address: { zip: 555555 } },
      ]);
    });
  });
});
