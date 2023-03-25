/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 *
 * Version  Date            Author          Details
 * 1.0                      Urkesh Shah     Original version
 * 1.1      March 18, 2022   Lubna Waheed    NS ACS Case #4581436 (added functionality to send email with status of CSV
 * 1.2 Nov 22, 2022 Changed Uploaded by Harleen Kaur. Changed made by Sriram Ramanan in Sandbox Account
 *                                          Import upon Completion/Failure)
 */
define(['N/search', 'N/record', 'N/runtime', 'N/email', 'N/format', 'N/https', 'N/file', 'N/task'], function(search, record, runtime, email, format, https, file, task) {

    function execute() {
    	
    	
        var FUNC_NAME = 'Execute';
        var scriptObj = runtime.getCurrentScript();
        var deploymentId = scriptObj.deploymentId;
        
        var startDate = scriptObj.getParameter('custscript_start_date');
        var endDate = scriptObj.getParameter('custscript_end_date');
        log.debug(FUNC_NAME,'The startDate date is: '+ startDate);
        log.debug(FUNC_NAME,'The endDate date is: '+ endDate);

        if ((startDate != null && startDate != '') && (endDate != null && endDate != ''))
        {
        	executeDateRange();
        	return true;
    	}
        
        var searchId = scriptObj.getParameter('custscript_currency_search');
        var apiUrl = scriptObj.getParameter('custscript_api_url');
        var bearerToken = '';
        var baseCurrency = scriptObj.getParameter('custscript_onada_base_currency');

        var csvFileHeader = "Base Currency,Effective Date,Exchange Rate,Foreign Currency";
        var csvFileDetails = '';
        var yesterday = dateFormat(new Date(new Date().setDate(new Date().getDate() - 1)));
        log.debug(FUNC_NAME,'The Yesterday date is: '+ yesterday);


        var searchObj = search.load({
            id: searchId
        });
        if (runtime.envType == 'PRODUCTION') {
            bearerToken = scriptObj.getParameter('custscript_bearer_token_prod');
        } else {
            bearerToken = scriptObj.getParameter('custscript_bearer_token');
        }
        var headers = ({
            "Content-Type": "application/json",
            "Authorization": 'Bearer ' + bearerToken
        });
        log.debug(FUNC_NAME, 'The Headers are: ' + JSON.stringify(headers));
        var resultSet = searchObj.run().getRange({
            start: 0,
            end: 1000
        });
        log.debug(FUNC_NAME, 'The URL before adding quote currency: ' + ' ' + apiUrl);
        log.debug(FUNC_NAME, 'The Search Results Length is: ' + resultSet.length);
        for (var x = 0; x < resultSet.length; x++) {
            var url = apiUrl;
/*            var quoteCurrency = resultSet[x].getValue('name');
            var nsBaseCurrency = resultSet[x].getText('custrecord_base_currency');
            var foreignCurrency = resultSet[x].getText('custrecord_active_currency');
            url = url + 'quote=' + baseCurrency + '&base=' + quoteCurrency + '&date_time=' + yesterday*/
            var nsBaseCurrencyCode = resultSet[x].getValue('custrecord_base_currency_code');
            var foreignCurrencyCode = resultSet[x].getValue('custrecord_active_currency_code');
            var nsBaseCurrency = resultSet[x].getText('custrecord_base_currency');
            var foreignCurrency = resultSet[x].getText('custrecord_active_currency');
          
            url = url + 'quote=' + nsBaseCurrencyCode + '&base=' + foreignCurrencyCode + '&date_time=' + yesterday

          	log.debug(FUNC_NAME, 'URL with quote Currency: ' + url);
            var objResponse = https.get({
                method: https.Method.POST,
                headers: headers,
                url: url
            });
            var responseBody = JSON.parse(objResponse.body);
            log.debug(FUNC_NAME, responseBody);
            csvFileDetails = csvFileDetails + nsBaseCurrency + ',' + yesterday + ',' + responseBody.quotes[0].average_bid + ',' + foreignCurrency + '\n';
        }
        log.debug(FUNC_NAME, 'The CSV file details are: ' + csvFileDetails);
        var contents = csvFileHeader + '\n' + csvFileDetails;
        log.debug(FUNC_NAME, 'The File Contents are: ' + contents);



        var myDate = new Date();
        log.debug(FUNC_NAME, 'myDate: ' + myDate);

        var myfilename = 'Oanda' + myDate;
        log.debug(FUNC_NAME, 'myfilename: ' + myfilename);

        var fileObj = file.create({
            name: myfilename,
            fileType: file.Type.CSV,
            contents: contents,
            folder: 1079
        });
        var fileId = fileObj.save();
        log.debug(FUNC_NAME, 'CSV File Id: ' + fileId);


        var csvTaskName = 'CURRENCYRATE - from script NS | ACS | SS - Get Currency Rates - ' + myfilename;
        log.debug(FUNC_NAME, 'csvTaskName: ' + csvTaskName);

        var csvImportTask = task.create({
            taskType: task.TaskType.CSV_IMPORT,
            name: csvTaskName
        });
        csvImportTask.mappingId = 98;


        csvImportTask.importFile = file.load(fileId);
        var submittedTaskId = csvImportTask.submit();


        var csvTaskStatus = checkMyCSVTaskStatus(submittedTaskId);
        log.debug(FUNC_NAME, 'The Submitted CSV Import Task Id is; ' + submittedTaskId +' and status is: ' + csvTaskStatus);


        while (csvTaskStatus !== task.TaskStatus.COMPLETE && csvTaskStatus !== task.TaskStatus.FAILED){

            var delayDate = new Date();
            delayDate.setMilliseconds(delayDate.getMilliseconds() + 3000); //delay for 3 seconds
            while(new Date() < delayDate){
            }

            csvTaskStatus = checkMyCSVTaskStatus(submittedTaskId);
            log.debug(FUNC_NAME, 'csvTaskStatus - in while loop: ' + csvTaskStatus);

        }


        var emailSubject = 'CSV Import Status';
        var emailBody = 'The CSV Import is ' + csvTaskStatus + '.';

        var scriptObj = runtime.getCurrentScript();
        var emailAuthor = scriptObj.getParameter('custscript_email_author');
        log.debug(FUNC_NAME, 'emailAuthor: ' + emailAuthor);
        var emailRecipient = scriptObj.getParameter('custscript_email_recipient');
        log.debug(FUNC_NAME, 'emailRecipient: ' + emailRecipient);


        if (csvTaskStatus === task.TaskStatus.COMPLETE){
            log.audit(FUNC_NAME, csvTaskStatus + ' - CSV Import Task has completed successfully');

            var myEmailBody = searchSentEmailList(myfilename, myDate);
            log.debug(FUNC_NAME, 'myEmailBody: ' + myEmailBody);

            if (myEmailBody != '' && myEmailBody != null){
                emailBody = myEmailBody;
            }else{
                log.debug(FUNC_NAME, 'No email found in Sent Email List.');
            }

        } else if (csvTaskStatus === task.TaskStatus.FAILED){
            log.audit(FUNC_NAME, csvTaskStatus + ' - CSV Import Task has failed');
        }


        email.send({
            author: emailAuthor,
            recipients: emailRecipient,
            subject: emailSubject,
            body: emailBody
        });


    }

    function executeDateRange()
    {
        var FUNC_NAME = 'ExecuteDateRange';
        var scriptObj = runtime.getCurrentScript();
        var deploymentId = scriptObj.deploymentId;
        var startDate = new Date(scriptObj.getParameter('custscript_start_date'));
        var endDate = new Date(scriptObj.getParameter('custscript_end_date'));
        var myfilename = 'Oanda Bulk Update-' + dateFormat(startDate) + '-' + dateFormat(endDate);
        log.debug(FUNC_NAME, 'myfilename: ' + myfilename);
        
        var searchId = scriptObj.getParameter('custscript_currency_search');
        var apiUrl = scriptObj.getParameter('custscript_api_url');
        var bearerToken = '';

        var csvFileHeader = "Base Currency,Effective Date,Exchange Rate,Foreign Currency";
        var csvFileDetails = '';

        var searchObj = search.load({
            id: searchId
        });
        var resultSet = searchObj.run().getRange({
            start: 0,
            end: 1000
        });

        for (var dd = startDate; dd <= endDate; dd.setDate(dd.getDate() + 1))
        {
	        var yesterday = dateFormat(dd);
	        log.debug(FUNC_NAME,'The Yesterday date is: '+ yesterday);
	
	        if (runtime.envType == 'PRODUCTION') {
	            bearerToken = scriptObj.getParameter('custscript_bearer_token_prod');
	        } else {
	            bearerToken = scriptObj.getParameter('custscript_bearer_token');
	        }
	        var headers = ({
	            "Content-Type": "application/json",
	            "Authorization": 'Bearer ' + bearerToken
	        });
	        
	        log.debug(FUNC_NAME, 'The Headers are: ' + JSON.stringify(headers));
	        log.debug(FUNC_NAME, 'The URL before adding quote currency: ' + ' ' + apiUrl);
	        log.debug(FUNC_NAME, 'The Search Results Length is: ' + resultSet.length);
	        
	        for (var x = 0; x < resultSet.length; x++) {
	            var url = apiUrl;
	            var nsBaseCurrencyCode = resultSet[x].getValue('custrecord_base_currency_code');
	            var foreignCurrencyCode = resultSet[x].getValue('custrecord_active_currency_code');
	            var nsBaseCurrency = resultSet[x].getText('custrecord_base_currency');
	            var foreignCurrency = resultSet[x].getText('custrecord_active_currency');
	          
	            url = url + 'quote=' + nsBaseCurrencyCode + '&base=' + foreignCurrencyCode + '&date_time=' + yesterday
	
	          	log.debug(FUNC_NAME, 'URL with quote Currency: ' + url);
	            var objResponse = https.get({
	                method: https.Method.POST,
	                headers: headers,
	                url: url
	            });
	            var responseBody = JSON.parse(objResponse.body);
	            log.debug(FUNC_NAME, responseBody);
	            csvFileDetails = csvFileDetails + nsBaseCurrency + ',' + yesterday + ',' + responseBody.quotes[0].average_bid + ',' + foreignCurrency + '\n';
	        }
	        log.debug(FUNC_NAME, 'The CSV file details are: ' + csvFileDetails);
	        var contents = csvFileHeader + '\n' + csvFileDetails;
	        log.debug(FUNC_NAME, 'The File Contents are: ' + contents);
        }
        
        var myDate = new Date();
        log.debug(FUNC_NAME, 'myDate: ' + myDate);

        

        var fileObj = file.create({
            name: myfilename,
            fileType: file.Type.CSV,
            contents: contents,
            folder: 1079
        });
        var fileId = fileObj.save();
        log.debug(FUNC_NAME, 'CSV File Id: ' + fileId);
        
        var csvTaskName = 'CURRENCYRATE - from script NS | ACS | SS - Get Currency Rates - ' + myfilename;
        log.debug(FUNC_NAME, 'csvTaskName: ' + csvTaskName);

        var csvImportTask = task.create({
            taskType: task.TaskType.CSV_IMPORT,
            name: csvTaskName
        });
        csvImportTask.mappingId = 98;


        csvImportTask.importFile = file.load(fileId);
        var submittedTaskId = csvImportTask.submit();


        var csvTaskStatus = checkMyCSVTaskStatus(submittedTaskId);
        log.debug(FUNC_NAME, 'The Submitted CSV Import Task Id is; ' + submittedTaskId +' and status is: ' + csvTaskStatus);
        

    }

    function checkMyCSVTaskStatus(myTaskId){
        FUNC_NAME = 'checkMyCSVTaskStatus';
        var csvTaskStatusObj = task.checkStatus({
            taskId: myTaskId
        });
        log.debug(FUNC_NAME, 'csvTaskStatusObj: ' + csvTaskStatusObj);

        var csvTaskStatus = csvTaskStatusObj.status;

        return csvTaskStatus;

    }



    function searchSentEmailList(myfilename, myDate){
        FUNC_NAME = 'searchSentEmailList';
        var mySearch = search.load({
            id: 'customsearch_ns_acs_scrptuse_sentemlcsv'
        });
        var myFilters = mySearch.filters;
        log.debug(FUNC_NAME, 'myFilters original: ' + myFilters);

        log.debug(FUNC_NAME, 'Search Results: ' + JSON.stringify(mySearch));

        var searchFilter_emailBody = search.createFilter({
            name: 'body',
            operator: search.Operator.CONTAINS,
            values: myfilename
        });


        var myDate_formatted_date = format.format({
            value: myDate,
            type: format.Type.DATE
        });
        log.debug(FUNC_NAME, 'myDate_formatted_date: ' + myDate_formatted_date);


        var searchFilter_emailLogDate = search.createFilter({
            name: 'logdate',
            operator: search.Operator.ON,
            values: myDate_formatted_date
        });

        myFilters.push(searchFilter_emailBody);
        myFilters.push(searchFilter_emailLogDate);

        log.debug(FUNC_NAME, 'myFilters added: ' + myFilters);


        var firstSearchResult_array = mySearch.run().getRange({
            start: 0,
            end: 1
        });

        var emailBody = '';
        if (firstSearchResult_array.length != 0) {

            var firstSearchResult = firstSearchResult_array[0];
            log.debug(FUNC_NAME, 'firstSearchResult: ' + firstSearchResult);

            if (firstSearchResult != null) {
                var emailBody = firstSearchResult.getValue({
                    name: 'body'
                });
                log.debug(FUNC_NAME, 'emailBody: ' + emailBody);

                if (emailBody.indexOf('Number of records not imported: 0') == -1) {
                    log.audit(FUNC_NAME, 'Some records were not imported.');
                }

            }
        }

        return emailBody;

    }


    function dateFormat(date) {
        FUNC_NAME = 'dateFormat';
        var formattedDateString = format.format({
            value: date,
            type: format.Type.DATE
        });
        var parsedDate = format.parse({
            value : formattedDateString,
            type : format.Type.DATE
        });
        log.debug(FUNC_NAME,'Date Data type is: '+ typeof parsedDate);
        return formattedDateString;
    }
    return {
        execute: execute
    };
});