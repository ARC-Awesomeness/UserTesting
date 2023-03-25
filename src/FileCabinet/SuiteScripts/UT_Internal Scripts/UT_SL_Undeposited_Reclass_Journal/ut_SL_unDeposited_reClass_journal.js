/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Nov 2021     sramanan		   Initial Version
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response){

    //Create the form that will be used by the POST and GET requests
    var form = nlapiCreateForm('Reclass Undeposited Funds');

    //GET - Show a list of transactions from the search results so the user can select the ones to be deleted
    if (request.getMethod() == 'GET') {
        // Run an existing transaction search
    	
    	var jrnlSubsidiary = nlapiGetContext().getSetting('SCRIPT', 'custscript_ut_reclass_subsidiary');
    	var jrnlDrAcct = nlapiGetContext().getSetting('SCRIPT', 'custscript_ut_reclass_dr_account');
    	var jrnlCrAcct = nlapiGetContext().getSetting('SCRIPT', 'custscript_ut_reclass_cr_account');
    	var jrnlMemo = nlapiGetContext().getSetting('SCRIPT', 'custscript_ut_reclass_memo');
    	var jrnlDept = nlapiGetContext().getSetting('SCRIPT', 'custscript_ut_reclass_department');
    	
    	
        var results = nlapiSearchRecord('transaction', 'customsearch_ut_undeposited_payments');

        form.addField('subsidiary', 'text', 'Subsidiary').setDisplayType('hidden');
        form.addField('draccount', 'text', 'Dr Account').setDisplayType('hidden');
        form.addField('craccount', 'text', 'Cr Account').setDisplayType('hidden');
        form.addField('memo', 'text', 'Memo', jrnlMemo).setDisplayType('hidden');
        form.addField('jrnldate', 'date', 'Journal Date');
        form.addField('department', 'select', 'Journal Department', 'department');
        
        form.setFieldValues({subsidiary: jrnlSubsidiary,draccount: jrnlDrAcct,craccount: jrnlCrAcct, memo: jrnlMemo, department: jrnlDept});
        
        // Create a sublist to show the search results
        var sublist = form.addSubList('custpage_transaction_list', 'list', 'Transactions');

        // Create an array to store the transactions from the search results
        var transactionArray = new Array();

        if (results != null) {

            // Get the the search result columns
            var columns = results[0].getAllColumns();
            var totPmtAmt = 0;
            // Add the search columns to the sublist
//            for (var i = 0; i < columns.length; i++) {
//                sublist.addField(columns[i].getName(), 'text', columns[i].getName());
//            }
            sublist.addField('internalid', 'text', 'Internal ID').setDisplayType('hidden');
            sublist.addField('recordtype', 'text', 'Record Type').setDisplayType('hidden');
            sublist.addField('trandate', 'date', 'Date');
            sublist.addField('postingperiod', 'text', 'Period');
            sublist.addField('tranid', 'text', 'Payment #');
            sublist.addField('statusref', 'text', 'Status');
            sublist.addField('amount', 'currency', 'Amount');
            sublist.addField('internalidlink', 'url', 'Payment URL');

            // For each search results row, create a transaction object and attach it to the transactionArray
            for (var i = 0; i < results.length; i++) {
                var transaction = new Object();
                transaction['internalid'] = results[i].getId();
                // Set the hidden record type field
                transaction['recordtype'] = results[i].getRecordType();
                // Create a link so users can navigate from the list of transactions to a specific transaction
            	var pmtAmt = parseFloat(results[i].getValue('amount'));
				if (pmtAmt != null && pmtAmt != '' && pmtAmt != 0 && !isNaN(pmtAmt))
					totPmtAmt += pmtAmt;
            	
                for (var j = 0; j < columns.length; j++) {
         	        //nlapiLogExecution('Debug', 'checking', 'processing  ' + columns[j].getName() +  ' --> ' + results[i].getValue(columns[j].getName()) );
                	
                	if ((j == 1) || (j == 3))
                		transaction[columns[j].getName()] = results[i].getText(columns[j].getName());
                	else
                		transaction[columns[j].getName()] = results[i].getValue(columns[j].getName());
                }
                var url = 'https://system.netsuite.com' + nlapiResolveURL('RECORD', results[i].getRecordType(), results[i].getId(), null);
                internalIdLink = url //" " + results[i].getId() + " ";
                // Set the link
                transaction['internalidlink'] = internalIdLink;

                
                transactionArray[i] = transaction;
            }
        }
        var unDepBal = 0;
    	var accSearch = nlapiLoadSearch(null, 'customsearch_ut_undep_fund_balance');
    	var End = 1;
    	
        var accResult = accSearch.runSearch();
        var Results = accResult.getResults(0, End);
        var searchRecordCount= Results.length;
        if (searchRecordCount > 0)
        {
        	
        	unDepBal = Results[0].getValue('balance');
        	
        }
        
        
        form.addField('undepfundbal', 'currency', 'Undeposited Fund Balance').setDisplayType('disabled');
        form.addField('totalamt', 'currency', 'Total Transaction Amount').setDisplayType('disabled');
        form.setFieldValues({undepfundbal: unDepBal,totalamt: totPmtAmt});
        form.addField('jrnlnumber', 'text', 'Journal #').setDisplayType('hidden');
        form.addField('jrnlid', 'text', 'Journal ID').setDisplayType('hidden');
        
        sublist.setLineItemValues(transactionArray);
        form.addSubmitButton('Post Journal');
        form.setScript('customscript_ut_cs_recl_undep_check_jrnl');
        response.writePage(form);
    }
    else
    {
    	var retVal = request.getParameter('jrnlid');
    	nlapiLogExecution('debug', 'checking', retVal);
		nlapiSetRedirectURL( 'RECORD', 'journalentry', retVal, false );
    }
}
