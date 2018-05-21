System.register(["aurelia-framework", "aurelia-i18n", "./../models/index", "../sorters/sorterUtilities"], function (exports_1, context_1) {
    "use strict";
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __moduleName = context_1 && context_1.id;
    var aurelia_framework_1, aurelia_i18n_1, index_1, sorterUtilities_1, CollectionService;
    return {
        setters: [
            function (aurelia_framework_1_1) {
                aurelia_framework_1 = aurelia_framework_1_1;
            },
            function (aurelia_i18n_1_1) {
                aurelia_i18n_1 = aurelia_i18n_1_1;
            },
            function (index_1_1) {
                index_1 = index_1_1;
            },
            function (sorterUtilities_1_1) {
                sorterUtilities_1 = sorterUtilities_1_1;
            }
        ],
        execute: function () {
            CollectionService = /** @class */ (function () {
                function CollectionService(i18n) {
                    this.i18n = i18n;
                }
                /**
                 * Filter items from a collection
                 * @param collection
                 * @param filterBy
                 */
                CollectionService.prototype.filterCollection = function (collection, filterBy) {
                    var filteredCollection = [];
                    if (filterBy) {
                        var property_1 = filterBy.property || '';
                        var operator = filterBy.operator || index_1.OperatorType.equal;
                        // just check for undefined since the filter value could be null, 0, '', false etc
                        var value_1 = typeof filterBy.value === 'undefined' ? '' : filterBy.value;
                        switch (operator) {
                            case index_1.OperatorType.equal:
                                filteredCollection = collection.filter(function (item) { return item[property_1] === value_1; });
                                break;
                            case index_1.OperatorType.in:
                                filteredCollection = collection.filter(function (item) { return item[property_1].indexOf(value_1) !== -1; });
                                break;
                            case index_1.OperatorType.notIn:
                                filteredCollection = collection.filter(function (item) { return item[property_1].indexOf(value_1) === -1; });
                                break;
                            case index_1.OperatorType.contains:
                                filteredCollection = collection.filter(function (item) { return value_1.indexOf(item[property_1]) !== -1; });
                                break;
                            default:
                                filteredCollection = collection.filter(function (item) { return item[property_1] !== value_1; });
                        }
                    }
                    return filteredCollection;
                };
                /**
                 * Sort items in a collection
                 * @param collection
                 * @param sortBy
                 * @param enableTranslateLabel
                 */
                CollectionService.prototype.sortCollection = function (collection, sortBy, enableTranslateLabel) {
                    var _this = this;
                    var sortedCollection = [];
                    if (sortBy) {
                        var property_2 = sortBy.property || '';
                        var sortDirection_1 = sortBy.hasOwnProperty('sortDesc') ? (sortBy.sortDesc ? -1 : 1) : 1;
                        var fieldType_1 = sortBy.fieldType || index_1.FieldType.string;
                        sortedCollection = collection.sort(function (dataRow1, dataRow2) {
                            var value1 = (enableTranslateLabel) ? _this.i18n.tr(dataRow1[property_2] || ' ') : dataRow1[property_2];
                            var value2 = (enableTranslateLabel) ? _this.i18n.tr(dataRow2[property_2] || ' ') : dataRow2[property_2];
                            var result = sorterUtilities_1.sortByFieldType(value1, value2, fieldType_1, sortDirection_1);
                            return result;
                        });
                    }
                    return sortedCollection;
                };
                CollectionService = __decorate([
                    aurelia_framework_1.inject(aurelia_i18n_1.I18N)
                ], CollectionService);
                return CollectionService;
            }());
            exports_1("CollectionService", CollectionService);
        }
    };
});
//# sourceMappingURL=collection.service.js.map