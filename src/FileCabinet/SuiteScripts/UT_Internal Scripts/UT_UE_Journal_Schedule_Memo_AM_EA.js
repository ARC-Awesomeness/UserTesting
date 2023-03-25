/**
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 */
define(['N/log', 'N/search', 'N/record', 'N/email', 'N/runtime'], function(log, search, record, email, runtime) {

	function afterSubmit(context) {

		log.debug(context.type);

		try {

			//run on create only    
			if (context.type == 'create') {

				//get JE id
				var journal_internal_id = context.newRecord.id;
				log.debug({
					title: 'journal_internal_id',
					details: journal_internal_id
				});
				//get record type
				var rec = context.newRecord;
				//check if the JE is created from expense allocation scheudle
				var je_obj = record.load({
					type: record.Type.JOURNAL_ENTRY,
					id: journal_internal_id
				});
				var parent_expense_alloc = je_obj.getText({
					fieldId: 'parentexpensealloc'
				});
				log.debug({
					title: 'parent_expense_alloc?',
					details: parent_expense_alloc
				});


				if (parent_expense_alloc != "") {

                  	//set memo on the line level
                  	je_obj.setValue({
                      fieldId: 'memo',
                      value: parent_expense_alloc
                    });

					//get line count
					var line_count = je_obj.getLineCount({
						sublistId: 'line'
					});

					for (var row = 0; row < line_count; row++) {
						je_obj.setSublistValue({
							sublistId: 'line',
							fieldId: 'memo',
							value: parent_expense_alloc,
							line: row
						});
					}
					je_obj.save();
				}

				var is_amortization = je_obj.getValue({
					fieldId: 'isfromamortization'
				});

				log.debug({
					title: 'is_amortization?',
					details: is_amortization
				});

				if (is_amortization == "T" || is_amortization == "True") {

					var month = {'Jan':'January', 'Feb':'February','Mar':'March','Apr':'April','May':'May','Jun':'June','Jul':'July','Aug':'August','Sep':'September','Oct':'October','Nov':'November','Dec':'December'};
					var posting_month = (je_obj.getText({fieldId:'postingperiod'})).slice(0,3);
					je_obj.setValue({
						fieldId:'memo',
						value:month[posting_month]+' Amortization'
					});

					var transaction_memo = {};
					//load amortization schedules detail search to store memo in array
					var schedule_search = search.load({
						id: 'customsearch_ut_amortization_je_memo'
					});

					var filters = schedule_search.filters;
					var filterOne = search.createFilter({
						name: 'internalid',
						join: 'journal',
						operator: 'anyof',
						values: journal_internal_id
					});

					filters.push(filterOne);

					schedule_search.run().each(function(result) {
						transaction_memo[result.id] = result.getValue({
							name: 'memo',
							join: 'transaction'
						});
						return true;

					});
					
					
					/**
					 * START March 17.2023 - Harleen Kaur
					 * get line count
					 * load each line and get department name for each line
					 * if department name is old department name then replace it with new one
			    	*/
			    	
					var scriptObj = runtime.getCurrentScript();
					var old_department = scriptObj.getParameter({
						name: 'custscript_old_dept_id'
					});
					var corresponding_department = scriptObj.getParameter({
						name: 'custscript_new_cpd_dept_id'
					});
					
					log.debug('These are the old departments: '+ old_department);
					log.debug('These are the corresponding departments: '+corresponding_department);
					

					var old_department_array = old_department.split(',');
					var corresponding_department_array = corresponding_department.split(',');					
					log.debug('These are the old departments: '+ old_department_array);
					log.debug('These are the corresponding departments: '+corresponding_department_array);
					
					var corresponding_department_obj = {};
					for(var i=0; i<corresponding_department_array.length; i++){
						log.debug(corresponding_department_array[i]);
						log.debug(corresponding_department_array[i].split(':')[0]);
						var a = corresponding_department_array[i].split(':')[0];
						var b = corresponding_department_array[i].split(':')[1];
						a = parseFloat(a);
						b = parseFloat(b);
						log.debug('a:::::'+a);
						log.debug('b:::::'+b);
						log.debug(corresponding_department_obj[corresponding_department_array[i].split(':')[0]]);
						corresponding_department_obj[a] = b;
					}
					
					log.debug('This is the Corresponding Department Obj: '+ JSON.stringify(corresponding_department_obj));					
					 
					/**
					 * March 17, 2023 - Harleen Kaur Continued...
					 */
					
					//get line count
					var linecount = rec.getLineCount({
						sublistId: 'line'
					});
					var changes_made = 'false';

					for (var i = 0; i < linecount; i++) {
						
						/**
						 * March 17, 2023 Harleen Kaur
						 */
						var current_department = je_obj.getSublistValue({
							sublistId: 'line',
							fieldId: 'department',
							line: i
						});
						
						if(old_department_array.indexOf(current_department)>-1){
							je_obj.setSublistValue({
								sublistId: 'line',
								fieldId: 'department',
								line: i,
								value: corresponding_department_obj[current_department]
							});
						}
						
						//ammortization schedule id
						var amor_schedule = je_obj.getSublistValue({
							sublistId: 'line',
							fieldId: 'schedulenum',
							line: i
						});

						var memo_value =transaction_memo[amor_schedule];
						if(memo_value!=""){
							je_obj.setSublistValue({
							sublistId: 'line',
							fieldId: 'memo',
							line: i,
							value: 'Amortization- ' +memo_value
						});
						}
						else
							je_obj.setSublistValue({
								sublistId: 'line',
								fieldId: 'memo',
								line: i,
								value: 'Amortization'
							});

						
						changes_made = 'true';

					}
					if (changes_made) {
						je_obj.save();
						log.debug('Memo Updated on JE: ' + journal_internal_id);
					} else
						return true;
				}
			} 
			if(context.type=='edit' && (is_amortization == "T" || is_amortization == "True")){

				var month = {'Jan':'January', 'Feb':'February','Mar':'March','Apr':'April','May':'May','Jun':'June','Jul':'July','Aug':'August','Sep':'September','Oct':'October','Nov':'November','Dec':'December'};
					var posting_month = (je_obj.getText({fieldId:'postingperiod'})).slice(0,3);
					je_obj.setValue({
						fieldId:'memo',
						value:month[posting_month]+' Amortization'
					});

			}
			else {
				return true;
			}
		} catch (e) {
			log.debug({
				title: 'An error occured in a afterSubmit function of a script running on Journal Entries: ',
				details: e
			});
			var scriptObj = runtime.getCurrentScript();
			var admin_recipients = scriptObj.getParameter({
				name: 'custscript_ut_admin_error_recipients_id'
			});
			email.send({
				author: admin_recipients,
				recipients: admin_recipients,
				subject: 'Error occured. Script|UT - Journal Schedule Memo Update| AM AR',
				body: 'An error occured in afterSubmit function:' + e
			});

		}
	}
	return {
		afterSubmit: afterSubmit
	}
});