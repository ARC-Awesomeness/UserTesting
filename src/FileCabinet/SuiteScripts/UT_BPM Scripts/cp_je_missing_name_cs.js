/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/search'],
/**
 * @param{currentRecord} currentRecord
 * @param{record} record
 */
function(currentRecord, record,search) {
    
    /**
     * Function to be executed after page is initialized.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
     *
     * @since 2015.2
     */
    function pageInit(scriptContext) {

    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {

    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    function postSourcing(scriptContext) {

    }

    /**
     * Function to be executed after sublist is inserted, removed, or edited.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function sublistChanged(scriptContext) {

    }

    /**
     * Function to be executed after line is selected.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @since 2015.2
     */
    function lineInit(scriptContext) {

    }

    /**
     * Validation function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @returns {boolean} Return true if field is valid
     *
     * @since 2015.2
     */
    function validateField(scriptContext) {

    }

    /**
     * Validation function to be executed when sublist line is committed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateLine(scriptContext) {
        //what they want to happen is to get an error/alert message when they try submitting
        //when the name is empty, only if the account type is expense or accounts payable
        var currentRecord = scriptContext.currentRecord;
        var sublistName = scriptContext.sublistId;



        var lineName = currentRecord.getCurrentSublistValue({
            sublistId: 'line',
            fieldId: 'entity_display'
        });
        log.debug('this is the line name',lineName);
        var lineAccount = currentRecord.getCurrentSublistValue({
           sublistId: 'line',
           fieldId: 'account'
        });
        log.debug('this is the line account',lineAccount);

        var lineType = currentRecord.getCurrentSublistValue({
           sublistId: 'line',
           fieldId: 'accounttype'
        });
        var lineBox = currentRecord.getCurrentSublistValue({
           sublistId: 'line',
           fieldId: 'custcol_cp_valid_name_box'
        });
        log.debug('this is the account type',lineType);
        log.debug('this is what the linebox value is before the if check',lineBox);

        var defaultEmpty = "\<"+ "Type then tab"+ "\>";
        log.debug('this is default empty for escape',defaultEmpty);

        if (defaultEmpty == lineName) {
            log.debug('got here where line name and default empty are equal');
        }

        if ((lineType == 'Expense' || lineType == 'AcctPay') && !lineBox && (isEmpty(lineName) || lineName == defaultEmpty)) {
                alert('Please enter a name for this line, as the account type is an expense or account payable type');

 /*               currentRecord.setCurrentSublistValue({
                   sublistId: 'line',
                   fieldId: 'custcol_cp_valid_name_box',
                   value: true
                });
                currentRecord.commitLine({
                    sublistId: 'line'
                });*/
              //  return true;

            //return true;
        }
        return true;
    }

    /**
     * Validation function to be executed when sublist line is inserted.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateInsert(scriptContext) {

    }

    /**
     * Validation function to be executed when record is devared.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     *
     * @returns {boolean} Return true if sublist line is valid
     *
     * @since 2015.2
     */
    function validateDevare(scriptContext) {

    }

    /**
     * Validation function to be executed when record is saved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @returns {boolean} Return true if record is valid
     *
     * @since 2015.2
     */
    function saveRecord(scriptContext) {
        return true;
    }

    function isEmpty(value) {
        if (value == null || value == 'null' || value == undefined || value == 'undefined' || value == '' || value == "") {
            return true;
        }
        return false;
    }

    return {
        pageInit: pageInit,
        //fieldChanged: fieldChanged,
        //postSourcing: postSourcing,
        //sublistChanged: sublistChanged,
        //lineInit: lineInit,
        //validateField: validateField,
        validateLine: validateLine,
        //validateInsert: validateInsert,
        //validateDevare: validateDevare,
        saveRecord: saveRecord
    };
    
});
