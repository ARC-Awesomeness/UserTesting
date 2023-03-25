/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       10 Nov 2021     sramanan		   Initial Version
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @returns {Boolean} True to continue save, false to abort save
 */
function clientSaveRecord(){

    var pmtCount = nlapiGetLineItemCount('custpage_transaction_list');

    if (pmtCount <= 0)
    {
    	var respMsg = alert('No Payments to process!!');
    	return false;
    }
	var jrnlDate = nlapiGetFieldValue('jrnldate');
    if (jrnlDate == null || jrnlDate == '')
    {
    	var respMsg = alert('Journal Date is empty!!');
    	return false;    	
    }
    
	var jrnlDept = nlapiGetFieldValue('department');
    if (jrnlDept == null || jrnlDept == '')
    {
    	var respMsg = confirm('Journal Dept is empty!!');
    	return false;    	
    }

	var unDepFundBal = parseFloat(nlapiGetFieldValue('undepfundbal'));
	if (unDepFundBal == null || unDepFundBal == '' || unDepFundBal == 0 || isNaN(unDepFundBal))
	{
    	var respMsg = alert('Undeposited Fund Account Balance is Zero!!');
    	return false;  
	}
	var respMsg = confirm('This will create a reclass Journal. Press OK to continue');
	
	if (respMsg)
	{
		try
		{
			var totAmt = 0;
			
	        var jrnlSubsidiary = nlapiGetFieldValue('subsidiary');
	        var jrnlDrAcct = nlapiGetFieldValue('draccount');
	        var jrnlCrAcct = nlapiGetFieldValue('craccount');
	        var jrnlMemo = nlapiGetFieldValue('memo');
	
			var journalRec = nlapiCreateRecord('journalentry');
			journalRec.setFieldValue('subsidiary', jrnlSubsidiary);	
			journalRec.setFieldValue('trandate', jrnlDate)
			journalRec.setFieldValue('memo', jrnlMemo);	
			journalRec.setFieldValue('reversalentry', 'T');
			
			var jrDate = new Date(jrnlDate);
			var reversalDate = new Date(jrDate.getFullYear(), jrDate.getMonth()+1, 1);
			journalRec.setFieldValue('reversaldate', nlapiDateToString(reversalDate));
			
			var cLine=1;
			var dLine=2;
			
		    for (var i = 1; i <= pmtCount; i++)
		    {
	            var pmtAmt = parseFloat(nlapiGetLineItemValue('custpage_transaction_list', 'amount', i));
	            var jrnlTranId = nlapiGetLineItemValue('custpage_transaction_list', 'tranid', i)
	//            alert(nlapiGetLineItemValue('custpage_transaction_list', 'amount', i))
	            totAmt += pmtAmt;
	            
				journalRec.insertLineItem('line', cLine );
				journalRec.setLineItemValue('line','account', cLine ,jrnlCrAcct);
	
				if (pmtAmt != null && pmtAmt != '' && pmtAmt != 0 && !isNaN(pmtAmt))
				{
					journalRec.setLineItemValue('line','credit', cLine , nlapiFormatCurrency(pmtAmt));		
					journalRec.setLineItemValue('line','memo', cLine , jrnlTranId);
					journalRec.setLineItemValue('line','department', cLine , jrnlDept);
					
				}			
	
				journalRec.insertLineItem('line', dLine );	
	
				journalRec.setLineItemValue('line','account', dLine ,jrnlDrAcct);	
				if (pmtAmt != null && pmtAmt != '' && pmtAmt != 0 && !isNaN(pmtAmt))
				{
					journalRec.setLineItemValue('line','debit', dLine , nlapiFormatCurrency(pmtAmt));
					journalRec.setLineItemValue('line','memo', dLine , jrnlTranId);
					journalRec.setLineItemValue('line','department', dLine , jrnlDept);
				}
	
				cLine = cLine + 2;
				dLine = dLine + 2;
	            
		    }
		    var retVal = nlapiSubmitRecord(journalRec, true);
		    var jrnlRec = nlapiLoadRecord('journalentry', retVal);
		    var jrnlNumber = jrnlRec.getFieldValue('tranid');
		    nlapiSetFieldValue('jrnlnumber', jrnlNumber);
		    nlapiSetFieldValue('jrnlid', retVal);
			alert('Journal Successfully created ' + jrnlNumber);
		}
		catch(e)
		{
			alert('Error while creating Journal ' + e.message);
			return false;
		}
	}    
	else
		alert('Journal not created');
	
    return true;
}
