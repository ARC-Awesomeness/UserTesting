/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       07 Dec 2021     sramanan         Initial Version
 *
 */
/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/runtime', 'N/search'],
/**
 * @param {record} record
 * @param {runtime} runtime
 * @param {search} search
 */
function(record, runtime, search) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(context) {
        try {
            var opType = context.type;

            if (opType == 'create' || opType == 'edit')
            {
                var newRecord = context.newRecord;

                var recType = newRecord.type;
                log.debug('recType', recType)
                
                var custRecId = newRecord.id;
                log.debug('custRecId', custRecId)
                
                sourceJournal = newRecord.getValue('custrecord_ut_source_journal');
                destJournalDate = newRecord.getValue('custrecord_ut_target_journal_date');   
                destJournal = newRecord.getValue('custrecord_ut_reversal_journal');
                statBookSourceJournal = newRecord.getValue('custrecord_stat_book_source_je');
                var statBookRecId="";
                

                if ((sourceJournal != null && sourceJournal != '') && (destJournalDate != null && destJournalDate != '') && (destJournal == null || destJournal == ''))
                {
                    var sourceJournalRecType = search.lookupFields({
                        type: 'transaction',
                        id: sourceJournal,
                        columns: 'recordtype'
                    });
                    log.debug('sourceJournalRecType', sourceJournalRecType.recordtype)


                    var recId = createRevJournal(sourceJournal, destJournalDate, sourceJournalRecType.recordtype);
                    if(statBookSourceJournal != null && statBookSourceJournal != ''){
                        var sourceJournalRecType = search.lookupFields({
                            type: 'transaction',
                            id: statBookSourceJournal,
                            columns: 'recordtype'
                        });                        
                        var statBookRecId = createRevJournal(statBookSourceJournal, destJournalDate, sourceJournalRecType.recordtype);
                    }
                    
                    if (recId != null && recId != '')
                    {
                        
                        var setRevJrnlId = record.submitFields({
                            type: 'customrecord_ut_journal_reversal',
                            id: custRecId,
                            values: {
                                'custrecord_ut_reversal_journal': recId
                            }
                        });
                        

                    }
                    if (statBookRecId != null && statBookRecId != '')
                    {
                        
                        var setRevJrnlId = record.submitFields({
                            type: 'customrecord_ut_journal_reversal',
                            id: custRecId,
                            values: {
                                'custrecord_ut_stat_book_reversal_journal': statBookRecId
                            }
                        });
                        

                    }
                }
            }

        } catch (e) {
            log.error('afterSubmit', JSON.parse(JSON.stringify(e)));
            throw 'Error in creating Reversal Journal. Contact Administrator' + JSON.parse(JSON.stringify(e))
        }
    }
    
    function createRevJournal(sourceJournal, destJournalDate, sourceJournalRecType)
    {
        var jrnlRec;
        var destJournalRec
        
        if (sourceJournalRecType == 'journalentry')
             jrnlRec = record.load({
                type: record.Type.JOURNAL_ENTRY,
                id: sourceJournal
            });
        else if (sourceJournalRecType == 'advintercompanyjournalentry')
             jrnlRec = record.load({
                type: record.Type.ADV_INTER_COMPANY_JOURNAL_ENTRY,
                id: sourceJournal
            });
            
        const thisUser = runtime.getCurrentUser();
        //Nov 24 2022, changes made to account for multibook
        var isTrue = 'F';
        var flag_bookje = jrnlRec.getValue('bookje');
        log.debug('Is Book JE: '+flag_bookje); 
        var isbookje = jrnlRec.getValue('accountingbook'); 
 //        if(isbookje>0){
 //            isTrue = 'T';
 //                       log.debug('Line 130 '+ isbookje);
 // //destJournalRec.setValue('accountingbook',jrnlRec.getValue('accountingbook'));
 //        }
        if (sourceJournalRecType == 'journalentry')
            destJournalRec = record.create({
                type: record.Type.JOURNAL_ENTRY,
                isDynamic: true,
                defaultValues: {
                bookje: flag_bookje
                }
                
            });
        else if (sourceJournalRecType == 'advintercompanyjournalentry')
            destJournalRec = record.create({
                type: record.Type.ADV_INTER_COMPANY_JOURNAL_ENTRY,
                isDynamic: true,
                defaultValues: {
                bookje: flag_bookje
                }
            });
        else
            return;
        
        var jrTranDate = new Date(destJournalDate);
        if(flag_bookje=="T"){
            destJournalRec.setValue('accountingbook',jrnlRec.getValue('accountingbook'));
        }
        destJournalRec.setValue('subsidiary', jrnlRec.getValue('subsidiary'));  
        destJournalRec.setValue('trandate', jrTranDate );   
        destJournalRec.setValue('memo', 'Reversal ' + jrnlRec.getValue('memo'));    
        destJournalRec.setValue('currency', jrnlRec.getValue('currency'));  
        destJournalRec.setValue('custbody_ut_approver_1', '');
        destJournalRec.setValue('custbody_ut_created_by', thisUser.id);
        destJournalRec.setValue('custbody_ut_created_by_role', thisUser.role);
        destJournalRec.setValue('custbody_ut_created_from_journal', sourceJournal);
        destJournalRec.setValue('exchangerate', jrnlRec.getValue('exchangerate'));
        


        
        var jrnlLineCount = jrnlRec.getLineCount({
            sublistId: 'line'
        });
        

        
        for (var i = 0; i < jrnlLineCount; i++)
        {
            var lineNum = destJournalRec.selectNewLine({
                sublistId: 'line'
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'linesubsidiary',
//                line: i,
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'linesubsidiary', line: i})
            });
            
            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'account',
//                line: i,
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'account', line: i})
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'debit',
//                line: i,
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'credit', line: i})
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'credit',
//                line: i,
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'debit', line: i})
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'memo',
//                line: i,
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'memo', line: i})
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'entity',
//                line: i,
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'entity', line: i})
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'department',
//                line: i,
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'department', line: i})
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'class',
//                line: i,
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'class', line: i})
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'location',
//                line: i,
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'location', line: i})
            });
            
            
            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'linebasecurrency',
//                line: i,
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'linebasecurrency', line: i})
            });
            
            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'linefxrate',
//                line: i,
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'linefxrate', line: i})
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'eliminate',
//                line: i,
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'eliminate', line: i})
            });
            
            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'duetofromsubsidiary',
//                line: i,
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'duetofromsubsidiary', line: i})
            });
            
            var jrnlSchedule = jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'schedule', line: i});
            var jrnlStartDate = new Date(jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'startdate', line: i}));
            var jrnlEndDate = new Date(jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'enddate', line: i}));
            
            
            if ((jrnlSchedule != '' && jrnlSchedule != null) && (jrnlStartDate != '' && jrnlStartDate != null) && (jrnlEndDate != '' && jrnlEndDate != null))
            {
/*              var amortSchedule = search.lookupFields({
                    type: 'amortizationschedule',
                    id: jrnlSchedule,
                    columns: 'parentSched'
                });
*/              
//              log.debug('aftersubmit', 'amortSchedule ' + amortSchedule);
                
                destJournalRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'schedule',
//                  line: i,
                    value: jrnlSchedule
                });
                
                destJournalRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'startdate',
//                  line: i,
                    value: jrnlStartDate
                });

                destJournalRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'enddate',
//                  line: i,
                    value: jrnlEndDate
                });

            }
            
            
            
            destJournalRec.commitLine({
                sublistId: 'line'
            });
            
        }

        
/*        var destJournalRec = record.copy({
            type: record.Type.JOURNAL_ENTRY,
            id: sourceJournal
        });
        var jrnlLineCount = destJournalRec.getLineCount({
            sublistId: 'line'
        });
        
        for (var i = 0; i < jrnlLineCount; i++)
        {

            var crValue = destJournalRec.getSublistValue({sublistId: 'line', fieldId: 'credit', line: i});
            var drValue = destJournalRec.getSublistValue({sublistId: 'line', fieldId: 'debit', line: i});
            
            if (crValue != null && crValue != '')
            {
                destJournalRec.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    line: i,
                    value: 0 
                });             destJournalRec.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    line: i,
                    value: crValue 
                });

            }
            if (drValue != null && drValue != '')
            {
                destJournalRec.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'debit',
                    line: i,
                    value: 0 
                });             destJournalRec.setSublistValue({
                    sublistId: 'line',
                    fieldId: 'credit',
                    line: i,
                    value: drValue 
                });

            }

            
        }
*/
        var destJrnlId = destJournalRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
        
        if (sourceJournalRecType == 'journalentry')
            var setRevJrnlId = record.submitFields({
                type: record.Type.JOURNAL_ENTRY,
                id: sourceJournal,
                values: {
                    'custbody_manual_rev_journal_link': destJrnlId
                }
            });
        else
            var setRevJrnlId = record.submitFields({
                type: record.Type.ADV_INTER_COMPANY_JOURNAL_ENTRY,
                id: sourceJournal,
                values: {
                    'custbody_manual_rev_journal_link': destJrnlId
                }
            });
        
        return destJrnlId;
        
    }

    return {
//        beforeLoad: beforeLoad,
//        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});