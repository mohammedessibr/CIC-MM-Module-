sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "cic/mm/utils/AICopilotLogic"
], function (Controller, Fragment, AICopilotLogic) {
    "use strict";

    return Controller.extend("cic.mm.controller.App", {
        onInit: function () {
        },

        onSideNavButtonPress: function () {
            var oToolPage = this.byId("toolPage");
            var bSideExpanded = oToolPage.getSideExpanded();

            oToolPage.setSideExpanded(!bSideExpanded);
        },

        onItemSelect: function (oEvent) {
            var oItem = oEvent.getParameter("item");
            var sKey = oItem.getKey();
            this.getOwnerComponent().getRouter().navTo(sKey);
        },

        openChatBot: function () {
            var oView = this.getView();

            if (!this._pChatDialog) {
                this._pChatDialog = Fragment.load({
                    id: oView.getId(),
                    name: "cic.mm.view.AIAssistant",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this._pChatDialog.then(function (oDialog) {
                oDialog.open();
                // Delayed scroll to bottom after rendering
                setTimeout(function() {
                    var oScroll = oView.byId("chatScrollContainer");
                    if(oScroll) { oScroll.scrollTo(0, 99999); }
                }, 200);
            });
        },

        closeChatBot: function () {
            this.getView().getDependents().forEach(function(dep) {
                if(dep.isA("sap.m.Dialog")) { dep.close(); }
            });
        },
        
        onChatKeywordPress: function(oEvent) {
            var sText = oEvent.getSource().getText();
            this._handleChatSend(sText);
        },

        onChatSend: function() {
            var oModel = this.getView().getModel("data");
            var sText = oModel.getProperty("/chat/input");
            this._handleChatSend(sText);
        },
        
        _handleChatSend: function(sText) {
            var oModel = this.getView().getModel("data");
            if (!sText || sText.trim() === "") return;
            
            var aMessages = oModel.getProperty("/chat/messages");
            aMessages.push({ role: "user", content: sText });
            oModel.setProperty("/chat/messages", aMessages);
            oModel.setProperty("/chat/input", "");
            oModel.setProperty("/chat/isBusy", true);
            
            this._scrollToBottom();

            var that = this;
            setTimeout(function() {
                var response = AICopilotLogic.parseUserInput(sText);
                
                var newMsg = { 
                    role: "assistant", 
                    content: response.message, 
                    cardType: response.cardType || "none",
                    responseParams: response 
                };
                
                var aCurrentMsgs = oModel.getProperty("/chat/messages");
                aCurrentMsgs.push(newMsg);
                oModel.setProperty("/chat/messages", aCurrentMsgs);
                oModel.setProperty("/chat/isBusy", false);
                that._scrollToBottom();
            }, 800);
        },

        handleCardAction: function(oEvent) {
            var sAction = oEvent.getSource().data("action");
            var oContext = oEvent.getSource().getBindingContext("data");
            var oData = oContext.getObject();
            
            var sMsg = "";
            if (sAction === "select_vendor") {
                var sVendor = oEvent.getSource().getBindingContext("data").getObject();
                sMsg = "I'll select " + sVendor + " as the vendor.";
                // We need to re-trigger logic with the selected vendor
                this._handleChatSend(sMsg);
            } else if (sAction === "submit_po") {
                sMsg = "Let's submit this Purchase Order.";
                this._handleChatSend(sMsg);
                
                // Simulate success after a delay
                var that = this;
                setTimeout(function() {
                    var oModel = that.getView().getModel("data");
                    var aMsgs = oModel.getProperty("/chat/messages");
                    aMsgs.push({
                        role: "assistant",
                        content: "Purchase Order successfully created! (Simulated ME21N). Document Number: 4500021342"
                    });
                    oModel.setProperty("/chat/messages", aMsgs);
                    that._scrollToBottom();
                }, 1500);
            }
        },

        _scrollToBottom: function() {
            var oScroll = this.getView().byId("chatScrollContainer");
            if(oScroll) { oScroll.scrollTo(0, 99999, 300); }
        },
        
        onChatLinkPress: function(oEvent) {
            var oContext = oEvent.getSource().getBindingContext("data");
            var sSectionId = oContext.getProperty("link/sectionId");
            
            try {
                this.getOwnerComponent().getRouter().navTo(sSectionId);
            } catch(e) {
                sap.m.MessageToast.show("Target view not yet migrated: " + sSectionId);
            }
            this.closeChatBot();
        }
    });
});
