// API Constants
var servicePath = '/portal/1/';

//basic user / account functions (login/logout/etc)
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
			thePortal.logoutComplete(data);
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
function forgotPass() {
	$.ajax({
		type: "POST",
		async: true,
		data : $('#forgotpassform').serialize(),
		url: servicePath + "/forgotpassword",
		success: function(data) {
			// disable forms
			$('#forgotpassform :submit').text('Request Sent');
			$('#forgotpassform :input').prop('disabled', true);
			$('#emailtoyou').text('An password reset request has been submitted. Please check your email for instructions to reset your password.');	
		},
		error: function(data) {
			console.log(data);			
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


//Section for inviting new applicants
function inviteApplicant() {
	$.ajax({
		type: "POST",
		async: true,
		url: servicePath + "inviteapplicant",
		data: $('#inviteapplicant').serialize(),
		beforeSend: function(data) {
			$("#inviteapplicant :input").prop('readonly', true);
			$("#spinner").removeClass('hidden');
		},
		success: function(data)
		{
			$('#inviteapplicant').trigger('reset');
			$('#invitationform').addClass('hidden');
			$('#invitationsent').removeClass('hidden');
		},
		complete: function(data) {
			$("#inviteapplicant :input").prop('readonly', false);
			$("#spinner").addClass('hidden');
		}
	});
	return false; // so as not to trigger actual action.
}

function updateRespondantsTable() {

	$.ajax({
		type: "POST",
		async: true,
		url: "/portal/getrespondants",
		data: $('#refinequery').serialize(),
		beforeSend: function() {
			$("#waitingmodal").removeClass("hidden");
			rTable = $('#respondants').DataTable();
			rTable.clear();
		},
		success: function(data)
		{
			rTable = $('#respondants').DataTable();
			if (data.length > 0) {
				$('#respondants').dataTable().fnAddData(data);
				rTable.$('tr').click(function (){
					rTable.$('tr.selected').removeClass('selected');
					$(this).addClass('selected');
					var respondant = $('#respondants').dataTable().fnGetData(this);
					showApplicantScoring(respondant);
				});
				rTable.on('click', 'i', function (){
					var respondant = rTable.row($(this).parents('tr')).data();
					window.location.assign('/respondant_score.jsp?&respondant_id='+respondant.respondant_id);
				});
			}
		},
		complete: function() {
			$("#waitingmodal").addClass("hidden");
		}
	});
}


//Respondant scoring section
function getScore(respondantId) {
	$.ajax({
		type: "POST",
		async: true,
		url: "/admin/getscore",
		data: {
			"respondant_id" : respondantId   	
		},
		success: function(data)
		{
			respondant = data.respondant;
			presentRespondantScores(data);
		}
	});    
}

//Respondant scoring section
function getScoreUuid(respondantUuid) {
	$.ajax({
		type: "POST",
		async: true,
		url: "/admin/getscore",
		data: {
			"respondant_uuid" : respondantUuid   	
		},
		success: function(data)
		{
			respondant = data.respondant;
			presentRespondantScores(data);
		}
	});    
}

//Respondant scoring section
function getPredictions(respondantId) {
	$.ajax({
		type: "POST",
		async: true,
		url: "/admin/getscore",
		data: {
			"respondant_id" : respondantId   	
		},
		success: function(data)
		{
			respondant = data.respondant;
			presentPredictions(data);
		}
	});    
}

//Respondant scoring section
function getPredictionsUuid(respondantUuid) {
	$.ajax({
		type: "POST",
		async: true,
		url: "/admin/getscore",
		data: {
			"respondant_uuid" : respondantUuid   	
		},
		success: function(data)
		{
			respondant = data.respondant;
			presentPredictions(data);
		}
	});    
}


function lookupLastTenCandidates() {
	$.ajax({
		type: "POST",
		async: true,
		url: "/admin/getlastten",
		data: $('#refinequery').serialize(),
		success: function(respondants)
		{
			$('#recentcandidates').empty();
			for (var i = 0; i < respondants.length; i++ ) {
				var li = $('<li />', { 'class' : 'media event' });

				var div = $('<div />', {
					'class' : respondants[i].respondant_profile_class + ' profilebadge' 
				}).append($('<i />', {'class' : "fa " + respondants[i].respondant_profile_icon }));

				var ico = $('<a />', {
					'class' : "pull-left",
					'href' : '/respondant_score.jsp?&respondant_id=' + respondants[i].respondant_id
				}).append(div);

				var badge = $('<div />', { 'class' : 'media-body' });
				$('<a />', {
					'class' : 'title',
					'href' : '/respondant_score.jsp?&respondant_id=' + respondants[i].respondant_id,
					'text' : respondants[i].respondant_person_fname + ' ' + respondants[i].respondant_person_lname
				}).appendTo(badge);
				$('<p />', {
					'text' : respondants[i].respondant_position_name
				}).appendTo(badge);
				$('<p />', {
					'html' : '\<small\>' + respondants[i].respondant_location_name + '\<\/small\>'
				}).appendTo(badge);

				li.append(ico);
				li.append(badge);
				$('#recentcandidates').append(li);
			}}});
}