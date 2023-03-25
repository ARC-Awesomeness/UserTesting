/**
* Module Description: 
* 		Distribute the amortization to stub period
*
* Version   Date            Author          Remarks
* 1.0       Jan 10, 2023    Suren
* 
*/

/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define([
        'N/error', 'N/record', 'N/runtime', 'N/search', 'N/format', 'N/task'],

function(
		error, record, runtime, search, format, task) {


	var STUBPERIOD = "257";
	var POSTACQPERIOD = "139";
	
	var lastInternalId = "39620";
	var runPeriod = STUBPERIOD;

	function execute(context) {
		
		var amortizationscheduleSearchObj = search.create({
		   type: "amortizationschedule",
		   filters:
		   [
		      ["postperiod","anyof",runPeriod], 
		      "AND", 
		      ["amorstatus","anyof","INPROGRESS","NOTSTARTED"], 
		      "AND", 
		      ["internalidnumber","greaterthan",lastInternalId],
		      "AND",
		      ["internalidnumber","lessthanorequalto","39640"] 
		   ],
		   columns:[]
		});

		var searchResultCount = amortizationscheduleSearchObj.runPaged().count;
		log.debug("searchResultCount",searchResultCount);


		amortizationscheduleSearchObj.run().each(function(result){

			if(runPeriod == STUBPERIOD)
				processPostStubAS(result.id); //new
			else
				processPreStubAS(result.id); //old
			return true;
		});

			
	}

	function processPostStubAS(asId){

		//Update the new amortization schedules created after the addition of Stub period

		try{
			
			var amObj = record.load({
				type: record.Type.AMORTIZATION_SCHEDULE,
			    id: asId,
			    isDynamic: true
			});

			log.debug('Processing amortization schedule', 'Internal id = '+ asId);

			var totalAmount = amObj.getValue({fieldId: 'totalamount'});
			var lineCount = amObj.getLineCount({sublistId: 'recurrence'});

			if(lineCount < 2)
				return;

			var monthlyAmount = totalAmount/(lineCount-1); monthlyAmount = monthlyAmount.toFixed(2);
			var stubAmount = (monthlyAmount*11)/31; stubAmount = stubAmount.toFixed(2);
			var postAcqAmount = monthlyAmount - stubAmount; postAcqAmount = postAcqAmount.toFixed(2);
			var lastLineAmount = totalAmount - monthlyAmount*(lineCount-2);

			log.debug("Amounts", "totalAmount = "+ totalAmount+ ", lineCount = "+ lineCount+ ", monthlyAmount = "+ monthlyAmount+", stubAmount = "+stubAmount+", postAcqAmount = "+postAcqAmount+", lastLineAmount = "+lastLineAmount);
			var asAmount = 0.0;
			for(var i = 0; i < lineCount ; i++){

				amObj.selectLine({sublistId: 'recurrence', line: i});
				/*
				var isRecognized = amObj.getCurrentSublistValue({sublistId: 'recurrence', fieldId: 'isrecognized'});
				log.debug('isRecognized',isRecognized);
				if(isRecognized)
					continue;
				*/
				var postperiod = amObj.getCurrentSublistValue({sublistId: 'recurrence', fieldId: 'postingperiod'});
				if(i == lineCount-1)
					lineAmount = lastLineAmount;
				else if(postperiod == STUBPERIOD)
					lineAmount = stubAmount;
				else if(postperiod == POSTACQPERIOD)
					lineAmount = postAcqAmount;
				else
					lineAmount = monthlyAmount;

				amObj.setCurrentSublistValue({sublistId: 'recurrence', fieldId: 'recamount', value: lineAmount});
				
				log.debug('lineAmount', lineAmount);
				amObj.commitLine({sublistId: 'recurrence'});

			}

			var id = amObj.save({
				enableSourcing: true,
				ignoreMandatoryFields: true
			})
			
			if(id)
				log.debug('Last processed AS', asId);

        }catch(err){
        	log.debug('Error in processing '+asId, err);
        }
	}


	function processPreStubAS(asId){

		//Update the old amortization schedules created before the addition of Stub period
		try{
			
			var amObj = record.load({
				type: record.Type.AMORTIZATION_SCHEDULE,
			    id: asId,
			    isDynamic: true
			});

			log.debug('Processing amortization schedule', 'Internal id = '+ asId);

			var line = amObj.findSublistLineWithValue({
			    sublistId: 'recurrence',
			    fieldId: 'postingperiod',
			    value: POSTACQPERIOD
			});

			log.debug('Jan 2023 - Post Acq period Line', line);
			if(line < 0)
				return;

			amObj.selectLine({sublistId: 'recurrence', line: line});
			var monthlyAmount = amObj.getCurrentSublistValue({sublistId: 'recurrence', fieldId: 'recamount'});
			var account = amObj.getCurrentSublistValue({sublistId: 'recurrence', fieldId: 'defrevaccount'});
			var stubAmount = (monthlyAmount*11)/31; stubAmount = stubAmount.toFixed(2);
			var postAcqAmount = monthlyAmount - stubAmount; 

			log.debug("Amounts", "monthlyAmount = "+ monthlyAmount+", stubAmount = "+stubAmount+", postAcqAmount = "+postAcqAmount);
			
			amObj.setCurrentSublistValue({sublistId: 'recurrence', fieldId: 'recamount', value: postAcqAmount});
			amObj.commitLine({sublistId: 'recurrence'});

			amObj.selectNewLine({sublistId: 'recurrence'});
			amObj.setCurrentSublistValue({sublistId: 'recurrence', fieldId: 'defrevaccount', value: account});
			amObj.setCurrentSublistValue({sublistId: 'recurrence', fieldId: 'postingperiod', value: STUBPERIOD});
			amObj.setCurrentSublistValue({sublistId: 'recurrence', fieldId: 'recamount', value: stubAmount});
			amObj.commitLine({sublistId: 'recurrence'});

			
			var id = amObj.save({
				enableSourcing: true,
				ignoreMandatoryFields: true
			})
			
			if(id)
				log.debug('Last processed AS', asId);

        }catch(err){
        	log.debug('Error in processing '+asId, err);
        }
	}


	return {
		execute: execute
	};
	
});



