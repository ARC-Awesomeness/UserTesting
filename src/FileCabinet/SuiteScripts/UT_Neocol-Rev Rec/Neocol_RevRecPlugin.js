/**
 * @NApiVersion 2.0
 * @NScriptType AdvancedRevRecPlugin
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error', 'N/format', '/SuiteScripts/Neocol_RevRecPlugin_Lib.js'],
    function(search, record, email, runtime, error, format, lib) {
        function getRevenueElementSourceIdsForCreation(context) {
            log.audit('getRevenueElementSourceIdsForCreation: Entry', context);

            var sourceIds = [];
            var sourceExternalIdsForCreation = lib.getSourceExternalIdsForRevenueElementCreation();
            for (var i = 0, len = sourceExternalIdsForCreation.length; i < len; i++) {
                sourceIds.push(lib.getSourceIdFromSourceExternalId(sourceExternalIdsForCreation[i]));
            }
            context.output.ids = sourceIds;

            log.audit('getRevenueElementSourceIdsForCreation: Exit', context);
        }

        function getRevenueElementsForSourceId(context) {
            log.audit('getRevenueElementsForSourceId: Entry', context);

            var revenueElements = [];
            var custSourceRecord = record.load({
                type: lib.getSourceRecordType(),
                id: context.input.id
            });

            if (custSourceRecord != null) {
                var externalId = custSourceRecord.getValue('custrecord_is_cl_source_ext_id');

                revenueElements.push(context.output.createRevenueElement({
                    sourceId: context.input.id,
                    accountingBook: lib.getAccountingBook(externalId),
                    subsidiary: lib.getSubsidiary(externalId),
                    currency: lib.getCurrency(externalId),
                    item: lib.getItem(externalId),
                    quantity: lib.getQuantity(externalId),
                    salesAmount: lib.getSalesAmount(externalId),
                    discountedSalesAmount: lib.getDiscountedSalesAmount(externalId),
                    elementDate: lib.getDate(externalId),
                    entity: lib.getCustomer(externalId),
                    startDate: lib.getRevRecStartDate(externalId),
                    endDate: lib.getRevRecEndDate(externalId),
                    forecaststartdate: lib.getRevRecStartDate(externalId),
                    forecastendDate: lib.getRevRecEndDate(externalId)
                    //location: null,
                    //department: null,
                    //alternateQuantity: null,
                    //alternateUnits: null,
                    //alternateUnitsType: null,
                    //sourceType: null,
                    //exchangeRate: null,
                    //classification: null

                }));
            }

            context.output.revenueElements = revenueElements;

            log.audit('getRevenueElementsForSourceId: Exit', context);
        }

        function getRevenueArrangementGroupForSourceId(context) {
            log.audit('getRevenueArrangementGroupForSourceId: Entry', context);

            log.debug()

            var custSourceRecord = record.load({
                type: lib.getSourceRecordType(),
                id: context.input.id
                //id: 516
            });

            var externalId = custSourceRecord.getValue('custrecord_is_cl_source_ext_id');
            //log.debug('rev arrangement externalId', externalId)
            context.output.id = lib.getArrangementKey(externalId);

            log.audit('getRevenueArrangementGroupForSourceId: Exit', context);

            var uncheckCreateNewElement = record.submitFields({
                type: 'customrecord_contractlines',
                id: context.input.id,
                values: {
                    'custrecord_is_new_ext_id': false
                }
            });

            var newExtId = custSourceRecord.getValue('custrecord_is_new_ext_id');
            log.debug('newExtId', newExtId)
        }

        function getSourceRecordType(context) {
            context.output.sourceRecordType = lib.getSourceRecordType();
        }

        function onRevenueElementCreated(context) {
            var revenueElementID = context.input.revenueElement.revenueElementId;
            //log.debug('onreccreate', context)

            var setRevenueElement = record.submitFields({
                type: 'customrecord_contractlines',
                id: context.input.revenueElement.sourceId,
                values: {
                    'custrecord_is_cl_revenue_element': revenueElementID
                }
            });

            lib.notifyRevenueElementCreated(context);
        }

        function getRevenueElementSourceIdsForUpdate(context) {
            log.audit('getRevenueElementSourceIdsForUpdate: Entry', context);

            var sourceIds = [];
            var sourceExternalIdsForUpdate = lib.getSourceExternalIdsForRevenueElementUpdate();
            for (var i = 0, len = sourceExternalIdsForUpdate.length; i < len; i++) {
                sourceIds.push(lib.getSourceIdFromSourceExternalId(sourceExternalIdsForUpdate[i]));
            }
            context.output.ids = sourceIds;

            log.audit('getRevenueElementSourceIdsForUpdate: Exit', context);
        }

        function updateRevenueElement(context) {
            log.audit('updateRevenueElement: Entry', context);

            var custSourceRecord = record.load({
                type: lib.getSourceRecordType(),
                id: context.output.revenueElement.sourceId
            });

            var externalId = custSourceRecord.getValue('custrecord_is_cl_source_ext_id');

            context.output.revenueElement.quantity = lib.getQuantity(externalId);
            context.output.revenueElement.salesAmount = lib.getSalesAmount(externalId);
            context.output.revenueElement.discountedSalesAmount = lib.getDiscountedSalesAmount(externalId);
            context.output.revenueElement.discountedSalesAmount = lib.getDiscountedSalesAmount(externalId);
            context.output.revenueElement.startDate = lib.getRevRecStartDate(externalId);
            context.output.revenueElement.endDate = lib.getRevRecEndDate(externalId);

            log.audit('updateRevenueElement: Exit', context);
        }

        function getInvoiceLinksForSourceId(context) {
            log.audit('getInvoiceLinksForSourceId: Entry', context);

            var invoiceLinks = [];

            var custSourceRecord = record.load({
                type: lib.getSourceRecordType(),
                id: context.input.id
            });

            //log.debug("sourceId", context.input.id);

            if (custSourceRecord != null) {

                var externalId = custSourceRecord.getValue('custrecord_is_cl_source_ext_id');
                //log.debug('externalId', externalId)

                var invoiceSearch = search.create({
                    type: 'transaction',
                    columns: [{name: 'lineuniquekey'}, {name: 'amount'}],
                    filters: [
                        {name: 'item', operator: 'noneof', values: ['@NONE@']},
                        {name: 'shipping', operator: 'is', values: ['F']},
                        {name: 'taxline', operator: 'is', values: ['F']},
                        {name: 'custcol_arm_sourceexternalid', operator: 'is', values: [externalId]}]
                });

                var invoiceSearchResultCount = invoiceSearch.runPaged().count;
                //log.debug("invoiceSearchResultCount",invoiceSearchResultCount);

                invoiceSearch.run().each(function (result) {
                    invoiceLinks.push(context.output.createSourceToInvoiceTransactionLink({
                        sourceId: context.input.id,
                        transactionLine: result.getValue({name: 'lineuniquekey'}),
                        fxAmount: result.getValue({name: 'amount'}),
                        baseAmount: result.getValue({name: 'amount'})
                    }));
                    return true;
                });
            }

            context.output.sourceToInvoiceTransactionLinks = invoiceLinks;

            var uncheckUpdateRevenueElement = record.submitFields({
                type: 'customrecord_contractlines',
                id: context.input.id,
                values: {
                    'custrecord_is_update_rev_element': false
                }
            });

            //log.audit('getInvoiceLinksForSourceId: Exit', context);
        }

        function getInvoiceLinksForInvoiceId(context) {
            log.audit('getInvoiceLinksForInvoiceId: Entry', context);

            var invoiceSearch = search.create({
                type: 'transaction',
                columns: [{name:'lineuniquekey'}, {name:'amount'}, {name:'custcol_arm_sourceexternalid'}],
                filters: [{name:'internalid', operator: 'is', values:[context.input.id]},
                    {name:'item', operator: 'noneof', values:['@NONE@']},
                    {name:'shipping', operator: 'is', values:['F']},
                    {name:'taxline', operator: 'is', values:['F']}]
            });

            var invoiceLinks = [];
            invoiceSearch.run().each(function (invoiceResult) {

                invoiceLinks.push(context.output.createSourceToInvoiceTransactionLink({
                    sourceId: lib.getSourceIdFromSourceExternalId(invoiceResult.getValue({name: 'custcol_arm_sourceexternalid'})),
                    transactionLine: invoiceResult.getValue({name: 'lineuniquekey'}),
                    fxAmount: invoiceResult.getValue({name: 'amount'}),
                    baseAmount: invoiceResult.getValue({name: 'amount'})
                }));
                return true;
            });

            context.output.sourceToInvoiceTransactionLinks = invoiceLinks;

            log.audit('getInvoiceLinksForInvoiceId: Exit', context);
        }
        return {
            getRevenueElementSourceIdsForCreation: getRevenueElementSourceIdsForCreation,
            getRevenueElementsForSourceId: getRevenueElementsForSourceId,
            getRevenueArrangementGroupForSourceId: getRevenueArrangementGroupForSourceId,
            getSourceRecordType: getSourceRecordType,
            onRevenueElementCreated: onRevenueElementCreated,
            getRevenueElementSourceIdsForUpdate: getRevenueElementSourceIdsForUpdate,
            updateRevenueElement: updateRevenueElement,
            getInvoiceLinksForSourceId: getInvoiceLinksForSourceId,
            getInvoiceLinksForInvoiceId: getInvoiceLinksForInvoiceId
        };
    }
);