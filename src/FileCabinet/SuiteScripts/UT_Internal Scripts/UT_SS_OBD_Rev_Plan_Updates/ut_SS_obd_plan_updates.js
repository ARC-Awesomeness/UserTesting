/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Nov 2021     sramanan
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function scheduled(type) {
	
	var logTitle = 'obdRevPlanUpdate';
	var revRuleId = 4;
	

	var savedSearchId = 'customsearch_ut_obd_plan_update';

		 var Results = getAllRowsFromList(null, savedSearchId, null, null);
		 var searchRecordCount= 0;

		 if (Results != null)
			 searchRecordCount= Results.length;
	 
	 if (searchRecordCount != 0)
	 {
		 var columns = Results[0].getAllColumns(); 
		 for (var intPos = 0; intPos < searchRecordCount; intPos++)
		{
		 try
		 {
			var internalId = Results[intPos].getValue(columns[0]);
			var contractLineId = Results[intPos].getValue(columns[1]);
			var revElementId = Results[intPos].getValue(columns[2]);
			var revPlanId = Results[intPos].getValue(columns[3]);
			var startDate = Results[intPos].getValue(columns[4]);
			var endDate = Results[intPos].getValue(columns[5]);
			var status = Results[intPos].getValue(columns[6]);
			
 	        nlapiLogExecution('Debug', logTitle, 'processing internalId ' + internalId);
 	        nlapiLogExecution('Debug', logTitle, 'processing contractLineId ' + contractLineId);
 	        nlapiLogExecution('Debug', logTitle, 'processing revElementId ' + revElementId);
 	        nlapiLogExecution('Debug', logTitle, 'processing revPlanId ' + revPlanId);
 	        nlapiLogExecution('Debug', logTitle, 'processing endDate ' + endDate);
 	        
	    	var contLineRec =nlapiLoadRecord('customrecord_contractlines', contractLineId);
	    	var revElementRec =nlapiLoadRecord('billingrevenueevent', revElementId);
 	        //nlapiLogExecution('Debug', logTitle, ' before loading rev plan ');
	    	var revPlanRec =nlapiLoadRecord('revenueplan', revPlanId);
	    	var obdRec =nlapiLoadRecord('customrecord_ut_revenue_plan_update_obd', internalId);
 	       // nlapiLogExecution('Debug', logTitle, ' after loading rev plan ');

	    	revElementRec.setFieldValue('revenuerecognitionrule', revRuleId);
	    	nlapiSubmitRecord(revElementRec, true, true);;
	    	
	    	revPlanRec.setFieldValue('revenuerecognitionrule',revRuleId);
	    	revPlanRec.setFieldValue('revrecenddate', endDate);
	    	nlapiSubmitRecord(revPlanRec, true, true);;

 	       // nlapiLogExecution('Debug', logTitle, ' after updating rev plan ');

	    	contLineRec.setFieldValue('custrecord_is_update_rev_element', 'T');
	    	nlapiSubmitRecord(contLineRec, true, true);;
	    	
	    	obdRec.setFieldValue('custrecord_obd_processing_status', 'PROCESSED');
	    	nlapiSubmitRecord(obdRec, true, true);
	    	
			if (nlapiGetContext().getRemainingUsage() <  1000 ) 
			{		
				var status = nlapiScheduleScript(nlapiGetContext().getScriptId(), nlapiGetContext().getDeploymentId());
				nlapiLogExecution("Debug","Checking","ReScheduled status : " + status);
				return;
			}
		 }
		 catch(e)
		 {
			nlapiLogExecution('error', logTitle, 'Error ' + e.message);
	    	var obdRec =nlapiLoadRecord('customrecord_ut_revenue_plan_update_obd', internalId);
	    	obdRec.setFieldValue('custrecord_obd_processing_status', 'ERROR-' + e.message);
	    	nlapiSubmitRecord(obdRec, true, true);
		 }
		
	 }
	}
}

function getAllRowsFromList(recType, searchId,filters,columns )
{
	var retList = null;
	var search = nlapiLoadSearch(recType, searchId);
	if (filters != null && filters.length > 0)
		search.addFilters(filters);
	if  (columns != null && columns.length > 0)
		search.addColumns(columns);
	
	var resultSet = search.runSearch();
	var startPos = 0;
	var endPos = 1000;
	while (startPos <= 10000)
	{
		var currList = resultSet.getResults(startPos, endPos);
		if (currList == null || currList.length <= 0)
			break;
		if (retList == null)
		{
			retList = currList;
		}
		else
		{
			retList = retList.concat(currList);
		}
		if (currList.length < 1000)
		{
			break;
		}
		startPos += 1000;
		endPos += 1000;
	}
	return retList;
}