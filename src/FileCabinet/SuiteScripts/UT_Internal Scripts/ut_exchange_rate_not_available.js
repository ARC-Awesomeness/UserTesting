/**
*currencyExchangeRate.js
*@NApiVersion 2.x
*@NScriptType ClientScript
*/

define(['N/error','N/search','N/runtime','N/email','./currencyExchangeRate'],
    function(error, search, runtime, email, currencyExchangeRate){
        function saveRecord(context){
            try{
                if(runtime.executionContext==runtime.ContextType.USER_INTERFACE){
                    var currentRecord = context.currentRecord;
                    var tranDate = currentRecord.getText({
                        fieldId: 'trandate'
                    });

                    var dateObj = new Date();
                    dateObj = dateObj.toDateString();

                    var tranCurrency = currentRecord.getValue({
                        fieldId: 'currency'
                    });

                    var returnValue = currencyExchangeRate.exchangeRateCheck(tranDate, tranCurrency);

                    return returnValue;
                }
                return true;
            }
            catch(e){
                log.debug('Error occured.' + e);
                var scriptObj = runtime.getCurrentScript();
                var admin_recipients = scriptObj.getParameter({
                  name: 'custscript_ut_admin_error_recipients_je'
                });
              log.debug(scriptObj + admin_recipients);
                email.send({
                    author: admin_recipients,
                    recipients: admin_recipients,
                    subject: 'Error occured. Script| UT - Transaction Exchange Rate Unavailable.',
                    body:'An error occured in saveRecord function:'+ e
                });
            }
            
          return true;
        }
    return{
        saveRecord:saveRecord
    }
});