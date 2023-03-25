/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/runtime"],
    /**
     *
     * @param {runtime} runtime
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
            try {
                setLastModifiedUserEmail(scriptContext.newRecord);
            } catch (error) {
                log.error({
                    title: "Caught Error",
                    details: error
                })
            }
        }

        /**
         * Setting last modified user email (no save)
         * Setting email for integration to use when filtering last modified by date (so there's not a continuos loop of integration updating and re-processing)
         * @param {Record }target
         */
        const setLastModifiedUserEmail = (target) => {
            const user = runtime.getCurrentUser();

            target.setValue({
                fieldId: "custbody_cp_last_modified_email",
                value: user.email
            });

            log.audit({
                title: "Set Last modified by email",
                details: "Record = " + target.id + ", user email = " + user.email + ", user id = " + user.id
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
