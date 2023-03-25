/**
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 * This script is created so that Vendor Duplicate Detection script can look for duplicate vendors(as custom vendors) in their subsidiary as well as across all the subsidiaries.
 * This script creates a custom vendor record for every vendor record created. 
 * This script updates the related custom vendor record whenever a change is made to the vendor record.
 * This script sets the custom vendor record as inactive when a vendor record is deleted.
 */
define(['N/log', 'N/search', 'N/record', 'N/email','N/runtime'], function(log, search, record, email,runtime) {
    function afterSubmit(context) {
log.debug('after submit');
      //run this in UI context only
      if(runtime.executionContext!==runtime.ContextType.USER_INTERFACE){
            return true;
      }

        log.debug(context.type);

        if (context.type != "delete") {

            try{

            var vendor_internal_id = context.newRecord.id;

            //get subsidiaries for the vendor

            var vendor_results = search.load({
                id:'customsearch_ut_vendor_subsidiary'
            });

            var subsidiary_name = "";

            var filters = vendor_results.filters;
                    var filterOne = search.createFilter({
                        name: 'internalid',
                        operator: 'anyof',
                        values: vendor_internal_id
                    });

            filters.push(filterOne);

            vendor_results.run().each(function(result){
                log.debug('This is line 41');
                log.debug(result.getValue(result.columns[0]));
                subsidiary_name = result.getValue(result.columns[0]);
                return true;
            });

            var vendor_obj = record.load({
                type: record.Type.VENDOR,
                id: vendor_internal_id
            });
            var vendor_name = vendor_obj.getValue({
                fieldId: 'companyname'
            });
            var isPerson = vendor_obj.getValue({
                fieldId: 'isperson'
            });
            var firstname = vendor_obj.getValue({
                fieldId: 'firstname'
            });
            var middlename = vendor_obj.getValue({
                fieldId: 'middlename'
            });
            var lastname = vendor_obj.getValue({
                fieldId: 'lastname'
            });

            if (isPerson == 'T') {
                vendor_name = firstname + " " + middlename + " " + lastname;
                if (middlename == "") {
                    vendor_name = firstname + " " + lastname;
                }
            }
           // vendor_name = trim(vendor_name);

            var subsidiary_id = vendor_obj.getValue({
                fieldId: 'subsidiary'
            });

            // var subsidiary_obj = record.load({
            //     type: record.Type.SUBSIDIARY,
            //     id: subsidiary_id
            // });
            // var subsidiary_name = subsidiary_obj.getValue({
            //     fieldId: 'name'
            // });
            var isinactive = vendor_obj.getValue({
                fieldId: 'isinactive'
            });
            var vendor_id = vendor_obj.getValue({
                fieldId: 'entityid'
            });
            var custom_record_created = vendor_obj.getValue({
                fieldId: 'custentity_ut_vendor_custom_record'
            });
            var vendor_cr_internalid = vendor_obj.getValue({
                    fieldId: 'custentity_ut_vendor_custom_record'
            });

            vendor_name = String(vendor_name);
            subsidiary_name = String(subsidiary_name);
            vendor_internal_id = String(vendor_internal_id);
            vendor_id = String(vendor_id);

            log.debug('vendor_name ' + vendor_name);
            log.debug('subsidiary ' + subsidiary_name);
            log.debug('internal_id ' + vendor_internal_id);

            if (context.type == "create" || vendor_cr_internalid=="") {

                // create new custom vendor record
                var vendor_cr = record.create({
                    type: 'customrecord_ut_vendor_list',
                    isDynamic: true
                });

                vendor_cr.setValue({
                    fieldId: 'name',
                    value: vendor_name
                });
                vendor_cr.setValue({
                    fieldId: 'custrecord_ut_vendor_subsidiary',
                    value: subsidiary_name
                });
                vendor_cr.setValue({
                    fieldId: 'custrecord_ut_vendor_id',
                    value: vendor_id
                });
                vendor_cr.setValue({
                    fieldId: 'custrecord_ut_vendor_internal_id',
                    value: vendor_internal_id
                });


                var vendor_custom_record_id = vendor_cr.save();


                vendor_obj.setValue({
                    fieldId: 'custentity_ut_vendor_custom_record',
                    value: vendor_custom_record_id
                });

                vendor_obj.save();
                log.debug('record created');

            }

            if (context.type == "edit" && vendor_cr_internalid >0) {

                //edit the custom vendor record to update it to reflect the changes made to vendor record
                log.debug('in edit mode');

                var vendor_cr_internalid = vendor_obj.getValue({
                    fieldId: 'custentity_ut_vendor_custom_record'
                });

                var change_made = "False"

                vendor_cr = record.load({
                    type: 'customrecord_ut_vendor_list',
                    id: vendor_cr_internalid
                });


                var vendor_name_cr = vendor_cr.getValue({
                    fieldId: 'name'
                });
                var subsidiary_name_cr = vendor_cr.getValue({
                    fieldId: 'custrecord_ut_vendor_subsidiary'
                });
                var vendor_id_cr = vendor_cr.getValue({
                    fieldId: 'custrecord_ut_vendor_id'
                });
                var vendor_internal_id_cr = vendor_cr.getValue({
                    fieldId: 'custrecord_ut_vendor_internal_id'
                });

                log.debug('custom record '+subsidiary_name_cr);
                log.debug('vendor record '+subsidiary_name);

                if (vendor_name_cr != vendor_name) {
                    vendor_cr.setValue({
                        fieldId: 'name',
                        value: vendor_name
                    });

                    log.debug('vendor name changed. New ' + vendor_name + ' Old ' + vendor_name_cr);

                    change_made = "True";
                }
                if (subsidiary_name_cr != subsidiary_name) {
                    vendor_cr.setValue({
                        fieldId: 'custrecord_ut_vendor_subsidiary',
                        value: subsidiary_name
                    });

                    change_made = "True";
                    log.debug('subsidiary changed. New ' + subsidiary_name + ' Old ' + subsidiary_name_cr);

                }
                if (vendor_id_cr != vendor_id) {
                    vendor_cr.setValue({
                        fieldId: 'custrecord_ut_vendor_id',
                        value: vendor_id
                    });

                    change_made = "True";
                    log.debug('vendor_id changed. New ' + vendor_id + ' Old ' + vendor_id_cr);

                }


                if (change_made = "True") {
                    vendor_cr.save();
                }

            }
          }catch(e){
            var scriptObj = runtime.getCurrentScript();
            var admin_recipients = scriptObj.getParameter({name: 'custscript_ut_admin_error_recipients'});

            log.debug({
                title: 'Error occured. Email will be sent to admins.',
                details: e
            });
            email.send({
              author: admin_recipients,
              recipients: admin_recipients,
              subject: 'Error occured. Script| UT - Create Vendor Custom Record',
              body:'An error occured in afterSubmit function:'+ e
            });
          }
        }

    



    }

    function beforeSubmit(context) {
log.debug('before submit');

      //run this script in UI context only
      if(runtime.executionContext!==runtime.ContextType.USER_INTERFACE){
            return true;
      }
        if (context.type == "delete") {
            try{
            var vendor_id = context.newRecord.id;
            var vendor_obj = record.load({
                type: record.Type.VENDOR,
                id: vendor_id
            });
            vendor_cr_internalid = vendor_obj.getValue({
                fieldId: 'custentity_ut_vendor_custom_record'
            });

            //mark the custom record as inactive
            var vendor_cr = record.load({
                type: 'customrecord_ut_vendor_list',
                id: vendor_cr_internalid
            });

            vendor_cr.setValue({
                fieldId: 'isinactive',
                value: true
            });

            vendor_cr.save();
            }catch(e){
            var scriptObj = runtime.getCurrentScript();
            var admin_recipients = scriptObj.getParameter({name: 'custscript_ut_admin_error_recipients'});

            log.debug({
                title: 'Error occured. Email will be sent to admins.',
                details: e
            });
            email.send({
              author: 'no-reply@usertesting.com',
              recipients: admin_recipients,
              subject: 'Error occured. Script| UT - Create Vendor Custom Record',
              body:'An error occured in beforeSubmit function:'+ e
            });
          }

        }

    }

    return {
        afterSubmit: afterSubmit,
        beforeSubmit: beforeSubmit
    }
});