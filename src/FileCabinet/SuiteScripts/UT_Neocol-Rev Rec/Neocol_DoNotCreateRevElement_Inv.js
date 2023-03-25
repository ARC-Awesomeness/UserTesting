/**
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @NScriptType UserEventScript
 * @see https://system.netsuite.com/app/help/helpcenter.nl?fid=section_4387799721.html
 */
define(['N/search', 'N/record'],

    /**
     * @return {{
     *   beforeLoad?: Function,
     *   beforeSubmit?: Function,
     *   afterSubmit?: Function,
     * }}
     */
    function (search, record) {

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
            } catch (e) {
                log.error('beforeSubmit', JSON.parse(JSON.stringify(e)));
            }

            var type = context.type;
            var newRecord = context.newRecord;
            var oldRecord = context.oldRecord

            log.debug('type = ' + type, 'set Do Not Create Revenue Element START');

            var recType = newRecord.type;
            log.debug('recType', recType)
          
            var invLineCount = newRecord.getLineCount({
                sublistId: 'item'
            });

            log.debug('invLineCount', invLineCount)

            for (var i=0; invLineCount != 0 && i < invLineCount; i++){
                  //CPQB-306 - Conditional logic based on Record Type. If Invoice/CM, check Do Not Create Revenue Element. If Invoice, set Reference Contract Line  
                  if (recType == 'invoice' || recType == 'creditmemo') {
                    var itemId = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    });
                    log.debug('itemId', itemId)

                    var itemLookupObj = search.lookupFields({
                        type: search.Type.ITEM,
                        id: itemId,
                        columns: ['createrevenueplanson', 'custitem_discount_item'
                        ]
                    });
                    log.debug('itemLookupObj', itemLookupObj)

                    var nativeCreateRevenueElement = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'donotcreaterevenueelement',
                        line: i
                    });
                    log.debug('nativeCreateRevenueElement', nativeCreateRevenueElement)
                    var crRevPlans = -100;
                              
                    if (!isEmpty(itemLookupObj.createrevenueplanson[0]))
                      crRevPlans = itemLookupObj.createrevenueplanson[0].value;
                    
                   
                    if (crRevPlans != -2) {

                        newRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'donotcreaterevenueelement',
                            line: i,
                            value: true
                        });
                        var nativeCreateRevenueElement = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'donotcreaterevenueelement',
                            line: i
                        });
                        log.debug('nativeCreateRevenueElement', nativeCreateRevenueElement)

                    } else {
                        newRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'donotcreaterevenueelement',
                            line: i,
                            value: false
                        });
                        var nativeCreateRevenueElement = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'donotcreaterevenueelement',
                            line: i
                        });
                        log.debug('nativeCreateRevenueElement', nativeCreateRevenueElement)


                    }

                }
             
              if (recType == 'invoice')
              {
                //SRIRAM - POPULATE REFERENCE CONTRACT LINE ON INVOICE LINES
                var contractRefLineId = '';
              
                var invSourceExtId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_arm_sourceexternalid',
                    line: i
                });
              
              
                log.debug('invSourceExtId', invSourceExtId);
              
                if (!isEmpty(invSourceExtId))
                {
                  var customrecord_contractlinesSearchObj = search.create({
                  type: "customrecord_contractlines",
                  filters:
                  [
                     ["custrecord_is_cl_source_ext_id", "is", invSourceExtId]
                  ],
                  columns:
                  [
                     "internalid"
                  ]
                  });

                  var searchResultCount = customrecord_contractlinesSearchObj.runPaged().count;
                  log.debug("customrecord_contractlinesSearchObj result count", searchResultCount);
                  if (searchResultCount > 0) {
                              customrecord_contractlinesSearchObj.run().each(function (result) {
                                  contractRefLineId = result.getValue({name: 'internalid'});
                                  log.debug('contractRefLineId', contractRefLineId)
                                  return true;
                  				});
                  }                        
				  log.debug('contractRefLineId', contractRefLineId);
				//Turning off temporarily 07/06/2022, 07/07/2022
                   newRecord.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_reference_contractline',
                        line: i,
                        value: contractRefLineId
                    });
                  
                }
              
              var referenceContractLine = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_reference_contractline',
                    line: i
                });

                if(!isEmpty(referenceContractLine)){

                    var updateRevenueElement = record.submitFields({
                        type: 'customrecord_contractlines',
                        id: referenceContractLine,
                        values: {
                            'custrecord_is_update_rev_element': true
                        }
                    });

                }
              
             }
            }

            log.audit('Do Not Create Revenue Element', 'END');
        }

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
                
                // Populate Email ID on the Customer Record Start
                var newRecord = context.newRecord;
                var recType = newRecord.type;


                if (recType == 'invoice')
                {
                	var contactEmail = newRecord.getValue('custbody_ut_contact_email_address');
                	var customerId = newRecord.getValue('entity');
                
                	log.debug('afterSubmit', 'customerId-' + customerId + '~' + 'contactEmail-' + contactEmail);

                	if ((contactEmail != '' && contactEmail != null) && (customerId != null && customerId != ''))
                	{
                    	var customerObj = search.lookupFields({
                        	type: search.Type.CUSTOMER,
                        	id: customerId,
                        	columns: ['email']
                    	});
                    
                    	var custEmail = customerObj.email;
                    	log.debug('afterSubmit', 'custEmail-' + custEmail);
                    
//                    	if (custEmail == '' || custEmail == null)
//                    	{
                        	var setCustEmail = record.submitFields({
                            	type: record.Type.CUSTOMER,
                            	id: customerId,
                            	values: {
                                	'email': contactEmail
                            	}
                        	});

//                    	}

                	}
                	else
                	{
                    	log.debug('afterSubmit', 'No contactEmail provided');
                	}
                }
                // Populate Email ID on the Customer Record End


            } catch (e) {
                log.error('afterSubmit', JSON.parse(JSON.stringify(e)));
            }
        }


        function is_so_(context) {

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
             beforeSubmit: beforeSubmit
          //Turning off temporarily 07/06/2022, 07/07/2022
             ,afterSubmit: afterSubmit
        };

    }
);