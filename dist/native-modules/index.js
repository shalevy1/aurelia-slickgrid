import { PLATFORM } from 'aurelia-pal';
import { AureliaSlickgridCustomElement } from './aurelia-slickgrid';
import { SlickPaginationCustomElement } from './slick-pagination';
import { SlickgridConfig } from './slickgrid-config';
// models
import { CaseType } from './models/caseType';
import { FormElementType } from './models/formElementType';
import { FieldType } from './models/fieldType';
// editors, formatters, ...
import { Editors } from './editors/index';
import { FilterConditions } from './filter-conditions/index';
import { FilterTemplates } from './filter-templates/index';
import { Formatters } from './formatters/index';
import { Sorters } from './sorters/index';
// services and utilities
import { ControlAndPluginService } from './services/controlAndPlugin.service';
import { FilterService } from './services/filter.service';
import { GraphqlService } from './services/graphql.service';
import { GridExtraUtils } from './services/gridExtraUtils';
import { GridEventService } from './services/gridEvent.service';
import { GridOdataService } from './services/grid-odata.service';
import { ResizerService } from './services/resizer.service';
import { SortService } from './services/sort.service';
export function configure(aurelia, callback) {
    aurelia.globalResources(PLATFORM.moduleName('./aurelia-slickgrid'));
    aurelia.globalResources(PLATFORM.moduleName('./slick-pagination'));
    var config = new SlickgridConfig();
    if (typeof callback === 'function') {
        callback(config);
    }
}
export { AureliaSlickgridCustomElement, SlickPaginationCustomElement, CaseType, FormElementType, FieldType, Editors, FilterConditions, FilterTemplates, Formatters, Sorters, 
// services
ControlAndPluginService, FilterService, GraphqlService, GridExtraUtils, GridEventService, GridOdataService, ResizerService, SortService, SlickgridConfig };
//# sourceMappingURL=index.js.map