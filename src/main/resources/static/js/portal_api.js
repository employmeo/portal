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
		url: servicePath + "respondantsearch",
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

function getGrades(thePortal) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "grader/"+thePortal.grader.id+"/grade",
		success: function(data) {
			thePortal.grader.grades = data;
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

function getCriteria(thePortal) {
	return $.ajax({
		type: "GET",
		async: true,
		url: servicePath + "grader/"+thePortal.grader.questionId+"/criteria",
		success: function(data) {
			thePortal.grader.criteria = data;
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
		url: servicePath + "signup",
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