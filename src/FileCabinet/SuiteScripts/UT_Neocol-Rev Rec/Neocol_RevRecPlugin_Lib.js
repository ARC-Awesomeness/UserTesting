/**
 * Revenue Management Plug-in Library
 * @suiteScriptVersion 2.x
 */
define(['N/search', 'N/record', 'N/runtime', 'N/format'],
    function (search, record,runtime, format) {
        var sourceRecordType = 'customrecord_contractlines';

        var ALL_SOURCE_DATA = {};
        var SOURCE_EXTERNAL_ID_TO_SOURCE_ID = {};

        var NEW_SOURCE_EXTERNAL_IDS = [];
        var UPDATE_SOURCE_EXTERNAL_IDS = [];

        var itemRevenueCategoryObj = {
            subscription: '1',
            professionalServices: '2',
            usage : '3',
            units : '4'
        }

        var customrecord_contractlinesSearchObj = search.load({
            id: 'customsearch_clsearch_revrecplugin'
        })

        var searchResultCount = customrecord_contractlinesSearchObj.runPaged().count;
        log.debug("customrecord_contractlinesSearchObj result count",searchResultCount);
        //log.debug('searchresult', customrecord_contractlinesSearchObj)

        if (searchResultCount > 0){
            customrecord_contractlinesSearchObj.run().each(function(result){

                //var scriptObj = runtime.getCurrentScript();
                //log.debug('Remaining governance units: ' + scriptObj.getRemainingUsage());

                var internalId = result.getValue({name: 'internalid'})
                var sourceExternalId = result.getValue({name: 'custrecord_is_cl_source_ext_id'});
                var newSourceExternalId = result.getValue({name: 'custrecord_is_new_ext_id'});
                var updateSourceExternalId = result.getValue({name: 'custrecord_is_update_rev_element'});
                var department = result.getValue({name: 'custrecord_neo_cl_department'});
                var customer = result.getValue({name: 'custrecord_is_cl_customer'})
                var quantity = result.getValue({name: 'custrecord_is_cl_quantity'})

                var salesPrice = parseFloat(result.getValue({name: 'custrecord_is_cl_price'}))
                var itemQty = parseFloat(result.getValue('custrecord_is_cl_quantity'));
                var regularUnitPrice = parseFloat(result.getValue('custrecord_neo_cl_regunitprice'));
                var oneTimeDiscount = parseFloat(result.getValue('custrecord_neo_cl_totalotd'));

                var createRevenuePlansOn = result.getValue({
                    name: "createrevenueplanson",
                    join: "CUSTRECORD_IS_CL_ITEM"
                });
                log.debug('createRevenuePlansOn', createRevenuePlansOn)
                var revenueElement = result.getValue({name: 'custrecord_is_cl_job'})
                
                var otditem = result.getValue({
                    name: "custitem_otd_item",
                    join: "CUSTRECORD_IS_CL_ITEM"
                });

                var discountedSalesAmount = parseFloat(result.getValue({name: 'custrecord_neo_cl_discountedsalesamount'}))

                if(isEmpty(discountedSalesAmount)){
                    if (itemQty == null || itemQty == '' || isNaN(itemQty))
                        itemQty = 0;
                    if (salesPrice == null || salesPrice == '' || isNaN(salesPrice))
                        salesPrice = 0;
                    if (oneTimeDiscount == null || oneTimeDiscount == '' || isNaN(oneTimeDiscount))
                        oneTimeDiscount = 0;
                    discountedSalesAmount = (itemQty * salesPrice) + oneTimeDiscount;
                }

                var salesAmount = parseFloat(result.getValue({name: 'custrecord_neo_cl_salesamount'}))
                if(isEmpty(salesAmount)) {
                    if (itemQty == null || itemQty == '' || isNaN(itemQty))
                        itemQty = 0;
                    if (regularUnitPrice == null || regularUnitPrice == '' || isNaN(regularUnitPrice))
                        regularUnitPrice = 0;
                    salesAmount = (itemQty * regularUnitPrice)
                }
              
              	if(otditem == true){
                    salesAmount = discountedSalesAmount
                }

                var revRecStartDate = result.getValue({name: 'custrecord_is_revrec_startdate'})
                var revRecEndDate = result.getValue({name: 'custrecord_is_revrec_enddate'})

                var pobDetail = result.getValue({name: 'custrecord_neo_cl_pobdetail'})
                if(pobDetail == 'Session Units'){

                    var suEarliestStartDate = result.getValue({name: 'custrecord_neo_cl_su_startdate'})
                    var suLatestEndDate = result.getValue({name: 'custrecord_neo_cl_su_enddate'})

                    if(!isEmpty(suEarliestStartDate)){
                        revRecStartDate = suEarliestStartDate
                    }
                    if(!isEmpty(suLatestEndDate)){
                        revRecEndDate = suLatestEndDate
                    }
                }


                if ((newSourceExternalId == true) && (isEmpty(revenueElement))){
                    NEW_SOURCE_EXTERNAL_IDS.push(sourceExternalId)
                }
                if (updateSourceExternalId == true){
                    UPDATE_SOURCE_EXTERNAL_IDS.push(sourceExternalId)
                }

                SOURCE_EXTERNAL_ID_TO_SOURCE_ID[sourceExternalId] = result.getValue({name: 'internalid'})

                ALL_SOURCE_DATA[sourceExternalId] = {
                    order : result.getValue({name: 'custrecord_is_cl_order'}),
                    item : result.getValue({name: 'custrecord_is_cl_item'}),
                    quantity : quantity,
                    price : salesPrice,
                    totalprice : result.getValue({name: 'custrecord_is_cl_totalprice'}),
                    customer : customer,
                    date : result.getValue({name: 'custrecord_is_cl_date'}),
                    sed : result.getValue({name: 'custrecord_is_cl_source_ext_id'}),
                    revrecstartdate : revRecStartDate,
                    revrecenddate : revRecEndDate,
                    subsidiary : result.getValue({name: 'custrecord_is_cl_subsidiary'}),
                    currency : result.getValue({name: 'custrecord_is_cl_currency'}),
                    department : department,
                    salesamount: salesAmount,
                    discountedsalesamount: discountedSalesAmount,
                    //accountingbook : accountingBook,
                };

                //log.debug('revrecstartdate', result.getValue({name: 'custrecord_revrec_startdate'}))
                //log.debug('revrecenddate', result.getValue({name: 'custrecord_revrec_enddate'}))


                // .run().each has a limit of 4,000 results
                return true;
            });
        }

        //log.debug("ALL_SOURCE_DATA", ALL_SOURCE_DATA)
        //log.debug("SOURCE_EXTERNAL_ID_TO_SOURCE_ID", SOURCE_EXTERNAL_ID_TO_SOURCE_ID)
        //log.debug("NEW_SOURCE_EXTERNAL_IDS", NEW_SOURCE_EXTERNAL_IDS)
        //log.debug("UPDATE_SOURCE_EXTERNAL_IDS", UPDATE_SOURCE_EXTERNAL_IDS)


        function getSourceRecordType() {
            return sourceRecordType;
        }

        function getSourceExternalIdsForRevenueElementCreation() {
            return NEW_SOURCE_EXTERNAL_IDS;
        }

        function getSourceExternalIdsForRevenueElementUpdate() {
            return UPDATE_SOURCE_EXTERNAL_IDS;
        }

        function getOrder(sourceExternalId) {
            return ALL_SOURCE_DATA[sourceExternalId].order;
        }

        function getArrangementKey(sourceExternalId) {

            var arrangementKey
            if(!isEmpty(ALL_SOURCE_DATA[sourceExternalId])) {
                arrangementKey = ALL_SOURCE_DATA[sourceExternalId].order
            }else{

                var contractLineObj = getContractLineData(sourceExternalId)
                arrangementKey = contractLineObj.order
            }
            log.debug('arrangementKey', arrangementKey)
            return arrangementKey;
        }

        function getSubsidiary(sourceExternalId) {
            return ALL_SOURCE_DATA[sourceExternalId].subsidiary;
        }

        function getCurrency(sourceExternalId) {
            return ALL_SOURCE_DATA[sourceExternalId].currency;
        }

        function getAccountingBook(sourceExternalId) {
            return ALL_SOURCE_DATA[sourceExternalId].accountingbook;
        }

        function getItem(sourceExternalId) {
            return ALL_SOURCE_DATA[sourceExternalId].item;
        }

        function getQuantity(sourceExternalId) {
            var quantity
            if(!isEmpty(ALL_SOURCE_DATA[sourceExternalId])) {
                quantity = ALL_SOURCE_DATA[sourceExternalId].quantity;
            }else{

                var contractLineObj = getContractLineData(sourceExternalId)
                quantity = contractLineObj.quantity
            }
            //log.debug('quantity', quantity)
            return quantity
        }

        function getPrice(sourceExternalId) {
            var price
            if(!isEmpty(ALL_SOURCE_DATA[sourceExternalId])) {
                price = ALL_SOURCE_DATA[sourceExternalId].price;
            }else{
                var contractLineObj = getContractLineData(sourceExternalId)
                price = contractLineObj.price
            }
            //log.debug('price', price)
            return price
        }

        function getSalesAmount(sourceExternalId) {

            var salesamount
            if(!isEmpty(ALL_SOURCE_DATA[sourceExternalId])) {
                salesamount = ALL_SOURCE_DATA[sourceExternalId].salesamount;
            }else{
                var contractLineObj = getContractLineData(sourceExternalId)
                salesamount = contractLineObj.salesamount
            }
            //log.debug('salesamount', salesamount)

            return salesamount;
        }

        function getDiscountedSalesAmount(sourceExternalId) {

            var discountedsalesamount
            if(!isEmpty(ALL_SOURCE_DATA[sourceExternalId])) {
                discountedsalesamount = ALL_SOURCE_DATA[sourceExternalId].discountedsalesamount;
            }else{
                var contractLineObj = getContractLineData(sourceExternalId)
                discountedsalesamount = contractLineObj.discountedsalesamount
            }
            //log.debug('discountedsalesamount', discountedsalesamount)

            return discountedsalesamount;
        }

        function getCustomer(sourceExternalId) {
            var customer
            if(!isEmpty(ALL_SOURCE_DATA[sourceExternalId])) {
                customer = ALL_SOURCE_DATA[sourceExternalId].customer;
            }else{
                var contractLineObj = getContractLineData(sourceExternalId)
                customer = contractLineObj.customer
            }
            //log.debug('customer', customer)
            return customer
        }

        function getDate(sourceExternalId) {
            var date
            if(!isEmpty(ALL_SOURCE_DATA[sourceExternalId])) {
                date = ALL_SOURCE_DATA[sourceExternalId].date;
            }else{
                var contractLineObj = getContractLineData(sourceExternalId)
                date = contractLineObj.date
            }
            //log.debug('quantity', quantity)
            return date
        }

        function getRevRecStartDate(sourceExternalId) {
            var revrecstartdate
            if(!isEmpty(ALL_SOURCE_DATA[sourceExternalId])) {
                revrecstartdate = ALL_SOURCE_DATA[sourceExternalId].revrecstartdate;
            }else{
                var contractLineObj = getContractLineData(sourceExternalId)
                revrecstartdate = contractLineObj.revrecstartdate
            }
            //log.debug('quantity', quantity)
            return revrecstartdate
        }

        function getRevRecEndDate(sourceExternalId) {
            var revrecenddate
            if(!isEmpty(ALL_SOURCE_DATA[sourceExternalId])) {
                revrecenddate = ALL_SOURCE_DATA[sourceExternalId].revrecenddate;
            }else{
                var contractLineObj = getContractLineData(sourceExternalId)
                revrecenddate = contractLineObj.revrecenddate
            }
            //log.debug('quantity', quantity)
            return revrecenddate
        }

        function getDepartment(sourceExternalId) {
            var department
            if(!isEmpty(ALL_SOURCE_DATA[sourceExternalId])) {
                department = ALL_SOURCE_DATA[sourceExternalId].department;
            }else{
                var contractLineObj = getContractLineData(sourceExternalId)
                department = contractLineObj.department
            }
            //log.debug('quantity', quantity)
            return department
            return ALL_SOURCE_DATA[sourceExternalId].department;
        }


        function getSourceIdFromSourceExternalId(sourceExternalId)
        {
            return SOURCE_EXTERNAL_ID_TO_SOURCE_ID[sourceExternalId];
        }

        function notifyRevenueElementCreated(context)
        {
            var revenueElementId = context.input.revenueElement.revenueElementId;
            log.audit('Revenue Element created: ', revenueElementId);

        }

        function isEmpty (stValue) {

            return ((stValue === '' || stValue == null || stValue == undefined) || (stValue.constructor === Array && stValue.length == 0) || (stValue.constructor === Object && (function(v) {
                for (var k in v)
                    return false;
                return true;
            })(stValue)));

        };

        function getContractLineData(sourceExternalId){

            var contractLineObj = {}
            var customrecord_contractlinesSearchObj = search.create({
                type: "customrecord_contractlines",
                filters:
                    [
                        ["custrecord_is_cl_source_ext_id", "is", sourceExternalId],
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({name: "internalid", label: "Internal ID"}),
                        search.createColumn({name: "custrecord_is_cl_order", label: "Order"}),
                        search.createColumn({name: "custrecord_is_cl_customer", label: "Customer"}),
                        search.createColumn({name: "custrecord_is_cl_date", label: "Date"}),
                        search.createColumn({name: "custrecord_is_cl_item", label: "Item"}),
                        search.createColumn({name: "custrecord_is_cl_quantity", label: "Quantity"}),
                        search.createColumn({name: "custrecord_is_cl_price", label: "Price"}),
                        search.createColumn({name: "custrecord_neo_cl_listunitprice", label: "List Unit Price"}),
                        search.createColumn({name: "custrecord_neo_cl_regunitprice", label: "Regular Unit Price"}),
                        search.createColumn({name: "custrecord_is_cl_totalprice", label: "Total Price"}),
                        search.createColumn({name: "custrecord_neo_cl_totalotd", label: "Total One Time Discount"}),
                        search.createColumn({name: "custrecord_is_cl_source_ext_id", label: "Source External ID"}),
                        search.createColumn({name: "custrecord_is_cl_revenue_element", label: "Revenue Element"}),
                        search.createColumn({name: "custrecord_is_new_ext_id", label: "New Source External ID"}),
                        search.createColumn({name: "custrecord_is_update_rev_element", label: "Update Revenue Element"}),
                        search.createColumn({name: "custrecord_is_revrec_startdate", label: "Rev Rec Start Date"}),
                        search.createColumn({name: "custrecord_is_revrec_enddate", label: "Rev Rec End Date"}),
                        search.createColumn({
                            name: "createrevenueplanson",
                            join: "CUSTRECORD_IS_CL_ITEM",
                            label: "Create Revenue Plans On"
                        }),
                        search.createColumn({name: "custrecord_neo_cl_itemrevcat", label: "Item Revenue Category"}),
                        search.createColumn({name: "custrecord_is_cl_subsidiary", label: "Subsidiary"}),
                        search.createColumn({name: "custrecord_is_cl_currency", label: "Currency"}),
                        search.createColumn({name: "custrecord_is_cl_create_forecast_plan", label: "Create Recognition Forecast Plan"}),
                        search.createColumn({name: "custrecord_neo_cl_department", label: "Department"}),
                        search.createColumn({name: "custrecord_neo_cl_salesamount", label: "Sales Amount"}),
                        search.createColumn({name: "custrecord_neo_cl_discountedsalesamount", label: "Discounted Sales Amount"}),
                        search.createColumn({name: "custrecord_is_cl_location", label: "Location"})
                    ]
            });
            var searchResultCount = customrecord_contractlinesSearchObj.runPaged().count;
            //log.debug("customrecord_contractlinesSearchObj result count",searchResultCount);
            customrecord_contractlinesSearchObj.run().each(function(result){

                var itemQty = parseFloat(result.getValue('custrecord_is_cl_quantity'));
                var regularUnitPrice = parseFloat(result.getValue('custrecord_neo_cl_regunitprice'));

                var salesAmount = parseFloat(result.getValue({name: 'custrecord_neo_cl_salesamount'}))
                if(isEmpty(salesAmount)) {
                    if (itemQty == null || itemQty == '' || isNaN(itemQty))
                        itemQty = 0;
                    if (regularUnitPrice == null || regularUnitPrice == '' || isNaN(regularUnitPrice))
                        regularUnitPrice = 0;
                    salesAmount = (itemQty * regularUnitPrice)
                }



                contractLineObj = {
                    order : result.getValue({name: 'custrecord_is_cl_order'}),
                    item : result.getValue({name: 'custrecord_is_cl_item'}),
                    quantity : result.getValue({name: 'custrecord_is_cl_quantity'}),
                    price : result.getValue({name: 'custrecord_is_cl_price'}),
                    totalprice : result.getValue({name: 'custrecord_is_cl_totalprice'}),
                    customer : result.getValue({name: 'custrecord_is_cl_customer'}),
                    date : result.getValue({name: 'custrecord_is_cl_date'}),
                    sed : result.getValue({name: 'custrecord_is_cl_source_ext_id'}),
                    revrecstartdate : result.getValue({name: 'custrecord_is_revrec_startdate'}),
                    revrecenddate : result.getValue({name: 'custrecord_is_revrec_enddate'}),
                    subsidiary : result.getValue({name: 'custrecord_is_cl_subsidiary'}),
                    currency : result.getValue({name: 'custrecord_is_cl_currency'}),
                    department : result.getValue({name: 'custrecord_neo_cl_department'}),
                    salesamount : salesAmount,
                    discountedsalesamount: result.getValue({name: 'custrecord_neo_cl_discountedsalesamount'}),
                    //revcontract: result.getValue({name: 'custrecord_ct_revrec_contract'}),
                    //accountingbook : accountingBook,
                };

                // .run().each has a limit of 4,000 results
                return true;
            });
            return contractLineObj
        }

        return {
            getSourceRecordType : getSourceRecordType,
            getSourceExternalIdsForRevenueElementUpdate : getSourceExternalIdsForRevenueElementUpdate,
            getSourceExternalIdsForRevenueElementCreation : getSourceExternalIdsForRevenueElementCreation,
            getRevRecStartDate : getRevRecStartDate,
            getRevRecEndDate : getRevRecEndDate,
            getOrder : getOrder,
            getArrangementKey : getArrangementKey,
            getSubsidiary : getSubsidiary,
            getCurrency : getCurrency,
            getAccountingBook : getAccountingBook,
            getSalesAmount : getSalesAmount,
            getDiscountedSalesAmount : getDiscountedSalesAmount,
            getItem : getItem,
            getQuantity : getQuantity,
            getPrice : getPrice,
            getCustomer : getCustomer,
            getDate : getDate,
            getDepartment : getDepartment,
            getSourceIdFromSourceExternalId : getSourceIdFromSourceExternalId,
            notifyRevenueElementCreated : notifyRevenueElementCreated
        };
    }
);