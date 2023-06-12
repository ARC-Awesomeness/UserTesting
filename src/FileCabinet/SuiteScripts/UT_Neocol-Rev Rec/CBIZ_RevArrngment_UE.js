/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @NScriptType UserEventScript
 * @see https://system.netsuite.com/app/help/helpcenter.nl?fid=section_4387799721.html
 */
define(['N/search', 'N/record', 'N/runtime', 'N/format'],

    /**
     * @return {{
     *   beforeLoad?: Function,
     *   beforeSubmit?: Function,
     *   afterSubmit?: Function,
     * }}
     */
    function (search, record, runtime, format) {

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
           var soLineValsStored = {};

           try {

            } catch (e) {
                log.error('beforeSubmit', JSON.parse(JSON.stringify(e)));
            }
            // START VARIABLE INITIALIZATION
            var type = context.type;
            var newRecord = context.newRecord;
            var oldRecord = context.oldRecord

            var scriptObj = runtime.getCurrentScript();

            log.audit('type = ' + type, 'Get Revenue Element Data START');

            var premierSupportPercent = scriptObj.getParameter({name: 'custscript_premiersupport_percent'});
            var iaPlatformPercent = scriptObj.getParameter({name: 'custscript_ia_platform_percent'});
            var iaSeatsPercent = scriptObj.getParameter({name: 'custscript_ia_seats_percent'});
            var myPanelPercent = scriptObj.getParameter({name: 'custscript_mypanel_percent'});
            var totalSubscriptionValue = 0
            var totalPlatformValue = 0
            var totalSeatsValue = 0
            var complianceCheck = ''

            var totalPremierSupportValue = 0
            var totalIaPlatformValue = 0
            var totalIaSeatsValue = 0
            var totalMyPanelValue = 0

            var checkSpecialTerms = false
            var checkTermsforConvenience = false

            var checkDiscountLineinArr = false
            var checkNegativeRevenueElement = false
            var checkMultiYearDeal = false

            var totalPremierSupportTerm = 0
            var totalIaPlatformTerm = 0
            var totalIaSeatsTerm = 0
            var totalMyPanelTerm = 0

            var revArgSpecialTermsNotes = newRecord.getValue('custbody_revarg_specialtermsnotes')
            var revenueElementLineCount = newRecord.getLineCount({
                sublistId: 'revenueelement'
            });
            var orderId = '';
            // END VARIABLE INITIALIZATION

            for (var i=0; revenueElementLineCount != 0 && i < revenueElementLineCount; i++){
                var source = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'source', line: i});

                if (!source.includes('Sales Order')){
                    continue;
                }

                var sourceId = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'sourceid', line: i});
                log.debug('sourceId', sourceId)

                //Get Sales Order Line Data
                var soLineVals;

                if (soLineValsStored[sourceId]){
                    soLineVals = soLineValsStored[sourceId];
                } else {
                    soLineVals = getSoLineVals(sourceId);
                    soLineValsStored[sourceId] = soLineVals;
                }


              if (typeof(soLineVals.orderId) != 'undefined')
              {
                orderId = soLineVals.orderId;
              }

                if(soLineVals.contractLineSpecialTerms == true){
                    checkSpecialTerms = true
                }

                if(soLineVals.contractLineTermsforConvenience == true){
                    checkTermsforConvenience = true
                }

                var addToSpecialTermsNotes = revArgSpecialTermsNotes.indexOf(soLineVals.contractLineSpecialTermsNotes)
                if(addToSpecialTermsNotes < 0){
                    revArgSpecialTermsNotes += ' - ' + soLineVals.contractLineSpecialTermsNotes
                }


                var revRecStartDate = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'revrecstartdate', line: i});
                revRecStartDate = new Date(revRecStartDate)
                //log.debug('revRecStartDate', revRecStartDate)

                var revRecEndDate = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'revrecenddate', line: i});
                revRecEndDate = new Date(revRecEndDate)
                //log.debug('revRecEndDate', revRecEndDate)

                var forecastStartDate = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'forecaststartdate', line: i});
                var forecastEndDate = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'forecastenddate', line: i});

                if(isEmpty(forecastStartDate)) {
                    if(!isEmpty(revRecStartDate)) {
                        newRecord.setSublistValue({
                            sublistId: 'revenueelement',
                            fieldId: 'forecaststartdate',
                            line: i,
                            value: revRecStartDate
                        });
                    }
                }

                if(isEmpty(forecastEndDate)) {
                    if(!isEmpty(revRecEndDate)) {
                        newRecord.setSublistValue({
                            sublistId: 'revenueelement',
                            fieldId: 'forecastenddate',
                            line: i,
                            value: revRecEndDate
                        });
                    }
                }

                var itemId = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'item', line: i});
                var itemData = getItemData(itemId);
                var discountedAmount = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'discountedamount', line: i});
                var quantity = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'quantity', line: i});

                if(discountItem == true || (!isEmpty(soLineVals.totalOneTimeDiscount) && soLineVals.totalOneTimeDiscount != 0.00 )){
                    checkDiscountLineinArr = true
                }

                if(discountedAmount < 0 || quantity < 0){
                    checkNegativeRevenueElement = true
                }

                if(!isEmpty(revRecStartDate) && !isEmpty(revRecEndDate)) {
                    var startDateEndDateDifference = revRecEndDate - revRecStartDate
                    if (startDateEndDateDifference > 31449600000) {
                        log.debug('startDateEndDateDifference', startDateEndDateDifference)
                        checkMultiYearDeal = true
                    }
                }

                if (subscriptionItem === true){
                    var subscriptionCalculatedValue = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'calculatedamount', line: i});
                    //log.debug('subscriptionCalculatedValue', subscriptionCalculatedValue)
                    totalSubscriptionValue += subscriptionCalculatedValue
                }

                if (platformItem === true){
                    var platformCalculatedValue = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'calculatedamount', line: i});
                    //log.debug('platformCalculatedValue', platformCalculatedValue)
                    totalPlatformValue += platformCalculatedValue
                }

                if (seatsItem === true){
                    var seatsCalculatedValue = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'calculatedamount', line: i});
                    //log.debug('seatsCalculatedValue', seatsCalculatedValue)
                    totalSeatsValue += seatsCalculatedValue
                }

                if(itemData.premierSupportItem === true) {
                    var premierSupportCalculatedValue = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'discountedamount', line: i});
                    //log.debug('premierSupportCalculatedValue', premierSupportCalculatedValue)
                    totalPremierSupportValue += premierSupportCalculatedValue

                    if(!isEmpty(revRecStartDate) && !isEmpty(revRecEndDate)) {
                        var startDateEndDateDifference = revRecEndDate - revRecStartDate
                        totalPremierSupportTerm += startDateEndDateDifference
                    }
                }

                if(itemData.iaPlatformItem === true) {
                    var iaPlatformCalculatedValue = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'discountedamount', line: i});
                    //log.debug('iaPlatformCalculatedValue', iaPlatformCalculatedValue)
                    totalIaPlatformValue += iaPlatformCalculatedValue

                    if(!isEmpty(revRecStartDate) && !isEmpty(revRecEndDate)) {
                        var startDateEndDateDifference = revRecEndDate - revRecStartDate
                        totalIaPlatformTerm += startDateEndDateDifference
                    }
                }

                if(itemData.iaSeatsItem === true) {
                    var iaSeatsCalculatedValue = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'discountedamount', line: i});
                    //log.debug('premierSupportCalculatedValue', premierSupportCalculatedValue)
                    totalIaSeatsValue += iaSeatsCalculatedValue

                    if(!isEmpty(revRecStartDate) && !isEmpty(revRecEndDate)) {
                        var startDateEndDateDifference = revRecEndDate - revRecStartDate
                        totalIaSeatsTerm += startDateEndDateDifference
                    }

                }
                if(itemData.myPanelItem === true) {
                    var myPanelCalculatedValue = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'discountedamount', line: i});
                    //log.debug('premierSupportCalculatedValue', premierSupportCalculatedValue)
                    totalMyPanelValue += myPanelCalculatedValue

                    if(!isEmpty(revRecStartDate) && !isEmpty(revRecEndDate)) {
                        var startDateEndDateDifference = revRecEndDate - revRecStartDate
                        totalMyPanelTerm += startDateEndDateDifference
                    }
                }
                //end
            }

            newRecord.setValue('custbody_revarg_specialterms', checkSpecialTerms)
            newRecord.setValue('custbody_revarg_specialtermsnotes', revArgSpecialTermsNotes)
            newRecord.setValue('custbody_revarg_termsforconv', checkTermsforConvenience)

            newRecord.setValue('custbody_ut_disc_line_exists', checkDiscountLineinArr)
            newRecord.setValue('custbody_ut_negative_line_exists', checkNegativeRevenueElement)
            newRecord.setValue('custbody_ut_multi_year_deal', checkMultiYearDeal)

            log.debug('totalSubscriptionValue', totalSubscriptionValue)
            log.debug('totalPlatformValue', totalPlatformValue)
            log.debug('totalSeatsValue', totalSeatsValue)
            log.debug('orderId', orderId)

            if (orderId != null && orderId != '')
            {
                var orderLookupObj = search.lookupFields({
                    type: 'customrecord_order',
                    id: orderId,
                    columns: ['custrecord_is_ord_opportunity_name', 'custrecord_is_ord_oppty_close_date']
                });
                
                var opptyName = orderLookupObj.custrecord_is_ord_opportunity_name;
                var opptyDate = orderLookupObj.custrecord_is_ord_oppty_close_date;
                log.debug('opptyName', opptyName);
                log.debug('opptyDate', opptyDate);

                newRecord.setValue('custbody_ut_rev_oppty_name', opptyName)
                newRecord.setValue('custbody_ut_rev_oppty_close_date', opptyDate)
               
            }

          for (var j = 0; revenueElementLineCount != 0 && j < revenueElementLineCount; j++){
                var source = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'source', line: j});

                if (!source.includes('Sales Order')){
                  continue;
                 }
                var subscriptionItemId = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'item', line: j});
                var discountedSalesAmount = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'discountedamount', line: j});

                var revRecStartDate = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'revrecstartdate', line: j});
                revRecStartDate = new Date(revRecStartDate)
                //log.debug('revRecStartDate', revRecStartDate)

                var revRecEndDate = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'revrecenddate', line: j});
                revRecEndDate = new Date(revRecEndDate)
                //log.debug('revRecEndDate', revRecEndDate)

                var manualFairValueOverride = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'custcol_ut_re_manualfvoverride', line: j});
                var sourceIdLookup = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'sourceid', line: j}); // lineuniquekey on SO
                log.debug('sourceIdLookup', sourceIdLookup)

                var subItemData = getItemData(subscriptionItemId);

              var soLineVals;

              if (soLineValsStored[sourceIdLookup]){
                  soLineVals = soLineValsStored[sourceIdLookup];
              } else {
                  soLineVals = getSoLineVals(sourceIdLookup);
                  soLineValsStored[sourceId] = soLineVals;
              }

                if (soLineVals.bypassFvCalc === true){
                    newRecord.setSublistValue({sublistId: 'revenueelement', fieldId: 'fairvalueoverride', line: j, value: true});
                    newRecord.setSublistValue({sublistId: 'revenueelement', fieldId: 'fairvalue', line: j, value: discountedSalesAmount});
                    newRecord.setSublistValue({sublistId: 'revenueelement', fieldId: 'calculatedamount', line: j, value: discountedSalesAmount});
                }

                if(subItemData.premierSupportItem === true && soLineVals.bypassFvCalc === false && manualFairValueOverride === false) {

                    log.audit('Set Premier Support Fair Value Pricing', 'START');


                    if(!isEmpty(revRecStartDate) && !isEmpty(revRecEndDate)) {
                        var premierSupportStartDateEndDateDifference = revRecEndDate - revRecStartDate
                        log.debug('premierSupportStartDateEndDateDifference', premierSupportStartDateEndDateDifference)
                    }

                    if(totalPremierSupportTerm == 0){
                        totalPremierSupportTerm = 1
                    }

                    var percentOfTotal = premierSupportStartDateEndDateDifference/totalPremierSupportTerm
                    if(percentOfTotal == 0){
                        percentOfTotal = 1
                    }


                    var calculatedSubscriptionFairValueAmount = totalSubscriptionValue * (premierSupportPercent/100) * percentOfTotal
                    if(calculatedSubscriptionFairValueAmount == 0){
                        calculatedSubscriptionFairValueAmount = discountedSalesAmount
                    }

                    newRecord.setSublistValue({sublistId: 'revenueelement', fieldId: 'fairvalueoverride', line: j, value: true});
                    newRecord.setSublistValue({sublistId: 'revenueelement', fieldId: 'fairvalue', line: j, value: calculatedSubscriptionFairValueAmount});
                    log.debug('calculatedSubscriptionFairValueAmount', calculatedSubscriptionFairValueAmount)
                    newRecord.setSublistValue({sublistId: 'revenueelement', fieldId: 'calculatedamount', line: j, value: calculatedSubscriptionFairValueAmount});

                    complianceCheck = false

                    log.audit('Set Premier Support Fair Value Pricing', 'END');
                }

                if(subItemData.iaPlatformItem === true  && soLineVals.bypassFvCalc === false && manualFairValueOverride === false) {

                    log.audit('Set IA Platform Fair Value Pricing', 'START');

                    if(!isEmpty(revRecStartDate) && !isEmpty(revRecEndDate)) {
                        var iaPlatformStartDateEndDateDifference = revRecEndDate - revRecStartDate
                    }

                    if(totalIaPlatformTerm == 0){
                        totalIaPlatformTerm = 1
                    }

                    var percentOfTotal = iaPlatformStartDateEndDateDifference/totalIaPlatformTerm
                    if(percentOfTotal == 0){
                        percentOfTotal = 1
                    }

                    var calculatedIAPlatformFairValueAmount = totalPlatformValue * (iaPlatformPercent/100) * percentOfTotal
                    if(calculatedIAPlatformFairValueAmount == 0){
                        calculatedIAPlatformFairValueAmount = discountedSalesAmount
                    }


                    newRecord.setSublistValue({sublistId: 'revenueelement', fieldId: 'fairvalueoverride', line: j, value: true});
                    newRecord.setSublistValue({sublistId: 'revenueelement', fieldId: 'fairvalue', line: j, value: calculatedIAPlatformFairValueAmount});
                    log.debug('calculatedIAPlatformFairValueAmount', calculatedIAPlatformFairValueAmount)
                    newRecord.setSublistValue({sublistId: 'revenueelement', fieldId: 'calculatedamount', line: j, value: calculatedIAPlatformFairValueAmount});

                    complianceCheck = false

                    log.audit('Set IA Platform Fair Value Pricing', 'END');
                }

                if(subItemData.iaSeatsItem === true && soLineVals.bypassFvCalc === false && manualFairValueOverride === false) {

                    log.audit('Set IA Seats Fair Value Pricing', 'START');

                    if(!isEmpty(revRecStartDate) && !isEmpty(revRecEndDate)) {
                        var iaSeatsStartDateEndDateDifference = revRecEndDate - revRecStartDate
                    }

                    if(totalIaSeatsTerm == 0){
                        totalIaSeatsTerm = 1
                    }
                    var percentOfTotal = iaSeatsStartDateEndDateDifference/totalIaSeatsTerm
                    if(percentOfTotal == 0){
                        percentOfTotal = 1
                    }

                    log.debug('percentOfTotal', percentOfTotal)

                    var calculatedIASeatsFairValueAmount = totalSeatsValue * (iaSeatsPercent/100) * percentOfTotal
                    if(calculatedIASeatsFairValueAmount == 0){
                        calculatedIASeatsFairValueAmount = discountedSalesAmount
                    }

                    newRecord.setSublistValue({sublistId: 'revenueelement', fieldId: 'fairvalueoverride', line: j, value: true});
                    newRecord.setSublistValue({sublistId: 'revenueelement', fieldId: 'fairvalue', line: j, value: calculatedIASeatsFairValueAmount});
                    log.debug('calculatedIASeatsFairValueAmount', calculatedIASeatsFairValueAmount)
                    newRecord.setSublistValue({sublistId: 'revenueelement', fieldId: 'calculatedamount', line: j, value: calculatedIASeatsFairValueAmount});

                    complianceCheck = false

                    log.audit('Set IA Seats Fair Value Pricing', 'END');
                }

                if(subItemData.myPanelItem === true  && soLineVals.bypassFvCalc === false && manualFairValueOverride === false) {

                    log.audit('Set MyPanel Fair Value Pricing', 'START');

                    if(!isEmpty(revRecStartDate) && !isEmpty(revRecEndDate)) {
                        var myPanelsStartDateEndDateDifference = revRecEndDate - revRecStartDate
                    }

                    if(totalMyPanelTerm == 0){
                        totalMyPanelTerm = 1
                    }

                    var percentOfTotal = myPanelsStartDateEndDateDifference/totalMyPanelTerm
                    if(percentOfTotal == 0){
                        percentOfTotal = 1
                    }

                    var calculatedMyPanelFairValueAmount = totalPlatformValue * (myPanelPercent/100) * percentOfTotal
                    if(calculatedMyPanelFairValueAmount == 0){
                        calculatedMyPanelFairValueAmount = discountedSalesAmount
                    }

                    newRecord.setSublistValue({sublistId: 'revenueelement', fieldId: 'fairvalueoverride', line: j, value: true});
                    newRecord.setSublistValue({sublistId: 'revenueelement', fieldId: 'fairvalue', line: j, value: calculatedMyPanelFairValueAmount});
                    log.debug('calculatedMyPanelFairValueAmount', calculatedMyPanelFairValueAmount)
                    newRecord.setSublistValue({sublistId: 'revenueelement', fieldId: 'calculatedamount', line: j, value: calculatedMyPanelFairValueAmount});

                    complianceCheck = false

                    log.audit('Set MyPanel Fair Value Pricing', 'END');
                }

            }

            if((type == context.UserEventType.CREATE) && (!isEmpty(complianceCheck))) {
                log.debug('complianceCheck', complianceCheck)
                //newRecord.setValue('compliant', complianceCheck)
               newRecord.setValue('custbody_ut_arr_reallocate', true)
              
            }

            var reallocArr =  newRecord.getValue('custbody_ut_arr_reallocate');
            if ((reallocArr) && (type == context.UserEventType.EDIT))
            {
                  newRecord.setValue('compliant', false)
                  newRecord.setValue('custbody_ut_arr_reallocate', false)
            }
          
            log.audit('type = ' + type, 'Get Revenue Element Data END');


        }

        /**
         * @param {AfterSubmitContext} context
         * @return {void}
         */
        function afterSubmit(context) {
            try {
                log.audit('afterSubmit', {
                    type: context.type,
                    newRecord: {
                        type: context.newRecord.type,
                        id: context.newRecord.id,
                    }
                    //oldRecord: {
                    //  type: context.oldRecord.type,
                    //  id: context.oldRecord.id,
                    //},
                });

                var newRecord = context.newRecord;
                var contextType = newRecord.type

                if(context.type == 'create') {

                    var revenueElementLineCount = newRecord.getLineCount({
                        sublistId: 'revenueelement'
                    });
                    log.debug('AFTER SUBMIT revenueElementLineCount', revenueElementLineCount)

                    for (var i = 0; revenueElementLineCount != 0 && i < revenueElementLineCount; i++) {

                        var sourceId = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'sourceid', line: i});
                        log.debug('sourceId', sourceId)
                        var allocationAmount = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'allocationamount', line: i});
                        log.debug('allocationAmount', allocationAmount)
                        var discountedAmount = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'discountedamount', line: i});
                        log.debug('discountedAmount', discountedAmount)
                        var createRevenuePlansOn = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'createrevenueplanson', line: i});
                        log.debug('createRevenuePlansOn', createRevenuePlansOn)
                        var referenceId = newRecord.getSublistValue({sublistId: 'revenueelement', fieldId: 'referenceid', line: i});
                        log.debug('referenceId', referenceId)

                        if ((createRevenuePlansOn == '1')) {

                            var forecastEvent = record.create({
                                type: record.Type.BILLING_REVENUE_EVENT
                            });

                            var actualEvent = record.create({
                                type: record.Type.BILLING_REVENUE_EVENT
                            });

                            var containsCustCred = referenceId.indexOf('CustCred')
                            if(containsCustCred < 0){
                                forecastEvent.setValue({fieldId: 'recordtype', value: 435});
                                forecastEvent.setValue({fieldId: 'record', value: sourceId});

                                actualEvent.setValue({fieldId: 'recordtype', value: 435});
                                actualEvent.setValue({fieldId: 'record', value: sourceId});

                                var setCreateForecastPlan = record.submitFields({
                                    type: 'customrecord_contractlines',
                                    id: sourceId,
                                    values: {
                                        'custrecord_is_cl_create_forecast_plan': false
                                    }
                                });

                            }else{
                                forecastEvent.setValue({fieldId: 'transactionline', value: sourceId});
                                actualEvent.setValue({fieldId: 'transactionline', value: sourceId});
                            }

                            forecastEvent.setValue({fieldId: 'eventtype', value: 1});
                            forecastEvent.setValue({fieldId: 'eventdate', value: new Date()});
                            forecastEvent.setValue({fieldId: 'eventpurpose', value: 'FORECAST'});
                            forecastEvent.setValue({fieldId: 'amount', value: discountedAmount});
                            //forecastEvent.setValue({fieldId: 'quantity', value: 2 });
                            var forecastEventId = forecastEvent.save();

                            actualEvent.setValue({fieldId: 'eventtype', value: 1});
                            actualEvent.setValue({fieldId: 'eventdate', value: new Date()});
                            actualEvent.setValue({fieldId: 'eventpurpose', value: 'ACTUAL'});
                            actualEvent.setValue({fieldId: 'amount', value: discountedAmount});
                            //actualEvent.setValue({fieldId: 'quantity', value: 2 });
                            var actualEventId = actualEvent.save();

                            //log.audit('forecastEventId', forecastEventId)
                            log.audit('actualEventId', actualEventId)


                        }
                        //end
                    }
                }




            } catch (e) {
                log.error('afterSubmit', JSON.parse(JSON.stringify(e)));
            }
        }


        function isEmpty (stValue) {

            return ((stValue === '' || stValue == null || stValue == undefined) || (stValue.constructor === Array && stValue.length == 0) || (stValue.constructor === Object && (function(v) {
                for (var k in v)
                    return false;
                return true;
            })(stValue)));

        };

        function getItemData (itemId) {

            var ItemLookupObj = search.lookupFields({
                type: search.Type.ITEM,
                id: itemId,
                columns: ['itemrevenuecategory', 'custitem_premier_support', 'custitem_ia_platform',
                    'custitem_ia_seats', 'custitem_mypanel', 'custitem_subscription',  'custitem_platform',
                    'custitem_seats'] //'custitem_otd_item' removed
            });
            var dataObj =  {
                subscriptionItem :ItemLookupObj.custitem_subscription,
                platformItem : ItemLookupObj.custitem_platform,
                seatsItem : ItemLookupObj.custitem_seats,
                discountItem : ItemLookupObj.custitem_discount_item,
                premierSupportItem : ItemLookupObj.custitem_premier_support,
                iaPlatformItem : ItemLookupObj.custitem_ia_platform,
                iaSeatsItem : ItemLookupObj.custitem_ia_seats,
                myPanelItem : ItemLookupObj.custitem_mypanel
            };

            return dataObj;
        }

        function getSoLineVals (lineUID)submit{
            var dataObj = {};
            var soLineSearch = search.create({
                type: search.Type.SALES_ORDER,
                filters:
                    [
                        ["lineuniquekey", "anyof", lineUID]
                    ],
                columns:
                    [
                        'custbody_ord_specialterms',
                        'custbody_is_ord_terms_for_conv',
                        'custbody_ord_specialterms_notes',
                        'custcol_bypass_fvcalc',
                        'custcol_neo_cl_totalotd',
                        'internalid',
                        'custbody_is_ord_opportunity_name',
                        'custbody_is_ord_oppty_close_date',
                        'lineuniquekey'

                    ]
            });
            var searchResultCount = soLineSearch.runPaged().count;
            if (searchResultCount > 0) {
                soLineSearch.run().each(function (result) {
                    dataObj= {
                        'orderId':  result.getValue({name: 'internalid'}),
                        'bypassFvCalc' : result.getValue({name: 'custcol_bypass_fvcalc'}),
                        'contractLineSpecialTerms' : result.getValue({name: 'custbody_ord_specialterms'}),
                        'contractLineTermsforConvenience': result.getValue({name: 'custbody_is_ord_terms_for_conv'}),
                        'contractLineSpecialTermsNotes': result.getValue({name: 'custbody_ord_specialterms_notes'}),
                        'totalOneTimeDiscount': result.getValue({name: 'custcol_neo_cl_totalotd'}),
                        'opptyClseDate': result.getValue({name: 'custbody_is_ord_oppty_close_date'}),
                        'opptyName': result.getValue({name: 'custbody_is_ord_opportunity_name'}),
                        'lineUID': result.getValue({name: 'lineuniquekey'})
                    };
                    return true;
                });
            }
            return dataObj
        }

        return {
            // beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            // afterSubmit: afterSubmit,
        };

    }
);