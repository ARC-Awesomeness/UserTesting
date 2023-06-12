/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @NScriptType UserEventScript
 * @Description Determines the earliest rev rec date and latest one on Items that's POD value is 'Session'
 *
 */
define(['N/search', 'N/record'],

    /**
     * @return {{
     *   beforeSubmit?: Function,
     * }}
     */
    function (search, record) {
        /**
         * @param {BeforeSubmitContext} context
         * @return {void}
         */
        function beforeSubmit(context) {
            try {
                var newRecord = context.newRecord;
                var lineCount = newRecord.getLineCount({
                    sublistId: 'item'});
                var itemArr = getAllItems(newRecord);
                var itemPobMap = getItemsPob(itemArr); //custitem_pob_detail
                var revDates = getRevEarliestLatestDate(newRecord,itemPobMap, lineCount);

                updatePercentComplete(newRecord, lineCount);
                setPobRevDates(newRecord, revDates, itemPobMap, lineCount);

            } catch (e) {
                log.error('beforeSubmit', JSON.parse(JSON.stringify(e)));
                throw e;
            }
        }
        function updatePercentComplete (newRecord, lineCount) {
            for (var i=0; lineCount != 0 && i < lineCount; i++) {
                if ((newRecord.getSublistValue({sublistId: 'item', fieldId: 'custcol_neo_projcomplete_update', line: i}) == true)) {
                    var cumulativePercentComplete = newRecord.getSublistValue({sublistId: 'item', fieldId: 'custcol_neo_projcomplete_percent', line: i});
                    var percentCompleteDate = newRecord.getSublistValue({sublistId: 'item', fieldId: 'custcol_neo_projcomplete_date', line: i});
                    percentCompleteDate = new Date(percentCompleteDate);
                    var lineuniquekey = newRecord.getSublistValue({sublistId: 'item', fieldId: 'lineuniquekey', line: i});

                    var actualEvent = record.create({
                        type: record.Type.BILLING_REVENUE_EVENT,
                    });

                    actualEvent.setValue({fieldId: 'transactionline', value: lineuniquekey});
                    actualEvent.setValue({fieldId: 'eventtype', value: 2});
                    actualEvent.setValue({fieldId: 'eventpurpose', value: 'ACTUAL'});
                    actualEvent.setValue({fieldId: 'eventdate', value: percentCompleteDate});
                    actualEvent.setValue({fieldId: 'cumulativepercentcomplete', value: cumulativePercentComplete});

                    var actualEventId = actualEvent.save();
                    log.debug('actualEventId', actualEventId);

                    newRecord.setSublistValue({sublistId: 'item', fieldId: 'custcol_neo_projcomplete_update', line: i, value: false})
                }
            }
            return;
        }
        function setPobRevDates (newRecord, revDates, itemPobMap, lineCount) {
            // Set All Session Item Dates to earliest and Latest
            for (var i=0; lineCount != 0 && i < lineCount; i++) {
                var item = newRecord.getSublistValue({sublistId: 'item', fieldId: 'item', line: i});

                if(itemPobMap[item] == 'Session Units'){
                    newRecord.setSublistValue({sublistId: 'item', fieldId: 'custcol1', line: i, value: revDates.earliest});
                    newRecord.setSublistValue({sublistId: 'item', fieldId: 'custcol_neo_cl_su_startdate', line: i, value: revDates.earliest});
                    newRecord.setSublistValue({sublistId: 'item', fieldId: 'custcol2', line: i, value: revDates.latest});
                    newRecord.setSublistValue({sublistId: 'item', fieldId: 'custcol_neo_cl_su_enddate', line: i, value: revDates.latest});
                }
            }
            newRecord.setValue({ fieldId: 'custbody_ord_su_startdate', value: revDates.earliest});
            newRecord.setValue({ fieldId: 'custbody_ord_su_enddate', value: revDates.latest});
        }
        function getRevEarliestLatestDate (newRecord, itemPobMap, lineCount){
            var earliestRevDate = new Date ();
            var latesetRevDate = null;

            //For all Session items determine earliest date and latest date
            for (var i=0; lineCount != 0 && i < lineCount; i++){
                var item = newRecord.getSublistValue({sublistId: 'item', fieldId: 'item', line: i});

                if(itemPobMap[item] == 'Session Units'){

                    var revRecStartDate = new Date(newRecord.getSublistValue({sublistId: 'item', fieldId:'custcol1', line: i}));
                    var revRecEndDate = new Date(newRecord.getSublistValue({sublistId: 'item', fieldId:'custcol2', line: i}));

                    if (revRecStartDate < earliestRevDate) {
                        earliestRevDate = revRecStartDate;
                    }

                    if (latesetRevDate < revRecEndDate) {
                        latesetRevDate = revRecEndDate;
                    }
                }
            }

            return {'earliest': earliestRevDate , 'latest':latesetRevDate};
        }
        function getAllItems(record){
            var itemArr = [];
            var lineCount = record.getLineCount({
                sublistId: 'item'});

            for (var i=0; lineCount != 0 && i < lineCount; i++) {
                var item = record.getSublistValue({sublistId: 'item', fieldId: 'item', line: i});
                itemArr.push(item);
            }
            return itemArr;
        }
function getItemsPob(items){
    var dataObj  = {};
    var soLineSearch = search.create({
        type: search.Type.ITEM,
        filters:
            [
                ["internalid", "anyof", items]
            ],
        columns:['custitem_pob_detail', 'internalid']
    });
    var searchResultCount = soLineSearch.runPaged().count;
    if (searchResultCount > 0) {
        soLineSearch.run().each(function (result) {
            dataObj [ result.getValue({name: 'internalid'})]=result.getValue({name: 'custitem_pob_detail'});
            return true;
        });
    }
    return dataObj;
}
        return {
            beforeSubmit: beforeSubmit
        };
    }
);