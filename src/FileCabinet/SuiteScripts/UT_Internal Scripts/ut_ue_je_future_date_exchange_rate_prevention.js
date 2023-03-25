/**
* currencyExchangeRate.js
* @NApiVersion 2.x
* @NScriptType UserEventScript
*/

define(['N/error','N/search','N/runtime','N/email','./currencyExchangeRate'],
    function(error, search, runtime, email, currencyExchangeRate){

        function beforeSubmit(scriptContext){
            var returnValue='';
            if(runtime.executionContext!=runtime.ContextType.USER_INTERFACE){
            //try{
                    var currentRecord = scriptContext.newRecord;
                    var tranDate = currentRecord.getValue({
                        fieldId: 'trandate'
                    });
                    tranDate = JSON.stringify(tranDate);

                    var year = tranDate.substring(1,5);
                    var month = tranDate.substring(6,8);
                    if(month.substring(0,1)=="0"){
                      month = month.substring(1,2);
                    }
                    var day = tranDate.substring(9,11);
                    if(day.substring(0,1)=="0"){
                      day = day.substring(1,2);
                    }

                    tranDate = month+"/"+day+"/"+year;
                    log.debug('Transaction Date is: '+ tranDate);

                    var tran_id = currentRecord.getValue({
                      fieldId: 'tranid'
                    });

                    var dateObj = new Date();
                    dateObj = dateObj.toDateString();

                    var tranCurrency = currentRecord.getValue({
                        fieldId: 'currency'
                    });

                    returnValue = currencyExchangeRate.exchangeRateCheck(tranDate,tranCurrency);
                    log.debug(returnValue, tranDate);

                   if(!returnValue){
                    if(runtime.executionContext!='CSVIMPORT'){
                      log.debug(runtime.executionContext);
                      log.debug('About to Send Email');
                      var scriptObj = runtime.getCurrentScript();
                      var admin_recipients = scriptObj.getParameter({
                          name: 'custscript_ut_ue_je_error_recipients'
                      });
                      var coupaError_recipients = scriptObj.getParameter({
                          name: 'custscript_ut_ue_je_coupa_bills_fx_unavl'
                      });
                      email.send({
                          author: admin_recipients,
                          recipients: coupaError_recipients,
                          subject: 'Exchange Rate Unavailable',
                          body:'Exchange Rate for this Vendor Bill is not available yet in NetSuite: '+ tran_id
                      });
                   }
                      var myCustomError = error.create({
                          name: 'EXCHANGE_RATE_UNAVAILABLE',
                          message: 'Exchange rate is not available yet. Please enter this transaction once the Exchange Rate becomes available.',
                          notifyOff: true
                      });

                      throw myCustomError;
                      return false;

                    }

                    return true;
               
       //     }
         /*   catch(e){
                log.debug('Error occured.' + e);
                var scriptObj = runtime.getCurrentScript();
                var admin_recipients = scriptObj.getParameter({
                  name: 'custscript_ut_ue_je_error_recipients'
                });
              log.debug(scriptObj + admin_recipients);
                email.send({
                    author: admin_recipients,
                    recipients: admin_recipients,
                    subject: 'Exchange Rate Unavailable',
                    body:'An error occured in saveRecord function:'+ e
                });
            }*/
           }
          return returnValue;
        }
    return{
        beforeSubmit:beforeSubmit
    }
});