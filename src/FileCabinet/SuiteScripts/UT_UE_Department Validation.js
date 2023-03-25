/**
 * ********* UserTesting *********
 *
 * Description: User event script deployed only on Journal enty to validate department for CSV context
 *      1  - Department is mandatory and cannot be "000-No Department" if the account type is Expense, Fixed Assets and Other Current Assets
 *      
 *
 * Version    Date            Author            Remarks
 * 1.0        Feb 08, 2022    Suren             Initial version.
 */

/**
*@NApiVersion 2.x
*@NScriptType UserEventScript
* @NModuleScope SameAccount
*/

define(['N/record','N/search', 'N/error'],
    function(record, search, error){

        var expenseAssetAccountTypes = ["FixedAsset","OthCurrAsset","Expense"];
        var expenseAssetAccountIds = []; 
    
        var noDeptId = '101'; //0000 - No Department
        var alertMsg = 'Department is mandatory and can not be "000-No Department" for the account types Expense, Fixed Assets and Other Current Assets';
        
        function beforeSubmit(context){

            var throwError = false;

            //Get the list of account Ids for the specific account types to be validated
            try{
                //Get expense/asset account ids
                var accountSearchObj = search.create({
                   type: "account",
                   filters:
                   [
                      ["type","anyof", expenseAssetAccountTypes]
                   ],
                   columns: []
                });
                
                accountSearchObj.run().each(function(result){
                    expenseAssetAccountIds.push(result.id);
                    return true;
                });
                //log.debug('expenseAssetAccountIds',expenseAssetAccountIds);

                var objRec = context.newRecord;
                var lineCount = objRec.getLineCount({sublistId: 'line'}); //for journal entry

                log.debug('lineCount',lineCount);

                for(var i = 0; i < lineCount; i++){

                    //objRec.selectLine({sublistId: 'line', line: i});
                    var accountId = objRec.getSublistValue({sublistId: 'line', fieldId: 'account', line: i});
                    var deptId = objRec.getSublistValue({sublistId: 'line', fieldId: 'department', line: i});

                    log.debug('deptId = '+deptId+', accountId = '+accountId, expenseAssetAccountIds.indexOf(accountId));

                    if(expenseAssetAccountIds.indexOf(accountId) > -1 && (deptId == "" || deptId == noDeptId)){
        
                        throwError = true;
                        break;
                    }
                }

                }
            catch(err){
                
            }

            if(throwError){

                log.debug('INVALID_DEPARTMENT_FOR_ACCOUNT', alertMsg);

                var myCustomError = error.create({
                    name: 'INVALID_DEPARTMENT_FOR_ACCOUNT',
                    message: alertMsg,
                    notifyOff: true
                });

                throw myCustomError;
                return false;
            }

        }

    return{
        beforeSubmit: beforeSubmit
    }
});