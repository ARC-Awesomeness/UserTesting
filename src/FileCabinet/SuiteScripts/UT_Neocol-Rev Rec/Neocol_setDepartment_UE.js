/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @NScriptType UserEventScript
 * @see https://system.netsuite.com/app/help/helpcenter.nl?fid=section_4387799721.html
 */
define(['N/search', 'N/record', 'N/error', 'N/runtime'],

    /**
     * @return {{
     *   beforeLoad?: Function,
     *   beforeSubmit?: Function,
     *   afterSubmit?: Function,
     * }}
     */
    function (search, record,error,runtime) {

        /**
         * @param {BeforeLoadContext} context
         * @return {void}
         */
        function beforeLoad(context) {
            try {

                log.audit('beforeLoad', {
                    type: context.type,
                    form: context.form,
                    newRecord: {
                        type: context.newRecord.type,
                        id: context.newRecord.id,
                    },
                    request: !context.request ? null : {
                        url: context.request.url,
                        parameters: context.request.parameters,
                    },
                });

            } catch (e) {
                log.error('beforeLoad', JSON.parse(JSON.stringify(e)));
            }
        }

        /**
         * @param {BeforeSubmitContext} context
         * @return {void}
         */
        function beforeSubmit(context) {
            try {
                /*
                log.audit('beforeSubmit', {
                    type: context.type,
                    newRecord: {
                        type: context.newRecord.type,
                        id: context.newRecord.id,
                    },
                    oldRecord: {
                        type: context.oldRecord.type,
                        id: context.oldRecord.id,
                    },
                });
                 */


                var newRecord = context.newRecord;

                var recType = newRecord.type;
                log.debug('recType', recType)

                var scriptObj = runtime.getCurrentScript();
                log.debug('Script parameter of custscript_no_department: ' + scriptObj.getParameter({name: 'custscript_no_department'}));
                var noDeptParameter = scriptObj.getParameter({name: 'custscript_no_department'})
                var noDepartment = (!isEmpty(noDeptParameter)) ? noDeptParameter : 103
                log.debug('noDepartment', noDepartment)
                var departmentValue = ''
                var accountId = ''
                var sublistId = ''
                var checkSublist = ''
                var checkSublistAccount = ''

                var recTypeArray = ['invoice', 'revenuearrangement']
                var recTypeAllowed = recTypeArray.indexOf(recType)

                var itemsSublistArray = ['cashrefund', 'cashsale', 'creditmemo', 'itemreceipt','returnauthorization']

                if(itemsSublistArray.indexOf(recType) > -1) {
                    log.debug('beforeSubmit', 'Check Department Mandatory on Item Sublist')
                    sublistId = 'item'
                    checkSublist = true

                }

                var expensesArray = ['check', 'expensereport', 'vendorbill', 'vendorcredit', 'vendorreturnauthorization', 'purchaseorder', ]
                if(expensesArray.indexOf(recType) > -1) {
                    log.debug('beforeSubmit', 'Check Department Mandatory on Expense Sublist')
                    sublistId = 'expense'
                    checkSublist = true
                }

                var noSublistArray = ['charge', 'customerpayment', 'customerrefund', 'depositapplication','vendorpayment', ]
                if(noSublistArray.indexOf(recType) > -1) {
                    log.debug('beforeSubmit', 'Check Department Mandatory on Record Header')
                    checkSublist = false
                }

                if (recType == 'deposit'){
                    sublistId = 'payment'
                    checkSublist = true
                }

                if (recType == 'journalentry'){
                    sublistId = 'line'
                    checkSublist = true
                }

                var headerAccountArray = ['cashrefund', 'cashsale', 'creditmemo', 'customerpayment', 'expensereport', 'vendorpayment']
                if(headerAccountArray.indexOf(recType) > -1) {
                    log.debug('beforeSubmit', 'Check Record Header Account')
                    checkSublistAccount = false
                }

                var lineAccountArray = ['deposit', 'journalentry', 'purchaseorder', 'vendorbill', 'vendorcredit', 'vendorreturnauthorization']
                if(lineAccountArray.indexOf(recType) > -1) {
                    log.debug('beforeSubmit', 'Check Sublist Account')
                    checkSublistAccount = true
                }

                if(recTypeAllowed > -1) {
                    log.debug('beforeSubmit', 'Department not Mandatory')

                }else if(checkSublist == true){

                    log.debug('checkSublist', 'Check Sublist for Department')

                    var sublistLineCount = newRecord.getLineCount({
                        sublistId: sublistId
                    });

                    log.debug('sublistLineCount', sublistLineCount)

                    for (var i=0; sublistLineCount != 0 && i < sublistLineCount; i++){
                        departmentValue = newRecord.getSublistValue({
                            sublistId: sublistId,
                            fieldId: 'department',
                            line: i
                        });
                        log.debug('departmentValue of Line ' + i, departmentValue)

                        if(checkSublistAccount == true){

                            log.debug('checkSublistAccount', 'Check Sublist Account')

                            accountId = newRecord.getSublistValue({
                                sublistId: sublistId,
                                fieldId: 'account',
                                line: i
                            });
                            log.debug('accountId', accountId)

                        }else if(checkSublistAccount == false){

                            log.debug('checkSublistAccount = false', 'Check Header Account')
                            accountId = newRecord.getValue('account')
                            log.debug('accountId', accountId)
                        }
                        validateDepartment(accountId, departmentValue, noDepartment)

                    }
                }else if(checkSublist == false){

                    log.debug('checkSublist = false', 'Check Header for Department and Account')

                    departmentValue = newRecord.getValue('department')
                    log.debug('departmentValue', departmentValue)

                    accountId = newRecord.getValue('account')

                    if(recType == 'customerpayment'){
                        var arAccount = newRecord.getValue('aracct')
                        log.debug('arAccount', arAccount)
                        accountId = (!isEmpty(accountId)) ? accountId: arAccount
                    }
                
                    log.debug('accountId', accountId)

                    validateDepartment(accountId, departmentValue, noDepartment)

                }
            } catch (e) {
                log.error('beforeSubmit', JSON.parse(JSON.stringify(e)));
                throw e;
            }

            //return returnValue;
        }

        /**
         * @param {AfterSubmitContext} context
         * @return {void}
         */
        function afterSubmit(context) {
            try {
                log.audit('afterSubmit', {
                    type: context.type,
                    newRecord: {
                        type: context.newRecord.type,
                        id: context.newRecord.id,
                    }
                    //oldRecord: {
                    //  type: context.oldRecord.type,
                    //  id: context.oldRecord.id,
                    //},
                });



            } catch (e) {
                log.error('afterSubmit', JSON.parse(JSON.stringify(e)));
            }
        }

        function validateDepartment (accountId, departmentValue, noDepartment){

            log.audit('validateDepartment', 'Validate Department START')

            var myCustomError = error.create({
                name: 'INVALID_DATA',
                message: 'Invalid or Empty Department Selection.',
                notifyOff: false
            });

            //log.debug('accountId', accountId)
            //log.debug('departmentValue', departmentValue)
            //log.debug('noDepartment', noDepartment)

            var accountType = search.lookupFields({
                type: search.Type.ACCOUNT,
                id: accountId,
                columns: ['type']
            });

            //log.debug('accountType', accountType)

            var acctType = accountType.type[0].value;
            log.debug('acctType', acctType)

            if((acctType == 'OthCurrAsset') || (acctType == 'Expense') || (acctType == 'FixedAsset')){

                log.debug('beforeSubmit', 'Account Type = Other Current Asset/Expense/Fixed Asset')

                if(departmentValue == noDepartment || isEmpty(departmentValue)){

                    log.debug('beforeSubmit', 'Department selected is the default or empty. Invalid or Empty Department Selection')

                    // This will write 'Error: WRONG_PARAMETER_TYPE Wrong parameter type selected' to the log
                    log.error('Error: ' + myCustomError.name , myCustomError.message);
                    throw myCustomError;

                }else{
                    log.debug('beforeSubmit', 'Valid Department selection')
                }
            }else{
                log.debug('beforeSubmit', 'Account Type != Other Current Asset/Expense/Fixed Asset')

                if(departmentValue != noDepartment || isEmpty(departmentValue)){

                    log.debug('beforeSubmit', 'Department Selected is not the default or empty. Invalid or Empty Department Selection')

                    // This will write 'Error: WRONG_PARAMETER_TYPE Wrong parameter type selected' to the log
                    log.error('Error: ' + myCustomError.name , myCustomError.message);
                    throw myCustomError;

                }else{
                    log.debug('beforeSubmit', 'Valid Department selection')

                    /*
                    currentRecord.setValue({
                        fieldId: 'department',
                        value: 44,
                        ignoreFieldChange: true,
                        forceSyncSourcing: true
                    });
                    */

                }
            }
            log.audit('validateDepartment', 'Validate Department END')
        }


        function isEmpty (stValue) {

            return ((stValue === '' || stValue == null || stValue == undefined) || (stValue.constructor === Array && stValue.length == 0) || (stValue.constructor === Object && (function(v) {
                for (var k in v)
                    return false;
                return true;
            })(stValue)));

        };

        return {
            // beforeLoad: beforeLoad,
             beforeSubmit: beforeSubmit,
            // afterSubmit: afterSubmit,
        };

    }
);