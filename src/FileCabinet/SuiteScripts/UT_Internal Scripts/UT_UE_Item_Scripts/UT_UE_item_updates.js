/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       20 Sep 2021     sramanan		   Clear Income and Def Rev accounts at the time of item creation
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function beforeSubmit(type){
 
	if (type == 'create')
	{
		nlapiLogExecution('debug','Checking', 'Before setting');

		nlapiSetFieldValue('incomeaccount', '');
		nlapiSetFieldValue('deferredrevenueaccount', '');
	 
		nlapiLogExecution('debug','Checking', 'After setting');

	}
}
