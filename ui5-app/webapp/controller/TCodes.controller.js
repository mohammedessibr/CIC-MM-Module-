sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("cic.mm.controller.TCodes", {
        onInit: function () {
            // Initialization logic if needed
        },

        onSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue");
            var aFilters = [];
            if (sQuery && sQuery.length > 0) {
                // Search in code or description
                var oFilterCode = new Filter("code", FilterOperator.Contains, sQuery);
                var oFilterDesc = new Filter("desc", FilterOperator.Contains, sQuery);
                aFilters = new Filter({
                    filters: [oFilterCode, oFilterDesc],
                    and: false
                });
            }

            // Apply filters to tables inside the list
            // Note: In UI5, filtering nested structures like this requires custom logic 
            // but for now, we'll keep it simple or expand/collapse based on match
            this._applySearchFilter(aFilters);
        },

        _applySearchFilter: function (oFilter) {
            var oList = this.byId("tCodeList");
            var aItems = oList.getItems();

            aItems.forEach(function (oItem) {
                // This is a custom search implementation for nested tables
                var oVBox = oItem.getContent()[0];
                var aTables = oVBox.findAggregatedObjects(true, function (oObj) {
                    return oObj.getMetadata().getName() === "sap.m.Table";
                });

                var bVisible = false;
                aTables.forEach(function (oTable) {
                    var oBinding = oTable.getBinding("items");
                    if (oBinding) {
                        oBinding.filter(oFilter);
                        if (oBinding.getLength() > 0) {
                            bVisible = true;
                        }
                    }
                });

                // If no subcategory table has results, check if the main table should be visible
                // For this demo, we'll just show everything if filter is empty
                if (!oFilter || oFilter.aFilters && oFilter.aFilters.length === 0) {
                    oItem.setVisible(true);
                } else {
                    oItem.setVisible(bVisible);
                }
            });
        }
    });
});
