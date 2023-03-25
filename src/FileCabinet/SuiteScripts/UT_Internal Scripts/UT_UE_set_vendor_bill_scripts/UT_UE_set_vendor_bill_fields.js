/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       31 Aug 2021     sramanan		   Set vendor field department field from Coupa
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit
 *                      approve, reject, cancel (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF)
 *                      markcomplete (Call, Task)
 *                      reassign (Case)
 *                      editforecast (Opp, Estimate)
 * @returns {Void}
 */
function setDeptFields(type){
	try
	{
 var deptExternalId = nlapiGetFieldValue('custbody_ut_coupa_dept_code');
	nlapiLogExecution('debug','Checking', deptExternalId);

	if (deptExternalId != null && deptExternalId != '')
	{
		 deptInternalId = getInternalIDByExternalId(deptExternalId, 'department');
		 nlapiSetFieldValue('department', deptInternalId);
			nlapiLogExecution('debug','Checking', 'After setting');

	}
	}
	catch(e)
	{
		nlapiLogExecution('error','Exception', e.message);
	}
}

/*
Function to get the internal based on externnalID for Subsidiaries, location, class, department
*/
function getInternalIDByExternalId(externalId,recordType)
{

   idFilter = new nlobjSearchFilter('externalid', null, 'is', externalId);
   var columns = new Array();
   columns[0] = new nlobjSearchColumn('internalid');
   var savedSearch = '';
   if (recordType == 'subsidiary')
       savedSearch ='customsearch_coupa_accs_subsearch';
   else if (recordType == 'department')
       savedSearch ='customsearch_coupa_accs_deptsearch';
   else if (recordType == 'location')
       savedSearch = 'customsearch_coupa_accs_locsearch';
   else if (recordType == 'classification')
       savedSearch = 'customsearch_coupa_accs_classsearch';

   var searchResults = nlapiSearchRecord(recordType,savedSearch, idFilter, columns);
   nlapiLogExecution('DEBUG', 'searchResults', JSON.stringify(searchResults));
   var internalId = searchResults[0].getValue('internalid');
   nlapiLogExecution('DEBUG', 'getting internal id of ' + recordType  + ' based on external ID', internalId);
   return internalId;
}