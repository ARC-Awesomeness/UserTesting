/**
 * ********* UserTesting *********
 *
 * Description: User event script deployed on several transactions for department validation as follows:
 *      1  - Department is mandatory and cannot be "0000-No Department" if the account type is Expense, Fixed Assets and Other Current Assets
 *      2  - Department is defaulted to "0000-No Department" (and cannot be changed) if the account type is other than mentioned above
 *  - The Validation runs at the time of saving the Transaction (on line validation as well to make it efficient)
 *  - The Validation runs for the below  transactions. Some of the transactions come through the integration as well.
 *              1. Journal Entry/Book Specific JE/Intercompany Journal Entry/Statistical JE > line tab, account, department
 *              2. Vendor Bill - expense tab, category or account, department
 *              3. Vendor Credit - expense tab, account, department
 *              4. Vendor Payment - N/A
 *              5. Vendor RMA - expense tab, account, department
 *              6. Customer Payment - N/A
 *              7. Credit Memo - N/A
 *              8. Deposit - Other deposit and Cash back tabs, account, department
 *              9. Customer Deposit - N/A
 *              9. Bank Charges - 
 *              10. Expense Reports - expense tab, category or account, department
 *              11. Revenue Arrangement - N/A
 *              12. Invoice - N/A
 *              13. RMA - N/A
 *
 * Version    Date            Author            Remarks
 * 1.0        Dec 23, 2022    Suren             Initial version.
 * 1.1        Feb 03, 2023    Suren             Requirement logic change (removing 2nd bullet requirement)
 */

/**
*@NApiVersion 2.x
*@NScriptType ClientScript
* @NModuleScope SameAccount
*/

define(['N/record','N/search'],
    function(record, search){

        var expenseAssetAccountTypes = ["FixedAsset","OthCurrAsset","Expense"];
        var expenseAssetAccountIds = []; 
    
        var noDeptId = '101'; //0000 - No Department
        var alertMsg = 'Department is mandatory and can not be "0000-No Department" for the account types Expense, Fixed Assets and Other Current Assets';
        
        function pageInit(context){

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

            }
            catch(err){}
        }


        function fieldChanged(context){
            return validateDepartment(context, true);
        }


        function validateLine(context){
            return validateDepartment(context, false);   
        }


        function validateDepartment(context, isFieldChanged){

            var isExpenseAccount = false;

            try{

                var objRec = context.currentRecord;
                if(!objRec)
                    return true;

                var sublistId = context.sublistId;
                if(!sublistId)
                    return true;

                if(isFieldChanged){
                    var fieldId = context.fieldId;
                    if(fieldId != 'category' && fieldId != 'account' && fieldId != 'department')
                        return true;
                }
                
                if(expenseAssetAccountIds.length < 1){
                    alert('Error in loading accounts for department validation. Try reloading the page or department validation might be skipped')
                    return;
                }

                var accountId = objRec.getCurrentSublistValue({sublistId: sublistId, fieldId: 'account'});
                var deptId = objRec.getCurrentSublistValue({sublistId: sublistId, fieldId: 'department'});

                if(objRec.type == record.Type.EXPENSE_REPORT)
                    isExpenseAccount = true;
                else if(accountId != "" && expenseAssetAccountIds.indexOf(accountId) > -1)
                    isExpenseAccount = true;
                else
                    isExpenseAccount = false;

                if(!isExpenseAccount)
                    return true; //No department validation needed

               if(isFieldChanged){
                    if(fieldId == 'department' && (deptId == "" || deptId == noDeptId)){
                        alert(alertMsg);
                        return false;
                    }
                    else if(fieldId == 'account' && deptId != "" && deptId == noDeptId){
                        alert(alertMsg);
                        return false;
                    }
               }
               else if(deptId == "" || deptId == noDeptId){
                    alert(alertMsg);
                    return false;
                }

                return true;
            }
            catch(err){}
        }
        

        function saveRecord(context){

            return true;
        }


    return{
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        validateLine: validateLine,
        //saveRecord:saveRecord
    }
});