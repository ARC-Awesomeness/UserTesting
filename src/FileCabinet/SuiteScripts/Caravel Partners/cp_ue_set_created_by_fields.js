/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/runtime'],

    /**
     *
     * @param {runtime} runtime
     * @returns {{beforeSubmit: beforeSubmit, beforeLoad: beforeLoad, afterSubmit: afterSubmit}}
     */
    (runtime) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

            const thisRecord = scriptContext.newRecord;
            const thisUser = runtime.getCurrentUser();

            log.debug('context', runtime.executionContext);

            thisRecord.setValue({
                fieldId: 'custbody_ut_created_by',
                value: thisUser.id
            });

            thisRecord.setValue({
                fieldId: 'custbody_ut_created_by_role',
                value: thisUser.role
            });
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {


        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
