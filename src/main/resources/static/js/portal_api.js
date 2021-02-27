// API Constants
var servicePath = '/portal/1/';

//basic user / account functions (login/logout/etc)
function getUser(thePortal) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "user",
		success: function(data, textStatus, jqXHR)
		{
			if (jqXHR.status != 202) {
				thePortal.showLoginForm();
			} else {
				thePortal.loginSuccess(data);				
			}
		},
		error : function(data, textStatus, jqXHR)
		{
				thePortal.showLoginForm();
		}
	});
}

function postLogin(postdata, thePortal) {
	return $.ajax({
		type: "POST",
		async: true,
		data : postdata,
		url: "/login",
		xhrFields: {
			withCredentials: true
		},
		success: function(data) {
			thePortal.loginSuccess(JSON.parse(data));
		},
		error: function(data) {
			thePortal.loginFail(data);
		}	
	});	
}

function postLogout() {
	return $.ajax({
		type: "POST",
		async: true,
		url: "/logout",
		xhrFields: {
			withCredentials: true
		},
		success: function(data) {
			window.location.reload();
		}
	});	
}


//section for updating selectors
function getPositions(thePortal) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "account/"+thePortal.user.userAccountId+"/positions",
		success: function(data)
		{
			thePortal.positionList = data;
		}
	});
}

function savePosition(position) {
	return $.ajax({
		type: "POST",
		async: true,
		url: servicePath + "account/"+position.accountId+"/position",
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
		data: JSON.stringify(position),
		success: function(data)	{ position.id = data.id; }
	});
}

function getLocations(thePortal) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "account/"+thePortal.user.userAccountId+"/locations",
		success: function(data)
		{
  			thePortal.locationList = data;
		}
	});
}

function saveLocation(location) {
	return $.ajax({
		type: "POST",
		async: true,
		url: servicePath + "account/"+location.accountId+"/location",
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
		data: JSON.stringify(location),
		success: function(data)	{ location.id = data.id; }
	});
}

function getAssessments(thePortal) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "account/"+thePortal.user.userAccountId+"/assessments",
		success: function(data)
		{
  			thePortal.assessmentList = data;
		}
	});
}

function getAssessmentOptions(thePortal) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "benchmarkwizard/"+thePortal.user.userAccountId+"/options",
		success: function(data)
		{
  			thePortal.assessmentOptions = data;
		}
	});
}

function getBenchmarks(thePortal) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "account/"+thePortal.user.userAccountId+"/benchmarks",
		success: function(data)
		{
  			thePortal.benchmarkList = data;
		}
	});
}

function getBenchmarkRespondants(thePortal) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "respondant/bybenchmark/"+thePortal.benchmark.id,
		success: function(data)
		{
  			thePortal.benchmark.respondants = data;
		}
	});
}

function newBenchmark(thePortal) {
	return $.ajax({
		type: "POST",
		async: true,
		url: servicePath + "benchmarkwizard/start",
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
		data: JSON.stringify(thePortal.benchmarkRequest),
		success: function(data)
		{
  			thePortal.benchmark = data;
  			thePortal.benchmarkList.push(thePortal.benchmark);
  			Array.prototype.push.apply(thePortal.assessmentList, data.accountSurveys);
  			thePortal.positionList.push(data.position);
		}
	});
}

function configureSMBAssessment(thePortal) {
	return $.ajax({
		type: "POST",
		async: true,
		url: "/portal/signup/"+thePortal.user.userAccountId+"/configure",
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
		data: JSON.stringify(thePortal.signupRequest),
		success: function(data)
		{
			thePortal.user.account.defaultAsId = data.id;
  			thePortal.assessmentList.push(data);
		}
	});
}

function configureBenchmark(thePortal) {
	return $.ajax({
		type: "POST",
		async: true,
		url: servicePath + "benchmarkwizard/"+thePortal.benchmark.id+"/setup",
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
		data: JSON.stringify(thePortal.benchmarkConfig),
		success: function(data)
		{
  			for (var key in data) thePortal.benchmark[key] = data[key];
		}
	});
}

function sendBenchmark(thePortal) {
	return $.ajax({
		type: "POST",
		async: true,
		url: servicePath + "benchmarkwizard/"+thePortal.benchmark.id+"/send",
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
		data: JSON.stringify(thePortal.benchmarkConfig),
		success: function(data)
		{
  			for (var key in data) thePortal.benchmark[key] = data[key];
  			thePortal.showComponent('benchmarks');
		},
		complete: function() {$('#wait').addClass('hidden');}
	});
}

function calcBenchmark(thePortal) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "benchmarkwizard/"+thePortal.benchmark.id+"/complete",
		success: function(data)
		{
  			for (var key in data) thePortal.benchmark[key] = data[key];
  			thePortal.showComponent('benchmarks');
  			
		},
		complete: function() {$('#wait').addClass('hidden');}
	});
}

function saveAssessment(assessment) {
	return $.ajax({
		type: "PUT",
		async: true,
		url: servicePath + "account/"+assessment.accountId+"/assessment",
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
		data: JSON.stringify(assessment)
	});
}

function getCorefactors(thePortal) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "corefactor",
		success: function(data)
		{
			thePortal.corefactors = data;
		}
	});
}

function getKeys(thePortal) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "account/keys",
		success: function(data)
		{
			thePortal.keys = data;
		}
	});
}

function getBillingSettings(thePortal) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "billing/stripe",
		success: function(data)
		{
			thePortal.stripeCustomer = data;
		}
	});
}

function getInvoiceHistory(thePortal) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "billing/invoicehistory",
		success: function(data)
		{
			thePortal.invoiceHistory = data;
		}
	});
}

function getNextInvoice(thePortal) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "billing/nextinvoice",
		success: function(data)
		{
			thePortal.nextInvoice = data;
		}
	});
}

function addStripeCreditCard(thePortal, token) {
	return $.ajax({
		type: "POST",
		async: true,
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
		url: servicePath + "billing/addpayment/"+token,
		success: function(data)
		{
			thePortal.stripeCustomer = data;
			thePortal.renderStripeDetails();
		}
	});
}

function getProfiles(thePortal) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "account/"+thePortal.user.userAccountId+"/profiles",
		success: function(data)
		{
			thePortal.profiles = data;
		}
	});
}

function getRespondantByUuid(thePortal, uuid) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "respondant/"+uuid,
		success: function(data)
		{
			thePortal.respondant = data;
		}
	});
}

function submitDashUpdateRequest(thePortal) {
	return $.ajax({
		type: "POST",
		async: true,
		url: servicePath + "dashboard",
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
		data: JSON.stringify(thePortal.dashParams),
		success: function(data)
		{
			thePortal.updateDash(data);
		}
	});
}

function submitRespondantSearchRequest(params, callback) {	
	return $.ajax({
		type: "POST",
		async: true,
		url: servicePath + "respondant/search",
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
		data: JSON.stringify(params),
		success: function(data) {callback(data);}
	});
}

function getAllMyGraders(thePortal) {	
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "grader/user/" + thePortal.user.id,
		success: function(data) {
			thePortal.updateGradersTable(data);
		}
	});
}

function getGraders(thePortal) {	
	return $.ajax({
		type: "POST",
		async: true,
		url: servicePath + "grader/search",
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
		data: JSON.stringify(thePortal.graderParams),
		success: function(data) {
			thePortal.updateGradersTable(data);
		}
	});
}

function getGrades(grader) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "grader/"+grader.id+"/grade",
		success: function(data) {
			grader.grades = data;
		}
	});	
}

function getCriteria(grader) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "grader/"+grader.id+"/allcriteria",
		success: function(data) {
			grader.criteria = data;
		}
	});
}

function getAllResponses(grader) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "grader/"+grader.respondantId+"/allresponses",
		success: function(data) {
			grader.responses = data;
		}
	});
}

function getGradeableResponses(respondant) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "grader/"+respondant.id+"/allresponses",
		success: function(data) {
			respondant.gradeableresponses = data;
		}
	});
}

function getDisplayResponses(respondant) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "respondant/"+respondant.id+"/displaynvps",
		success: function(data) {
			respondant.displayresponses = data;
		}
	});
}

function getRespondantGraders(thePortal) {	
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "grader/respondant/" + thePortal.respondant.id,
		success: function(data) {
			thePortal.respondant.graders = data;
		}
	});
}

function getRespondantGrades(thePortal) {	
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "grader/respondant/" + thePortal.respondant.id + "/grades",
		success: function(data) {
			thePortal.respondant.grades = data;
		}
	});
}

function saveGrade(thePortal, grade) {
	return $.ajax({
		type: "POST",
		async: true,
		url: servicePath + "grader/grade",
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
		data: JSON.stringify(grade),
		success: function(data) {
			thePortal.logSavedGrade(data);
		}
	});
}

function updateGraderStatus(grader) {
	return $.ajax({
		type: "POST",
		async: true,
		url: servicePath + "grader/"+grader.id+"/status",
		data: 'status=' + grader.status,
		processData: false,
		success: function() {
			// do nothing.
		}
	});
}

function submitIgnoreReference(graderId, thePortal) {
	return $.ajax({
		type: "POST",
		async: true,
		url: servicePath + "grader/"+graderId+"/ignore",
		processData: false,
		success: function(data) {
			thePortal.ignoreReferenceComplete(data);
		}
	});
}


function remindEmailGrader(graderId) {
	return $.ajax({
		type: "POST",
		async: true,
		url: servicePath + "grader/"+graderId+"/remind",
		processData: false,
		success: function() {
			// do nothing.
		}
	});
}

function sendReferenceReminders(respondantId) {
	return $.ajax({
		type: "POST",
		async: true,
		url: servicePath + "grader/respondant/"+respondantId+"/remind",
		processData: false,
		success: function(data) {
			// data is the graders that were reminded
		}
	});
}

function addNewRespondantReference(thePortal, newgrader) {
	return $.ajax({
		type: "POST",
		async: true,
		url: servicePath + "grader/newgrader",
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
		data: JSON.stringify(newgrader),
		success: function(data) {
			thePortal.respondant.graders.push(data);
		}
	});
}

function waveMinGraders(respondantId) {
	return $.ajax({
		type: "POST",
		async: true,
		url: servicePath + "grader/wavemin/"+respondantId,
		processData: false,
		success: function() {
			console.log('Waved');
		}
	});
}

function sendInviteReminder(id) {
	return $.ajax({
		type: "POST",
		async: true,
		url: servicePath + "inviteapplicant/"+id+"/reminder",
		success: function() {
			// do nothing.
		}
	});	
}

function sendInvitation(thePortal) {
	$.ajax({
		type: "POST",
		async: true,
		url: servicePath + "inviteapplicant",
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
		data : JSON.stringify(thePortal.invitation),		
		beforeSend: function(data) {
			$("#inviteapplicant :input").prop('readonly', true);
			$("#spinner").removeClass('hidden');
		},
		success: function(data)
		{
			$('#inviteapplicant').trigger('reset');
			$('#invitationform').addClass('hidden');
			$('#invitationsent').removeClass('hidden');
			thePortal.invitation = {};
		},
		complete: function(data) {
			$("#inviteapplicant :input").prop('readonly', false);
			$("#spinner").addClass('hidden');
		}
	});
}

function getEmailHistory(thePortal, email) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "respondant/emailhistory/"+email,
		dataType: 'json',
		success: function(data) {
			thePortal.emailHistories[email]=data;
		}
	});	
}

function getEmailHistory(thePortal, grader) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "respondant/personemailhistory/"+grader.personId,
		dataType: 'json',
		success: function(data) {
			thePortal.emailHistories[grader.person.email]=data;
		}
	});	
}

function forgotPass() {
	var fpr = {};
	var fields = $('#forgotpassform').serializeArray();
	for (var i=0;i<fields.length;i++) {
		fpr[fields[i].name] = fields[i].value;
	}
	$("#wait").removeClass('hidden');

	$.ajax({
		type: "POST",
		async: true,
		url: servicePath + "forgotpassword",
	    headers: { 
	        'Content-Type': 'application/json' 
	    },
		data : JSON.stringify(fpr),
		success: function() {
			// disable forms
			$('#forgotpassform :submit').text('Request Sent');
			$('#forgotpassform :input').prop('disabled', true);
			$("#wait").addClass('hidden');
			$('#results').removeClass('hidden');
			$('#results').text('A password reset request has been submitted. Please check your email for instructions to reset your password.');	
			$('#results').css('color','white');	
		},
		error: function(data, textStatus, jqXHR) {
			$('#results').removeClass('hidden');
			$('#results').text('The email you provided was not found.');	
			$('#results').css('color','red');	
			$("#wait").addClass('hidden');
		}	
	});	
}

function submitSignupRequest(thePortal){
	$.ajax({
		type: "POST",
		url: "/portal/signup/withbm",
		async: true,
	    headers: { 
	        'Content-Type': 'application/json' 
	    },
		data : JSON.stringify(thePortal.signuprequest),
		success: function(data) {
			$('#wait').addClass('hidden');
			$('#signupform :submit').text('Signed Up!');
			$('#signupform :input').prop('disabled', true);
			$('#signupresponse').css('color','white');
			$('#signupresponse').text('Thank You. We have sent you an email confirmation. Please check your email and follow the validation link.');
		},
		error: function(data, textStatus, jqXHR) {
			$('#wait').addClass('hidden');
			$('#signupresponse').text(data.responseText);		
		}
	});	
}

function submitSMBSignupRequest(thePortal){
	$.ajax({
		type: "POST",
		url: "/portal/signup/smb",
		async: true,
	    headers: { 
	        'Content-Type': 'application/json' 
	    },
		data : JSON.stringify(thePortal.signuprequest),
		success: function(data) {
			$('#wait').addClass('hidden');
			console.log(data);
			$('#signupsmbform :submit').text('Signed Up!');
			$('#signupsmbform :input').prop('disabled', true);
			$('#signupsmbresponse').css('color','white');
			$('#signupsmbresponse').text('Thank You. We have sent you an email confirmation. Please check your email and follow the validation link.');
		},
		error: function(data, textStatus, jqXHR) {
			$('#wait').addClass('hidden');
			$('#signupsmbresponse').text(data.responseText);		
		}
	});	
}
function submitPasswordChangeRequest(thePortal) {
	$.ajax({
		type: "POST",
		url: servicePath + "changepass",
		async: true,
	    headers: { 
	        'Content-Type': 'application/json' 
	    },
		data : JSON.stringify(thePortal.cprf),
		success: function(data) {
			var formdata = {};
			formdata.email = thePortal.cprf.email;
			formdata.password = thePortal.cprf.newpass;
			postLogin($.param(formdata),thePortal);
			$('#login').addClass('hidden');
		},
		error: function(data) {
			$('#wait').addClass('hidden');
			$('#newpasswordresponse').text('Unable to change your password. Please try again or request another password reset.');		
		}
	});	
}