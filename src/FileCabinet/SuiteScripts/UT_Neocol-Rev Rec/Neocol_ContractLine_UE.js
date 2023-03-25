/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @NScriptType UserEventScript
 * @see https://system.netsuite.com/app/help/helpcenter.nl?fid=section_4387799721.html
 */
define(['N/search', 'N/record', 'N/error', 'N/runtime'],

    /**
     * @return {{
     *   beforeLoad?: Function,
     *   beforeSubmit?: Function,
     *   afterSubmit?: Function,
     * }}
     */
    function (search, record,error,runtime) {

        /**
         * @param {BeforeLoadContext} context
         * @return {void}
         */
        function beforeLoad(context) {
            try {

                log.audit('beforeLoad', {
                    type: context.type,
                    form: context.form,
                    newRecord: {
                        type: context.newRecord.type,
                        id: context.newRecord.id,
                    },
                    request: !context.request ? null : {
                        url: context.request.url,
                        parameters: context.request.parameters,
                    },
                });

            } catch (e) {
                log.error('beforeLoad', JSON.parse(JSON.stringify(e)));
            }
        }

        /**
         * @param {BeforeSubmitContext} context
         * @return {void}
         */
        function beforeSubmit(context) {
            try {
                /*
                log.audit('beforeSubmit', {
                    type: context.type,
                    newRecord: {
                        type: context.newRecord.type,
                        id: context.newRecord.id,
                    },
                    oldRecord: {
                        type: context.oldRecord.type,
                        id: context.oldRecord.id,
                    },
                });

                 */

                var newRecord = context.newRecord;

                var recType = newRecord.type;
                //log.debug('recType', recType)

                var itemId = newRecord.getValue('custrecord_is_cl_item')

                if(!isEmpty(itemId)) {

                    var ItemLookupObj = search.lookupFields({
                        type: search.Type.ITEM,
                        id: itemId,
                        columns: ['custitem_discount_item', 'custitem_pob_detail']
                    });

                    var discountItem = ItemLookupObj.custitem_discount_item
                    log.debug('discountItem', discountItem)

                    var pobDetail = ItemLookupObj.custitem_pob_detail

                    var discountedOrderProduct = newRecord.getValue('custrecord_discounted_contractline')
                    log.debug('discountedOrderProduct', discountedOrderProduct)

                    if ((discountItem === true) && (!isEmpty(discountedOrderProduct))) {

                        var discountedOrderProductTotal
                        var discountProductId

                        var customrecord_contractlinesSearchObj = search.create({
                            type: "customrecord_contractlines",
                            filters:
                                [
                                    ["custrecord_is_cl_source_ext_id", "is", discountedOrderProduct]
                                ],
                            columns:
                                [
                                    search.createColumn({
                                        name: "name",
                                        sort: search.Sort.ASC
                                    }),
                                    "internalid"
                                ]
                        });
                        var searchResultCount = customrecord_contractlinesSearchObj.runPaged().count;
                        log.debug("customrecord_contractlinesSearchObj result count", searchResultCount);
                        if (searchResultCount > 0) {
                            customrecord_contractlinesSearchObj.run().each(function (result) {
                                // .run().each has a limit of 4,000 results

                                discountProductId = result.getValue({name: 'internalid'});
                                log.debug('discountProductId', discountProductId)
                                return true;
                            });
                        }
                        var customrecord_contractlinesSearchObjTotalDiscount = search.create({
                            type: "customrecord_contractlines",
                            filters:
                                [
                                    ["custrecord_discounted_contractline", "is", discountedOrderProduct]
                                ],
                            columns:
                                [
                                    search.createColumn({
                                        name: "custrecord_is_cl_totalprice",
                                        summary: "SUM"
                                    })
                                ]
                        });
                        var searchResultCountTotalDiscount = customrecord_contractlinesSearchObjTotalDiscount.runPaged().count;
                        log.debug("customrecord_contractlinesSearchObjTotalDiscount result count", searchResultCountTotalDiscount);

                        if (searchResultCountTotalDiscount > 0) {
                            customrecord_contractlinesSearchObjTotalDiscount.run().each(function (result) {

                                discountedOrderProductTotal = result.getValue({
                                    name: "custrecord_is_cl_totalprice",
                                    summary: "SUM"
                                })
                                log.debug('discountedOrderProductTotal', discountedOrderProductTotal)
                                // .run().each has a limit of 4,000 results
                                return true;
                            });
                        }
                      if (discountProductId != '' && discountProductId != null)
                      {  
                       

                      var discountedContractLineRecord = record.load({
                            type: 'customrecord_contractlines',
                            id: discountProductId,
                            isDynamic: true
                        });
                      

                        discountedContractLineRecord.setValue('custrecord_neo_cl_totalotd', discountedOrderProductTotal);

                        log.debug('beforeSubmit','Quantity  ' + discountedContractLineRecord.getValue('custrecord_is_cl_quantity'));
                        log.debug('beforeSubmit','Price  ' + discountedContractLineRecord.getValue('custrecord_neo_cl_regunitprice'));
                        log.debug('beforeSubmit','Total OTD  ' + discountedContractLineRecord.getValue('custrecord_neo_cl_totalotd'));

                        var itemQty = parseFloat(discountedContractLineRecord.getValue('custrecord_is_cl_quantity'));
                        if (itemQty == null || itemQty == '' || isNaN(itemQty))
                            itemQty = 0;
                        var itemPrice = parseFloat(discountedContractLineRecord.getValue('custrecord_is_cl_price'));
                        if (itemPrice == null || itemPrice == '' || isNaN(itemPrice))
                            itemPrice = 0;
                        var regularUnitPrice = parseFloat(discountedContractLineRecord.getValue('custrecord_neo_cl_regunitprice'));
                        if (regularUnitPrice == null || regularUnitPrice == '' || isNaN(regularUnitPrice))
                            regularUnitPrice = 0;
                        var oneTimeDiscount = parseFloat(discountedContractLineRecord.getValue('custrecord_neo_cl_totalotd'));
                        if (oneTimeDiscount == null || oneTimeDiscount == '' || isNaN(oneTimeDiscount))
                            oneTimeDiscount = 0;

                        var discSalesAmount = (itemQty * itemPrice) + oneTimeDiscount;
                        log.debug('beforeSubmit','discAmount  ' +discSalesAmount);
                        discountedContractLineRecord.setValue('custrecord_neo_cl_discountedsalesamount', discSalesAmount);

                        var salesAmount = (itemQty * regularUnitPrice);
                        discountedContractLineRecord.setValue('custrecord_neo_cl_salesamount', salesAmount);

                        var recordId = discountedContractLineRecord.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                      }
                    }

                    log.debug('pobDetail', pobDetail)
                    if(pobDetail == 'Session Units'){

                        var contractLineRevRecStartDate = new Date(newRecord.getValue('custrecord_is_revrec_startdate'))
                        var contractLineRevRecEndDate = new Date(newRecord.getValue('custrecord_is_revrec_enddate'))

                        log.debug('contractLineRevRecStartDate', contractLineRevRecStartDate)
                        log.debug('contractLineRevRecEndDate', contractLineRevRecEndDate)

                        var contractLineOrder = newRecord.getValue('custrecord_is_cl_order')

                        var orderLookupObj = search.lookupFields({
                            type: 'customrecord_order',
                            id: contractLineOrder,
                            columns: ['custrecord_ord_su_startdate', 'custrecord_ord_su_enddate']
                        });
                        log.debug('orderLookupObj', orderLookupObj)

                        var contractLineEarliestSUStartDate = orderLookupObj.custrecord_ord_su_startdate
                        var contractLineLatestSUEndDate = orderLookupObj.custrecord_ord_su_enddate

                        if(!isEmpty(contractLineEarliestSUStartDate)) {
                            contractLineEarliestSUStartDate = new Date(contractLineEarliestSUStartDate)
                            log.debug('contractLineEarliestSUStartDate', contractLineEarliestSUStartDate)

                            if (contractLineRevRecStartDate < contractLineEarliestSUStartDate) {
                                log.debug('Session Unit Date Logic', 'Rev Rec Start Date earlier than current Session Unit Start Date')
                                contractLineEarliestSUStartDate = contractLineRevRecStartDate
                                log.debug('contractLineEarliestSUStartDate', contractLineEarliestSUStartDate)
                            }
                        }else{
                            contractLineEarliestSUStartDate = contractLineRevRecStartDate
                            log.debug('contractLineEarliestSUStartDate', contractLineEarliestSUStartDate)
                        }

                        if(!isEmpty(contractLineLatestSUEndDate)) {
                            contractLineLatestSUEndDate = new Date(contractLineLatestSUEndDate)
                            log.debug('contractLineLatestSUEndDate', contractLineLatestSUEndDate)

                            if (contractLineRevRecStartDate > contractLineLatestSUEndDate) {
                                log.debug('Session Unit Date Logic', 'Rev Rec End Date after current Session Unit End Date')
                                contractLineLatestSUEndDate = contractLineRevRecEndDate
                                log.debug('contractLineLatestSUEndDate', contractLineLatestSUEndDate)
                            }
                        }else{
                            contractLineLatestSUEndDate = contractLineRevRecEndDate
                            log.debug('contractLineLatestSUEndDate', contractLineLatestSUEndDate)
                        }
                        
                        var setOrderSUDate = record.submitFields({
                            type: 'customrecord_order',
                            id: contractLineOrder,
                            values: {
                                'custrecord_ord_su_startdate': contractLineEarliestSUStartDate,
                                'custrecord_ord_su_enddate' : contractLineLatestSUEndDate
                            }
                        });
                         
                    }
                }

                //CHANGES BY SRIRAM - CALCULATE TOTAL DISCOUNT AMOUNT
                //
                log.debug('beforeSubmit','Quantity  ' + newRecord.getValue('custrecord_is_cl_quantity'));
                log.debug('beforeSubmit','Price  ' + newRecord.getValue('custrecord_neo_cl_regunitprice'));
                log.debug('beforeSubmit','Total OTD  ' + newRecord.getValue('custrecord_neo_cl_totalotd'));

                var itemQty = parseFloat(newRecord.getValue('custrecord_is_cl_quantity'));
                if (itemQty == null || itemQty == '' || isNaN(itemQty))
                    itemQty = 0;
                var regularUnitPrice = parseFloat(newRecord.getValue('custrecord_neo_cl_regunitprice'));
                if (regularUnitPrice == null || regularUnitPrice == '' || isNaN(regularUnitPrice))
                    regularUnitPrice = 0;
                var itemPrice = parseFloat(newRecord.getValue('custrecord_is_cl_price'));
                if (itemPrice == null || itemPrice == '' || isNaN(itemPrice))
                    itemPrice = 0;
                var oneTimeDiscount = parseFloat(newRecord.getValue('custrecord_neo_cl_totalotd'));
                if (oneTimeDiscount == null || oneTimeDiscount == '' || isNaN(oneTimeDiscount))
                    oneTimeDiscount = 0;

                var discSalesAmount = (itemQty * itemPrice) + oneTimeDiscount;
                log.debug('beforeSubmit','discAmount  ' +discSalesAmount);

                var contractlineDiscountSalesAmount = newRecord.getValue('custrecord_neo_cl_discountedsalesamount')
                if(isEmpty(contractlineDiscountSalesAmount) || contractlineDiscountSalesAmount == 0.00)
                    newRecord.setValue('custrecord_neo_cl_discountedsalesamount', discSalesAmount);

                var salesAmount = (itemQty * regularUnitPrice);
                var contractLineSalesAmount = newRecord.getValue('custrecord_neo_cl_salesamount')
                if(isEmpty(contractLineSalesAmount) || contractLineSalesAmount == 0.00)
                    newRecord.setValue('custrecord_neo_cl_salesamount', salesAmount);



                //CHANGES BY SRIRAM - CREATE REVENUE RECOGNITION EVENTS

                var recType = newRecord.type;
                var internalId = newRecord.id
                log.debug('recType', recType)
                log.debug('internalId', internalId)


                var updatePercentComplete =  newRecord.getValue('custrecord_neo_projcomplete_update')
                log.debug('updatePercentComplete', updatePercentComplete)

                var actualEvent
                var cumulativePercentComplete;
                var percentCompleteDate;

                if((updatePercentComplete == true)){
                    log.debug('saveRecord', 'Create Revenue Recognition Event')
                    cumulativePercentComplete = newRecord.getValue('custrecord_neo_projcomplete_percent')
                    log.debug('cumulativePercentComplete', cumulativePercentComplete)
                    percentCompleteDate =  newRecord.getValue('custrecord_neo_projcomplete_date')
                    percentCompleteDate = new Date(percentCompleteDate)
                    log.debug('percentCompleteDate', percentCompleteDate)
                    actualEvent = record.create({
                        type: record.Type.BILLING_REVENUE_EVENT,
                    });

                    actualEvent.setValue({fieldId: 'recordtype',value: 435});
                    actualEvent.setValue({fieldId: 'record', value: internalId });

                    actualEvent.setValue({fieldId: 'eventtype', value: 2 });
                    actualEvent.setValue({fieldId: 'eventpurpose', value: 'ACTUAL' });

                    actualEvent.setValue({fieldId: 'eventdate', value: percentCompleteDate });
                    actualEvent.setValue({fieldId: 'cumulativepercentcomplete', value: cumulativePercentComplete });

                    var actualEventId = actualEvent.save();
                    log.debug('actualEventId', actualEventId);

                    newRecord.setValue( 'custrecord_neo_projcomplete_update', false);

                }
            }
            catch (e) {
                log.error('beforeSubmit', JSON.parse(JSON.stringify(e)));
                throw e;
            }

            //return returnValue;
        }

        /**
         * @param {AfterSubmitContext} context
         * @return {void}
         */
        function afterSubmit(context) {
            null;
        }


        function isEmpty (stValue) {

            return ((stValue === '' || stValue == null || stValue == undefined) || (stValue.constructor === Array && stValue.length == 0) || (stValue.constructor === Object && (function(v) {
                for (var k in v)
                    return false;
                return true;
            })(stValue)));

        };

        return {
            // beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit
            // afterSubmit: afterSubmit
        };

    }
);