/**
* @NScriptType UserEventScript
* @NApiVersion 2.x
*
*Version    Date        Author            Case       Remarks
*1.0      04/04/2022   Khushali Patel    4630136    Initial Version
* 01/09/2023 Harleen Kaur Change made to prevent this script from running on voiding reversal journal entries
*/

define(['N/currentRecord', 'N/log', 'N/error', 'N/runtime', 'N/search'], function (record, log, error, runtime, search) {
    function beforeSubmit(context){
      var rec = context.newRecord;
      var recType = rec.getValue({
          fieldId: 'baserecordtype'
      });
      
      log.debug('recType', recType);          
      
       if((recType == 'journalentry') || (recType == 'advintercompanyjournalentry')){
         //start HK 01/09/23
       	var is_void = rec.getValue({
        fieldId: 'void'
     	 });
       	 log.debug('is_void '+ is_void);
         //inserted if block below and end HK 01/09/23
         if(!is_void){
           log.debug(is_void+' is_void');
        var linecount = rec.getLineCount({sublistId:'line'});
        for(var k = 0; k < linecount; k++){
          var entityName = rec.getSublistValue({sublistId:'line',fieldId:'entity',line:k});
          rec.setSublistValue({sublistId:'line',fieldId:'custcol_entity_from_header_or_line',line:k,value:entityName});
        }
       }
       }else if (recType == 'revenuearrangement') {
          var entityName = rec.getValue('entity');
          var lineCountItem = rec.getLineCount({
              sublistId: 'revenueelement'
          });
          if (lineCountItem != 0) {
              for (var h = 0; h < lineCountItem; h++) {
                  rec.setSublistValue({
                      sublistId: 'revenueelement',
                      fieldId: 'custcol_entity_from_header_or_line',
                      line: h,
                      value: entityName
                  });
              }
          }
      }else{
        var entityName = rec.getValue('entity');
        log.debug('entityname', entityName);
        var lineCountItem = rec.getLineCount({sublistId:'item'});
        var lineCountExpenses = rec.getLineCount({sublistId:'expense'});
        lineCountItem = parseInt(lineCountItem);
        lineCountExpenses = parseInt(lineCountExpenses);
          if (lineCountItem == 0 || lineCountItem == -1){
            log.debug('lineCountItem == 0');

          }else{
            for(var i = 0; i < lineCountItem; i++){
              rec.setSublistValue({sublistId:'item',fieldId:'custcol_entity_from_header_or_line',line:i,value:entityName});
            }
          }
          if (lineCountExpenses == 0 || lineCountExpenses == -1){
            log.debug('lineCountExpenses == 0');
          }else{

            for(var j = 0; j < lineCountExpenses; j++){
              rec.setSublistValue({sublistId:'expense',fieldId:'custcol_entity_from_header_or_line',line:j,value:entityName});
            }
          }
      }
    }
    return {
        beforeSubmit: beforeSubmit
    }
});