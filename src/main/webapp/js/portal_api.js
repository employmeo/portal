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
	$.ajax({
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
	$.ajax({
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
	$.ajax({
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
	$.ajax({
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
	$.ajax({
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
	$.ajax({
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

function submitRespondantSearchRequest(thePortal, callback) {	
	$.ajax({
		type: "POST",
		async: true,
		url: servicePath + "respondantsearch",
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
		data: JSON.stringify(thePortal.respParams),
		success: function(data) {callback(data);}
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
	$.ajax({
		type: "POST",
		async: true,
		data : $('#forgotpassform').serialize(),
		url: servicePath + "/forgotpassword",
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
		data : JSON.stringify(fpr),
		success: function(data) {
			// disable forms
			$('#forgotpassform :submit').text('Request Sent');
			$('#forgotpassform :input').prop('disabled', true);
			$('#emailtoyou').text('An password reset request has been submitted. Please check your email for instructions to reset your password.');	
		},
		error: function(data, textStatus, jqXHR) {
			console.log(fpr, data, jqXHR);			
		}
	});	
}

function resetPassword() {
	$.ajax({
		type: "POST",
		url: servicePath + "/changepass",
		async: true,
	    headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
	    dataType: 'json',
		data : JSON.stringify({
			'email' : email,
			'hash' : hash,
			'newpass' : $('input[name=newpass]').val()
		}),
		success: function(data) {
			if (data.user_fname != null) {
				// drop a cookie
				document.cookie = "user_fname=" + data.user_fname;
				window.location.assign('/index.jsp');
			} else {
				$('#errormsg').text('Unable to change your password. Please request another password reset.');
			}
		},
		error: function(data) {
			console.log(data);			
		}
	});	
}