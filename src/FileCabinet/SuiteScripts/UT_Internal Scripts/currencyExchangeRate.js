/**
 * currencyExchangeRate.js
 * @NApiVersion 2.x
 */
define(['N/search'], function(search){

    function exchangeRateCheck(tranDate, tranCurrency){
                   var currencyrateSearchObj = search.create({
                                type: "currencyrate",
                                filters:
                                [
                                     ["effectivedate","on",tranDate]
                                ],
                                columns:
                                [
                                     search.createColumn({
                                        name: "effectivedate",
                                        sort: search.Sort.DESC,
                                        label: "Effective Date"
                                     })
                                ]
                            });
                    
                    var resultcount = currencyrateSearchObj.runPaged().count;

                    log.debug(resultcount);
                    
                    if(resultcount == 0 && tranCurrency != '1'){
                        alert('Exchange rate is not available yet. Please enter this transaction once the Exchange Rate becomes available.');
                        return false;
                    }else{
                        return true; 
                    }
            }
   

    return {
        exchangeRateCheck: exchangeRateCheck
    }
});