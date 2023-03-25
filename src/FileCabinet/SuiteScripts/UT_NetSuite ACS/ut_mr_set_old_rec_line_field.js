/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript

 * Version    Date             Author           Remarks
 * 1.00     06 April 2022    Khushali patel   Case 4630136
 *
 */
define(['N/file', 'N/search', 'N/record', 'N/email', 'N/runtime', 'N/log', 'N/format', 'N/currentRecord'], function(file, search, record, email, runtime, log, format, currentrecord) {

    var FUNC_NAME;
    function itemList(entity, objRecord) {
        var lineCountItem = objRecord.getLineCount({
            sublistId: 'item'
        });
        if (lineCountItem != 0) {
            for (var i = 0; i < lineCountItem; i++) {
                objRecord.setSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_entity_from_header_or_line',
                    line: i,
                    value: entity
                });
            }
        }
        objRecord.save();
    }

    function expenseList(entity, objRecord) {
        var lineCountExpenses = objRecord.getLineCount({
            sublistId: 'expense'
        });
        if (lineCountExpenses != 0) {
            for (var y = 0; y < lineCountExpenses; y++) {
                objRecord.setSublistValue({
                    sublistId: 'expense',
                    fieldId: 'custcol_entity_from_header_or_line',
                    line: y,
                    value: entity
                });
            }
        }
        objRecord.save();
    }

    function itemExpenseList(entity, objRecord) {
      var lineCountItem = objRecord.getLineCount({
          sublistId: 'item'
      });
      var lineCountExpenses = objRecord.getLineCount({
          sublistId: 'expense'
      });

      if (lineCountItem == 0 || lineCountItem == -1){
        log.debug('lineCountItem == 0');

      }else{
        for(var i = 0; i < lineCountItem; i++){
          objRecord.setSublistValue({sublistId:'item',fieldId:'custcol_entity_from_header_or_line',line:i,value:entity});
        }
      }
      if (lineCountExpenses == 0 || lineCountExpenses == -1){
        log.debug('lineCountExpenses == 0');

      }else{
        for(var j = 0; j < lineCountExpenses; j++){
          objRecord.setSublistValue({sublistId:'expense',fieldId:'custcol_entity_from_header_or_line',line:j,value:entity});
        }
      }
        objRecord.save();
    }
    function getErrorInfo(e, context) {
        var retval = 'error: ';
        if (typeof e.message !== 'undefined' && e.message != null) {
            retval += e.message;
        } else {
            retval += JSON.stringify(e);
        }
        if (e.stack !== 'undefined') {
            retval += ' @ ' + e.stack;
        }

        retval += ' context: ' + JSON.stringify(context);
        return retval;
    }

    function getInputData() {
        FUNC_NAME = 'Get Input';
        try {
            //loading search
            var searchResults = search.load({
                id: 'customsearch_retrieve_tran_rec',
            });
            log.debug(
                FUNC_NAME,
                'Search Results:' + '  ' + JSON.stringify(searchResults)
            );
            return searchResults;
        } catch (e) {
            log.error('Unexpected error in getInputData:', getErrorInfo(e, context));
        }
    }

    function reduce(context) {
        try {
            FUNC_NAME = 'Reduce';
            //log.debug(FUNC_NAME, context);
            var internalId = JSON.parse(context.key);
            log.debug(FUNC_NAME, 'internalId: ' + internalId);

            var valuesContext = JSON.parse(context.values[0]);
            //log.debug(FUNC_NAME, 'valuesContext: ' + JSON.stringify(valuesContext));
            var type = valuesContext.recordType;
            //log.debug(FUNC_NAME, 'recType: ' + JSON.stringify(type));

            var entity = valuesContext.values.entity.value;
            //log.debug(FUNC_NAME, 'entity: ' + JSON.stringify(entity));

            if (type == 'creditmemo') {
                var objRecord = record.load({
                    type: record.Type.CREDIT_MEMO,
                    id: internalId,
                });
                itemList(entity, objRecord);
            } else if (type == 'journalentry') {
                var objRecord = record.load({
                    type: record.Type.JOURNAL_ENTRY,
                    id: internalId,
                });
                var linecount = objRecord.getLineCount({
                    sublistId: 'line'
                });
                if (linecount != 0) {
                    for (var h = 0; h < linecount; h++) {
                        var entityName = objRecord.getSublistValue({
                            sublistId: 'line',
                            fieldId: 'entity',
                            line: h
                        });
                        objRecord.setSublistValue({
                            sublistId: 'line',
                            fieldId: 'custcol_entity_from_header_or_line',
                            line: h,
                            value: entityName
                        });
                    }
                }
                objRecord.save();
            } else if (type == 'check') {
                var objRecord = record.load({
                    type: record.Type.CHECK,
                    id: internalId,
                });
                itemExpenseList(entity, objRecord);
            } else if (type == 'vendorbill') {
                var objRecord = record.load({
                    type: record.Type.VENDOR_BILL,
                    id: internalId,
                });
                itemExpenseList(entity, objRecord);
            } else if (type == 'expensereport') {
                var objRecord = record.load({
                    type: record.Type.EXPENSE_REPORT,
                    id: internalId,
                });
                expenseList(entity, objRecord);
            } else if (type == 'vendorcredit') {
                var objRecord = record.load({
                    type: record.Type.VENDOR_CREDIT,
                    id: internalId,
                });
                itemExpenseList(entity, objRecord);
            } else if (type == 'revenuearrangement') {
                var objRecord = record.load({
                    type: record.Type.REVENUE_ARRANGEMENT,
                    id: internalId,
                });
                var lineCountItem = objRecord.getLineCount({
                    sublistId: 'revenueelement'
                });
                //log.debug('lineCountItem Revenueelement', lineCountItem);
                if (lineCountItem != 0) {
                    for (var k = 0; k < lineCountItem; k++) {
                        objRecord.setSublistValue({
                            sublistId: 'revenueelement',
                            fieldId: 'custcol_entity_from_header_or_line',
                            line: k,
                            value: entity
                        });
                    }
                }
                objRecord.save();
            } else if (type == 'invoice') {
                var objRecord = record.load({
                    type: record.Type.INVOICE,
                    id: internalId,
                });
                itemList(entity, objRecord);
            }
            return true;

        } catch (ex) {
          var msg = '';
          if (typeof ex.getStackTrace === 'function') {
              msg = ex.toString() + '<br />' + ex.getStackTrace().join('<br />');
          } else if (ex.stack) {
              msg = ex.toString() + ex.stack;
          } else {
              msg = ex.toString();
          }
          log.debug('Checking', 'Error : ' + msg);
          var message = ex.message;

          email.send({
              author: 80342,
              recipients: 'kpatel@netsuite.com',
              subject: 'Error occurred while saving Transaction record' + type,
              body: 'Error : ' + message + 'for Internal Id' + internalId + 'and type ' + type
          });

          return true;
        }
    }
    return {
        getInputData: getInputData,
        reduce: reduce,
        //summarize: summarize
    };
});
