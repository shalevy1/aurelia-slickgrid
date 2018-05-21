import { GridOption } from './../models/index';
import { EventAggregator } from 'aurelia-event-aggregator';
export interface GridDimension {
    height: number;
    width: number;
    heightWithPagination?: number;
}
export declare class ResizerService {
    private ea;
    private _grid;
    private _lastDimensions;
    aureliaEventPrefix: string;
    constructor(ea: EventAggregator);
    /** Getter for the Grid Options pulled through the Grid Object */
    private readonly _gridOptions;
    /** Getter for retrieving the Grid UID that is used when dealing with multiple grids in same view. */
    private readonly _gridUid;
    init(grid: any): void;
    /**
     * Attach an auto resize trigger on the datagrid, if that is enable then it will resize itself to the available space
     * Options: we could also provide a % factor to resize on each height/width independently
     */
    attachAutoResizeDataGrid(newSizes?: GridDimension): any | void;
    /**
     * Calculate the datagrid new height/width from the available space, also consider that a % factor might be applied to calculation
     * object gridOptions
     */
    calculateGridNewDimensions(gridOptions: GridOption): any;
    /**
     * Dispose function when element is destroyed
     */
    dispose(): void;
    getLastResizeDimensions(): GridDimension;
    /** Resize the datagrid to fit the browser height & width */
    resizeGrid(delay?: number, newSizes?: GridDimension): void;
}
