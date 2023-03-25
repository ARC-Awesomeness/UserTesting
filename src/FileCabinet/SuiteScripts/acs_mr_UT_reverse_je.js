/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 ** Version      Date            Author          Remarks
 *1.00         Dec 9th, 2022    USHAH       Initial Version
 *
 *This script will be scheduled to run on the Month end to reverse the local Allocation Journal Entries 
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/error', 'N/log', 'N/format', 'N/transaction'],
    function(search, record, email, runtime, error, log, format, transaction) {
        /**
         *Get Input Stage gathering the requried data to perform void process
         *
         */
        function getInputData() {
  
            var FUNC_NAME = "getInputData";
          //reteriving the script parameters
            var currentScriptParamters = runtime.getCurrentScript();
            var tranSearch = currentScriptParamters.getParameter('custscript_je_search');
            
            return search.load({
                id: tranSearch
            });
            
        }
        /**
         *Reteireve the search results to process the void process
         */
        function map(context) {
            var FUNC_NAME = 'MAP';
            try{
            log.debug(FUNC_NAME, 'Start');
            var currentScriptParamters = runtime.getCurrentScript();
            var results = JSON.parse(context.value);
            log.debug(FUNC_NAME,'The results are: '+JSON.stringify(results));
            var journalInternalId = results.values['GROUP(internalid)'].value;
            var subsidiary = results.values['GROUP(subsidiary)'].value;
            log.debug(FUNC_NAME,'The Journal Id is: '+ journalInternalId + ' and subsidiary is '+subsidiary);
            if(journalInternalId){
                CreateReverseJE(journalInternalId,subsidiary);
            }
            }
          catch(e){
            log.error(FUNC_NAME,'The error is: '+e);
          } 
        }

        //This function will send out an email once script has done processing. Right now it is sending to me but can be changed later.
        function summarize(summary) {
            var FUNC_NAME = 'summarize';
            var currentScriptParamters = runtime.getCurrentScript();
            var author = -5;
            var recipients = currentScriptParamters.getParameter('custscript_notify_email');
            var subject = 'Script Execution is completed';
            var body = 'Script Execution is Completed';
            var date1 = new Date();
            log.debug(FUNC_NAME, 'Exit Time' + date1);

        }
        
        /**
         *This function is called from VoidPayment as well as InoviceReversal functions
         * This function creates reverse JE's for Customer Payment and Inovices to void out the transaction
         * It uses a utility file which has generic code for GL impact search. We need to know GL impact to reverse/void the transaction
         */
        function CreateReverseJE(jeId,actualSubsidiary) {
            try {
                var FUNC_NAME = " CreateReverseJE";
                log.debug(FUNC_NAME, 'Journal Entry to be Reversed Id: '+ jeId);
                //Getting the GL Impact searh from the script parameter
                var currentScriptParamters = runtime.getCurrentScript();
                var gl_impact_search = currentScriptParamters.getParameter('custscript_gl_impact');
                var filtersObj = new Array();
                filtersObj.push(search.createFilter({
                    name: 'internalid',
                    operator: search.Operator.IS,
                    values: jeId
                }));
                //calling the getAllRowsFromSearch function from utility file
                var glimpactList = getAllRowsFromSearch(gl_impact_search, filtersObj);
                //Creating the reverse JE
                var recJournalEntry = record.create({
                    type: record.Type.JOURNAL_ENTRY,
                    isDynamic: true,
                    defaultValues: {
                        bookje : 'T'
                    }
                });
                recJournalEntry.setValue('accountingbook',3);
                recJournalEntry.setValue('custbody_ut_created_from_journal',jeId);  
                recJournalEntry.setValue('subsidiary', actualSubsidiary);
                log.debug(FUNC_NAME, 'GL Search Length: ' + glimpactList.length);
                for (var intPos = 0; intPos < glimpactList.length; intPos++) {
                    var creditAmount = glimpactList[intPos].getValue('creditamount');
                    var debitAmount = glimpactList[intPos].getValue('debitamount');
                    var gl_account = glimpactList[intPos].getValue('account');
                    var je_entity = glimpactList[intPos].getValue({name:'entity',join:'transaction'});
                    var departmentId = glimpactList[intPos].getValue({name : 'department',join: 'transaction'});
                    var classId = glimpactList[intPos].getValue({name : 'class',join: 'transaction'});
                    var locationId = glimpactList[intPos].getValue({name : 'location',join: 'transaction'});
                    log.debug(FUNC_NAME, 'Gl impact Account is: ' + gl_account);
                    recJournalEntry.selectNewLine({
                        sublistId: 'line'
                    });
                    recJournalEntry.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: gl_account
                    });
                    if (Math.abs(creditAmount) > 0) {
                        recJournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'debit',
                            value: Math.abs(creditAmount)
                        });
                    }
                    if (Math.abs(debitAmount) > 0) {
                        recJournalEntry.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'credit',
                            value: Math.abs(debitAmount)
                        });
                    }

                    recJournalEntry.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'entity',
                        value: je_entity
                    });

                    recJournalEntry.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'department',
                        value: departmentId
                    });

                    recJournalEntry.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'class',
                        value: classId
                    });

                    recJournalEntry.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'location',
                        value: locationId
                    });

                    recJournalEntry.commitLine({
                        sublistId: 'line'
                    });
                }

                var reversejeId = recJournalEntry.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                log.debug(FUNC_NAME, 'Reverse Journal Entry got created: ' + reversejeId);
                if(reversejeId){
                    record.submitFields({
                        type : 'journalentry',
                        id : jeId,
                        values : {
                            'custbody_stat_book_reversal_journal_li' : reversejeId
                        }
                    })
                }
            } catch (e) {
                var errorMessage = 'Error occured in  CreateVoidJE function' + 'Error' + 'Name: ' + e.name + ' | ' + 'Error Message: ' + e.message;
                log.audit(FUNC_NAME, 'ErrorMessage' + errorMessage);
                throw (e);
            }
        }

        getAllRowsFromSearch = function(searchId, filterObj, columnsObj)
    {
        var startPos = 0;
        var endPos = 1000;
        var retList = new Array();

        var searchObj = search.load({id : searchId});
        if (filterObj != undefined && filterObj != null && filterObj != '' && typeof filterObj == 'object' && filterObj.length > 0) {
            for (var idx = 0; idx < filterObj.length; idx++) {
                searchObj.filters.push(filterObj[idx]);
            }
        }

        if (columnsObj != undefined && columnsObj != null && columnsObj != '' && typeof columnsObj == 'object' && columnsObj.length > 0) {
            for (var idx = 0; idx < columnsObj.length; idx++) {
                searchObj.columns.push(columnsObj[idx]);
            }
        }

        while (true) {
            var resultSet = searchObj.run();
            try
            {
                var currList = resultSet.getRange({
                    start: startPos,
                    end: endPos
                });
            }
            catch(ex)
            {
                break;
            }

            if (currList == null || currList.length <= 0)
                break;

            if (retList == null) {
                retList = currList;
            } else {
                retList = retList.concat(currList);
            }
            if (currList.length < 1000) {
                break;
            }
            startPos += 1000;
            endPos += 1000;
        }

        return retList;
    };

    toIntegerNumber = function (inValue)
    {
        if (inValue == null || inValue == '' || isNaN(inValue))
        {
            inValue = 0;
        }

        return parseInt(inValue);
    };

    toNumber = function (value)
    {
        if(value == null || value == '' || isNaN(value) || parseFloat(value) == 'NaN')
            value = 0;
        return parseFloat(value);
    };

    convNull = function (value) {
        if (value == null || value == undefined || value == 'undefined')
            value = '';
        return value;
    };

    Math.average = function() {
        var cnt, tot, i;
        cnt = arguments.length;
        tot = i = 0;
        while (i < cnt) tot+= arguments[i++];
        return tot / cnt;
        };

    // This simple method rounds a number to two decimal places.
    round = function (x) {
        x = toDecimalNumber(x);
      return Math.round(x*100)/100;
    };

    toDecimalNumber = function (inValue)
    {
        if (inValue == null || inValue == '' || isNaN(inValue))
        {
            inValue = 0;
        }
        
        return parseFloat(inValue);
    };

    getFormulaValue = function(srchRow, label) {
        var retVal = '';
        var cols = srchRow.columns;
        
        for (var idx=0;idx < cols.length; idx++) {
            var col = cols[idx];
            
            if (col.label && col.label != 'N/A' && label == col.label) {
                retVal = srchRow.getText(col) || srchRow.getValue(col);
                if (retVal == '- None -')
                    retVal = '';
            }
        }
        return retVal;
    };
        function isNullOrEmpty(objVariable) {
            return (objVariable == null || objVariable == "" || objVariable == undefined);
        };

        function createFilters(tranType, searchObj, recId, over_payment_id) {
            var FUNC_NAME = 'Create Filters';
            if (tranType == 'invoice') {
                searchObj.filters[searchObj.filters.length] = search.createFilter({
                    name: 'internalid',
                    join: 'appliedtotransaction',
                    operator: 'is',
                    values: recId
                });
                return searchObj;
            }
        }

        return {
            getInputData: getInputData,
            map: map,
            summarize: summarize
        };

    });