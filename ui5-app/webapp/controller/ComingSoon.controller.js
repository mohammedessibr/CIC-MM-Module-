sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("cic.mm.controller.ComingSoon", {
        onInit: function () {
        },
        onReturn: function() {
            this.getOwnerComponent().getRouter().navTo("intro");
        }
    });
});
