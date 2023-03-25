/**
*@NApiVersion 2.x
*@NScriptType ClientScript
*This script takes vendor name and performs a search on the custom vendor record to find duplicate of this vendor
*If a duplicate if found, alert is displayed to the user and the user may decide to proceed or not proceed and review the detected duplicates
*/

define(['N/error','N/search','N/runtime', 'N/ui/message','N/email'],
    function(error, search, runtime, message,email){
        function saveRecord(context){

        try{
            
          //run this script in UI context only
          if(runtime.executionContext!==runtime.ContextType.USER_INTERFACE){
            return true;
          }
          
          //get current vendor name
            var currentRecord = context.currentRecord;
            // reset duplicatea
            currentRecord.setValue({
                fieldId:'custentity_ut_vendor_dup',
                value: false
            }); 
            
            var duplicate_vendor_list = [];
            var duplicate_vendor_name = "";
            var duplicate_vendor_link_array =[];
            var isPerson = currentRecord.getValue({fieldId:'isperson'});
            var vendor_name = currentRecord.getValue({
                                fieldId: 'companyname'
                                });
            var firstname = currentRecord.getValue({fieldId: 'firstname'});
            var middlename = currentRecord.getValue({fieldId: 'middlename'});
            var lastname = currentRecord.getValue({fieldId: 'lastname'});

            if(isPerson=='T'){
                vendor_name = firstname + " " + middlename + " " + lastname;
                    if(middlename==""){
                        vendor_name = firstname + " " + lastname;
                    }
            }
            vendor_name = (trim(vendor_name)).toLowerCase();

            /*
            * create dynamic filters
            * split company name and take only first two words to use as filters
            * if one of the filters are one of the common company name keywords, ignore it
            * run the search
            */
            var scriptObj = runtime.getCurrentScript();
            var common_keywords = scriptObj.getParameter({name: 'custscript_ut_common_keywords'});
        
            var array_length = scriptObj.getParameter({name: 'custscript_ut_array_length'});
            var filter_array=[];
            var split_name = vendor_name.split(" "); var a = [];

            log.debug(split_name[0]);
            log.debug(split_name[1]);

            log.debug(common_keywords.indexOf(split_name[0]));
            log.debug(common_keywords.indexOf(split_name[1]));


            if(split_name.length>1){
                for(var i=0; i<array_length; i++){
                    if(common_keywords.indexOf(split_name[i])>=0){ 
                       // alert('match common keywords');
                    }
                    else{
                        a.push(split_name[i]);
                        filter_array.push(["name","contains",split_name[i]]);
                        filter_array.push('OR');
                    }
                }
                log.debug('before pop');
                filter_array.pop();
                log.debug(filter_array);

            }

            //add if condition is vendor_name has only 1 word
            if(split_name.length==1){
                    if(common_keywords.indexOf(split_name[i])>=0){ 
                        console.log('match common keywords');
                    }
                    else{
                        a.push(split_name[0]);
                        filter_array.push(["name","contains",split_name[0]]);
                    }
            }

            var counter = 0;
            var current_record_id = currentRecord.id;
            
            log.debug(filter_array.length);

            // create a custom vendor search with current vendor name as filter
            //if filter array is not empty
            if(filter_array.length>0){

            var vendor_search_obj = search.create({
                type: search.Type.CUSTOM_RECORD+'_ut_vendor_list',
                filters:
                [
                    [filter_array],"AND", ["isinactive","is","F"]
                ],
                columns:
                [
                    {name: "custrecord_ut_vendor_id"},
                    {name: "custrecord_ut_vendor_internal_id"},
                    {name: "name"},
                    {name: "custrecord_ut_vendor_subsidiary"}
                ]
            });

            var resultCount = vendor_search_obj.runPaged().count;

            if(resultCount>0){
            //run the search
            vendor_search_obj.run().each(function(result){

                    if(current_record_id != result.getValue('custrecord_ut_vendor_internal_id')){
                        duplicate_vendor_list[counter] = result.getValue('name');
                        duplicate_vendor_link_array[counter] = '</br><a href="https://'+window.location.host+'/app/common/entity/vendor.nl?id='+ result.getValue('custrecord_ut_vendor_internal_id')+'" target="_blank">'+result.getValue("custrecord_ut_vendor_id")+" " + result.getValue("name") +'</a>'+ " -"+result.getValue("custrecord_ut_vendor_subsidiary");
                        counter++;        
                    }
    
                    else{
                        console.log('no duplicates detected');
                    }

                return true;
            });
                
            var msg = message.create({
                    title: 'Possible Duplicate Vendors',
                    message: 'Please review the following Vendor Records detected by the system that could be duplicate of the vendor you are currently creating. After reviewing, Select Save and Click OK to proceed creating this new Vendor or Press Cancel to not create this new Vendor.'+duplicate_vendor_link_array,
                    type: message.Type.WARNING
            });

            if(duplicate_vendor_list.length > 0){
                var confirmation = confirm("Duplicate Vendor Detected. Press OK to Proceed creating this new Vendor. To review duplicate/duplicates, please click Cancel.");
              if(confirmation){
                  currentRecord.setValue({
                    fieldId:'custentity_ut_vendor_dup',
                    value: true
                });
                return confirmation;
              }
              else{
                msg.show();
              }
            }
            if(duplicate_vendor_list.length <= 0){
            return true;   
            }
            
            }
        else{
            return true;
            }
        }//if resultcount>0
        else{
            return true;
        }//if filter_array.length>0
        }catch(e){
            var scriptObj = runtime.getCurrentScript();
            var admin_recipients = scriptObj.getParameter({name: 'custscript_ut_admin_error_recipients_ce'});


            log.debug({
                title: 'Error occured. Email will be sent to admins.',
                details: e
            });
            email.send({
              author: admin_recipients,
              recipients: admin_recipients,
              subject: 'Error occured. Script| UT - Vendor Duplicate Check.',
              body:'An error occured in saveRecord function:'+ e
            });
          }
        }

    return{
        saveRecord:saveRecord
    }
});