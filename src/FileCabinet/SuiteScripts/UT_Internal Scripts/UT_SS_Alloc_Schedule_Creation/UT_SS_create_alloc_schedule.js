/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       30 Aug 2021     sramanan		   Create Alloc Schedule for other depts
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function createAllocSchedule(type) {
	
	try
	{

	var deptName = nlapiGetContext().getSetting('SCRIPT', 'custscript_ut_dept_name');
	var deptId = nlapiGetContext().getSetting('SCRIPT', 'custscript_ut_dept_id');
    var subId = nlapiGetContext().getSetting('SCRIPT', 'custscript_ut_subsidiary_id');
    var subName = nlapiGetContext().getSetting('SCRIPT', 'custscript_ut_subsidiary_name');
    var baseAlloc = nlapiGetContext().getSetting('SCRIPT', 'custscript_ut_base_alloc');
	
	
	var allocRec = nlapiLoadRecord('allocationschedule',baseAlloc);
		nlapiLogExecution('debug', 'Checking', 'After Load ' + baseAlloc);

	var record = nlapiCreateRecord('allocationschedule', {recordmode: 'dynamic'});
	nlapiLogExecution('debug', 'Checking', 'After Create ' + allocRec.getLineItemCount(lineItem));
	
	record.setFieldValue('name', subName + ' ' + deptName);
	nlapiLogExecution('debug', 'Checking', 'After Name ' +  subName + ' ' + deptName);
	record.setFieldValue('subsidiary', subId);
	nlapiLogExecution('debug', 'Checking', 'After Subid ' + subId);
	record.setFieldValue('frequency', allocRec.getFieldValue('frequency'));
	record.setFieldValue('nextdate', allocRec.getFieldValue('nextdate'));
	nlapiLogExecution('debug', 'Checking', 'After nextdate ' + allocRec.getFieldValue('nextdate'));
	record.setFieldValue('subsequentdate', allocRec.getFieldValue('subsequentdate'));
	record.setFieldValue('allocationmode', allocRec.getFieldValue('allocationmode'));
	nlapiLogExecution('debug', 'Checking', 'After allocationmode ' + allocRec.getFieldValue('allocationmode'));
	record.setFieldValue('datebasis', allocRec.getFieldValue('datebasis'));
	nlapiLogExecution('debug', 'Checking', 'After datebasis ' + allocRec.getFieldValue('datebasis'));
//    record.setFieldValue('remindforever', allocRec.getFieldValue('remindforever'));
//	nlapiLogExecution('debug', 'Checking', 'After remindforever ' + allocRec.getFieldValue('remindforever'));
	record.setFieldValue('weightsource', allocRec.getFieldValue('weightsource'));
	nlapiLogExecution('debug', 'Checking', 'After weightsource ' + allocRec.getFieldValue('weightsource'));
//	record.setFieldValue('unitstype', allocRec.getFieldValue('unitstype'));
//	record.setFieldValue('unitlabel', allocRec.getFieldValue('unitlabel'));
	record.setFieldValue('creditaccount', allocRec.getFieldValue('creditaccount'));
  	nlapiLogExecution('debug', 'Checking', 'After creditaccount ' + allocRec.getFieldValue('creditaccount'));
//	record.setFieldValue('weightsinpercentage', allocRec.getFieldValue('weightsinpercentage')); //ONLY FOR COR
	record.setFieldValue('creditdepartment', deptId);
  	nlapiLogExecution('debug', 'Checking', 'After deptId ' + deptId);


	nlapiLogExecution('debug', 'Checking', 'Before Source ' + allocRec.getLineItemCount(lineItem));

	var lineItem = 'allocationsource';
	for (var i = 0; i < allocRec.getLineItemCount(lineItem); i++)
	{
		//nlapiLogExecution('debug', 'Checking',allocRec.getLineItemValue(lineItem, 'account', i+1));

		
		record.selectNewLineItem(lineItem);
		record.setCurrentLineItemValue(lineItem, 'account', allocRec.getLineItemValue(lineItem, 'account', i+1));
		record.setCurrentLineItemValue(lineItem, 'class', allocRec.getLineItemValue(lineItem, 'class', i+1));
		record.setCurrentLineItemValue(lineItem, 'department', deptId);
		record.setCurrentLineItemValue(lineItem, 'entity', allocRec.getLineItemValue(lineItem, 'entity', i+1));
		record.setCurrentLineItemValue(lineItem, 'location', allocRec.getLineItemValue(lineItem, 'location', i+1));
		record.commitLineItem(lineItem);

	}
	

	var lineItem = 'allocationdestination';
	nlapiLogExecution('debug', 'Checking', 'Before Dest ' + allocRec.getLineItemCount(lineItem));
	for (var i = 0; i < allocRec.getLineItemCount(lineItem); i++)
	{
		//nlapiLogExecution('debug', 'Checking',allocRec.getLineItemValue(lineItem, 'account', i+1));

		record.selectNewLineItem(lineItem);
		record.setCurrentLineItemValue(lineItem, 'account', allocRec.getLineItemValue(lineItem, 'account', i+1));
		record.setCurrentLineItemValue(lineItem, 'department', allocRec.getLineItemValue(lineItem, 'department', i+1));
//		record.setCurrentLineItemValue(lineItem, 'weight', allocRec.getLineItemValue(lineItem, 'weight', i+1)); // ONLY FOR COR
		
		record.commitLineItem(lineItem);
	}
	
	
	var recId = nlapiSubmitRecord(record, true);
	nlapiLogExecution('debug', 'Checking', 'Alloc Sched ID ' + recId);

	}
	catch(e)
	{
		nlapiLogExecution('error', 'Exception', e.message);
	}
}

function addDept(type) {
      
		var deptId = nlapiGetContext().getSetting('SCRIPT', 'custscript_ut_dept_dept_id');
	    var baseAlloc = nlapiGetContext().getSetting('SCRIPT', 'custscript_ut_dept_base_alloc');
		var lineItem = 'allocationdestination';
        var baseAllocArr = baseAlloc.split(',')

        for (intPos = 0; intPos < baseAllocArr.length; intPos++)
		{
            try
            {

              var internalId = baseAllocArr[intPos];
              var allocRec = nlapiLoadRecord('allocationschedule',internalId);

              nlapiLogExecution('debug', 'Checking', 'Processing' + internalId);


              allocRec.selectNewLineItem(lineItem);
              allocRec.setCurrentLineItemValue(lineItem, 'account', allocRec.getLineItemValue(lineItem, 'account', 1));
              allocRec.setCurrentLineItemValue(lineItem, 'department', deptId); 
              allocRec.commitLineItem(lineItem);


              var recId = nlapiSubmitRecord(allocRec, true);
              nlapiLogExecution('debug', 'Checking', 'Alloc Sched ID ' + recId);

            }
            catch(e)
            {
                nlapiLogExecution('error', 'Processing' + internalId + ' - Exception', e.message);
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