/**
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 */
define(['N/record','N/runtime'], function(record, runtime) {
    function onAction(context){
        log.debug({
            title: 'Start Script'
        });
            var jeRecord = context.newRecord;
            var isAllocation = jeRecord.getValue('parentexpensealloc');
            var approvalStatus = jeRecord.getValue('approvalstatus');
            var postingBook = jeRecord.getValue('accountingbook'); 
            var jeDate = jeRecord.getValue('trandate');
            var recType = jeRecord.type;
            var statBookReversal = jeRecord.getValue('custbody_stat_book_reversal_journal_li');
            var recId = '';

            log.debug('jeRecord',jeRecord);
            log.debug('isAllocation',isAllocation);
            log.debug('approvalStatus',approvalStatus);
            log.debug('postingBook',postingBook);
            log.debug('jeDate',jeDate);
            log.debug('recType',recType);
            log.debug('statBookReversal',statBookReversal);


            if((isAllocation != 'null' && isAllocation != '') && (postingBook == '2') && (statBookReversal =='')){

                recId = createRevJournal(jeRecord.id, jeDate, recType);
                log.debug('recId', recId);
            }

            return recId;
        
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
        log.debug(thisUser);
        // //Nov 24 2022, changes made to account for multibook
        // var isTrue = 'F';
         var flag_bookje = jrnlRec.getValue('bookje');
        // log.debug('Is Book JE: '+flag_bookje); 
        // var isbookje = jrnlRec.getValue('accountingbook'); 

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
       
        destJournalRec.setValue('accountingbook',3);
        destJournalRec.setValue('subsidiary', jrnlRec.getValue('subsidiary'));  
        destJournalRec.setValue('trandate', jrTranDate );   
        destJournalRec.setValue('memo', 'Reversal of Local Book JE' + jrnlRec.getValue('memo'));    
        destJournalRec.setValue('currency', jrnlRec.getValue('currency'));  
        destJournalRec.setValue('custbody_ut_approver_1', '');
        destJournalRec.setValue('custbody_ut_created_by', thisUser.id);
        destJournalRec.setValue('custbody_ut_created_by_role', thisUser.role);
        destJournalRec.setValue('custbody_ut_created_from_journal', sourceJournal);
        destJournalRec.setValue('exchangerate', jrnlRec.getValue('exchangerate'));
        destJournalRec.setValue('custbody_ut_stat_book_reversal',true);
        destJournalRec.setValue('approvalstatus','2');

           
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
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'linesubsidiary', line: i})
            });
            
            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'account',
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'account', line: i})
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'debit',
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'credit', line: i})
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'credit',
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'debit', line: i})
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'memo',
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'memo', line: i})
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'entity',
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'entity', line: i})
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'department',
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'department', line: i})
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'class',
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'class', line: i})
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'location',
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'location', line: i})
            });
            
            
            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'linebasecurrency',
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'linebasecurrency', line: i})
            });
            
            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'linefxrate',
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'linefxrate', line: i})
            });

            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'eliminate',
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'eliminate', line: i})
            });
            
            destJournalRec.setCurrentSublistValue({
                sublistId: 'line',
                fieldId: 'duetofromsubsidiary',
                value: jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'duetofromsubsidiary', line: i})
            });
            
            var jrnlSchedule = jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'schedule', line: i});
            var jrnlStartDate = new Date(jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'startdate', line: i}));
            var jrnlEndDate = new Date(jrnlRec.getSublistValue({sublistId: 'line', fieldId: 'enddate', line: i}));
            
            
            if ((jrnlSchedule != '' && jrnlSchedule != null) && (jrnlStartDate != '' && jrnlStartDate != null) && (jrnlEndDate != '' && jrnlEndDate != null))
            {
               
                destJournalRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'schedule',
                    value: jrnlSchedule
                });
                
                destJournalRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'startdate',
                    value: jrnlStartDate
                });

                destJournalRec.setCurrentSublistValue({
                    sublistId: 'line',
                    fieldId: 'enddate',
                    value: jrnlEndDate
                });

            }        
            
            destJournalRec.commitLine({
                sublistId: 'line'
            });
            
        }

        log.debug('Line 221')
        var destJrnlId = destJournalRec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
        log.debug('Line 226')
        log.debug('destJrnlId',destJrnlId)

        return destJrnlId;
        
    }

 return {
       onAction: onAction
    };
    
});