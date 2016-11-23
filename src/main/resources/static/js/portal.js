Chart.defaults.global.defaultFontColor = '#000';
Chart.defaults.global.defaultFontSize = 16;
Chart.defaults.global.defaultFontFamily = '"Helvetica Neue", Roboto, Arial, "Droid Sans", sans-serif';

/* start: create the app */
clientPortal = function() {
	this.urlParams = {};
	this.user = {};

	this.assessmentList = {};
	this.positionList = {};
	this.locationList = {};
	this.corefactors = {};
	this.profiles = {};

	this.respondant = {};
	this.position = {};
	this.location = {};
	this.respParams = {};
	this.dashParams = {};
	
	this.dashResults = null;
	this.searchResults = null;
	this.lastTenResults = null;
	this.historyChart = null;
	this.dashApplicants = null;
	this.dashHires = null;
	this.cfBarChart = null;
	this.qTable = null;
	this.init();
}

clientPortal.prototype.init = function() {
	// Load up URL Parameters

	var match, pl = /\+/g, // Regex for replacing addition symbol with a space
		search = /([^&=]+)=?([^&]*)/g, decode = function(s) {
			return decodeURIComponent(s.replace(pl, " "));
		}, query = window.location.search.substring(1);
	while (match = search.exec(query)) this.urlParams[decode(match[1])] = decode(match[2]);

	// Check for autologin, and trigger remaining pieces
	getUser(this);
}

clientPortal.prototype.showLoginForm = function () {
	$('#wait').toggleClass('hidden');			
	$('#login').load('/components/login.htm');
  	var imagenum = Math.floor(Math.random()*12+1);
  	$('#mainbody').addClass('coverpage');
	$('#mainbody').css('background-image',"url('/images/background-" + imagenum + ".jpg')");
}

clientPortal.prototype.login = function () {
	$("#wait").removeClass('hidden');			
	$('#loginresponse').text('');
	$('#login').toggleClass('hidden');
	postLogin($('#loginform').serialize(), this);
}

clientPortal.prototype.loginSuccess = function(data) {
	this.user = data;
	var thePortal = this;
	
	$('#portal').toggleClass('hidden');
  	$('#mainbody').removeClass('coverpage');
	$('#mainbody').css('background-image','');
	$('#leftnav').load('/components/left.htm');
	$('#topnav').load('/components/top.htm', function() {$('#user_fname').text(data.firstName);});
	if (!this.urlParams.component) this.urlParams.component = 'dash';

	if (this.urlParams.respondantUuid != null) {
		$.when (getRespondantByUuid(thePortal, this.urlParams.respondantUuid),
				getLocations(thePortal),
				getPositions(thePortal),
				getAssessments(thePortal),
				getCorefactors(thePortal),
				getProfiles(thePortal)).done(
				function () {
					thePortal.showComponent(thePortal.urlParams.component);
					$('#wait').toggleClass('hidden');
				}
		);
	} else {
		$.when (getLocations(thePortal),
				getPositions(thePortal),
				getAssessments(thePortal),
				getCorefactors(thePortal),
				getProfiles(thePortal)).done(
				function () {
					thePortal.showComponent(thePortal.urlParams.component);
					$('#wait').toggleClass('hidden');
				}
		);
	}
}

clientPortal.prototype.loginFail = function(data) {
	$("#wait").addClass('hidden');
	$('#loginresponse').text(data.responseText);
	$('#login').removeClass('hidden');
}

clientPortal.prototype.logout = function () {
	$("#wait").removeClass('hidden');			
	postLogout();
}

clientPortal.prototype.showComponent = function(component) {
	$('#mainpanel').load('/components/'+component+'.htm');
}

clientPortal.prototype.updateLocationSelect = function (detail) {
	$.each(this.locationList, function (index, value) {
		$('#locationId').append($('<option/>', { 
			value: this.id,
			text : this.locationName 
		}));
	});
	if (detail) this.changeLocationTo($('#locationId').val());
}

clientPortal.prototype.updateAssessmentSelect = function (detail) {
	$.each(this.assessmentList, function (index, value) {
		$('#asid').append($('<option />', { 
			value: this.id,
			text : this.displayName 
		}));
	});
	if (detail) this.changeAssessmentTo($('#asid').val());
}

clientPortal.prototype.updatePositionSelect = function (detail) {
	$.each(	this.positionList, function (index, value) {
		$('#positionId').append($('<option/>', { 
			value: this.id,
			text : this.positionName
		}));
	});
	if (detail) this.changePositionTo($('#positionId').val());
}

clientPortal.prototype.initializeDatePicker = function (callback) {
	var cb = function(start, end, label) {
		$('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
		$('#fromdate').val(start.format('YYYY-MM-DD'));
		$('#todate').val(end.format('YYYY-MM-DD'));
		callback();
	}

	var optionSet1 = {
			startDate: moment().subtract(29, 'days'),
			endDate: moment(),
			minDate: '01/01/2012',
			maxDate: moment().format('MM/DD/YYYY'),
			dateLimit: {
				days: 365
			},
			showDropdowns: true,
			showWeekNumbers: true,
			timePicker: false,
			timePickerIncrement: 1,
			timePicker12Hour: true,
			ranges: {
				'This Month': [moment().startOf('month'), moment().endOf('month')],
				'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
				'Last 30 Days': [moment().subtract(29, 'days'), moment()],
				'Last 90 Days': [moment().subtract(89, 'days'), moment()],
				'Last 180 Days': [moment().subtract(179, 'days'), moment()]
			},
			opens: 'left',
			buttonClasses: ['btn btn-default'],
			applyClass: 'btn-small btn-primary',
			cancelClass: 'btn-small',
			format: 'MM/DD/YYYY',
			separator: ' to ',
			locale: {
				applyLabel: 'Submit',
				cancelLabel: 'Clear',
				fromLabel: 'From',
				toLabel: 'To',
				customRangeLabel: 'Custom',
				daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
				monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
				firstDay: 1
			}
	};
	$('#reportrange span').html(moment().subtract(89, 'days').format('MMMM D, YYYY') + ' - ' + moment().format('MMMM D, YYYY'));
	$('#fromdate').val(moment().subtract(89, 'days').format('YYYY-MM-DD'));
	$('#todate').val(moment().format('YYYY-MM-DD'));

	$('#reportrange').daterangepicker(optionSet1, cb);

	return;
}

clientPortal.prototype.initDashBoard = function() {
	if (Object.keys(this.dashParams).length > 0) {
		// code to put the dashboard details in the right place.
		// set date range
		// set location
		// set position
		var dashData = this.dashResults;
		this.updateDash(dashData)
		var lastTenData = this.lastTenResults;
		this.updateLastTen(lastTenData);		
	} else {
		this.requestDashUpdate();
	}	
}

clientPortal.prototype.requestDashUpdate = function() {
	var fields = $('#refinequery').serializeArray();
	this.dashParams = {};
	this.dashParams.accountId = this.user.userAccountId;
	for (var i=0;i<fields.length;i++) {
		this.dashParams[fields[i].name] = fields[i].value;
	}
	
	var params = this.dashParams;
	params.pagesize = 10;
	params.pagenum = 1;
	params.statusLow = 10;
	params.statusHigh = 100;
	var thePortal = this;
	
	submitDashUpdateRequest(this);
	submitRespondantSearchRequest(params, function(data) {
		thePortal.updateLastTen(data);
	});

}

clientPortal.prototype.updateDash = function(data) {	
	this.dashResults = data;
	var invited = 0;
	var started = 0;
	var completed = 0;
	var scored = 0;
	var hired = 0;
	var appData = {
			labels : [],
			datasets : [{
				data : [],
				backgroundColor : [],
				hoverBackgroundColor : []
			}]};
	var hireData = {
			labels : [],
			datasets : [{
				data : [],
				backgroundColor : [],
				hoverBackgroundColor : []
			}]};
	
	// Clear Hire Rates Progress Bars
	$('#hirerates').empty();
	
	for (var i=0;i<data.length;i++) {
		var dataPoint = data[i];

		// Add to totals
		invited += dataPoint.data[0];
		started += dataPoint.data[1];
		completed += dataPoint.data[2];
		scored += dataPoint.data[3];
		hired += dataPoint.data[4];
				
		// Create AppData Doughnut set
		appData.labels[i] = dataPoint.series;
		appData.datasets[0].backgroundColor[i] = dataPoint.color;
		appData.datasets[0].hoverBackgroundColor[i] = dataPoint.highlight;
		appData.datasets[0].data[i] = dataPoint.data[3];

		// Create HireData Doughnut set
		hireData.labels[i] = dataPoint.series;
		hireData.datasets[0].backgroundColor[i] = dataPoint.color;
		hireData.datasets[0].hoverBackgroundColor[i] = dataPoint.highlight;
		hireData.datasets[0].data[i] = dataPoint.data[4];

		// If any scored candidates exist, add the HireRate Bar
		if (dataPoint.data[3] > 0) this.addHireRateBar(dataPoint);
	}
	
	$('#invitecount').html(invited);
	$('#completedcount').html(completed);
	$('#scoredcount').html(scored);	
	$('#hiredcount').html(hired);

	this.refreshDashApplicants(appData);
	this.refreshDashHires(hireData);
	this.updateHistory(getHistoryData());
	
}

clientPortal.prototype.refreshDashApplicants = function(data) {
	if (this.dashApplicants != null) this.dashApplicants.destroy();
	// Build Applicants Widget
	this.dashApplicants = new Chart($("#dashApplicants").get(0).getContext("2d"), {
		type: 'doughnut',
		data: data,
		options: {
			cutoutPercentage : 35,
			responsive : true,
			legend: { display: false }
		}});
}

clientPortal.prototype.refreshDashHires = function(data) {
	if (this.dashHires != null) this.dashHires.destroy();
	// Build Hires Widget
	this.dashHires = new Chart($("#dashHires").get(0).getContext("2d"), {
		type: 'doughnut', 
		data: data, 
		options: {
			cutoutPercentage : 35,
			responsive : true,
			legend: { display: false }
	}});
}

clientPortal.prototype.addHireRateBar = function(data) {

	var rate = Math.round(100*data.data[4] / data.data[3]);

	var profile = {
			profileClass : data.profileClass,
			profileIcon : data.profileIcon,
			labels : [data.series]	
	};
	var badge = this.getProfileBadge(profile);

	var progress =	$('<div />',{
				'class' : 'progress-bar',
				'role':'progress-bar',
				});
	$(progress).addClass(data.profileClass.replace('btn-','progress-bar-'));
	$(progress).attr('aria-valuenow',rate);
	$(progress).attr('style','width:'+rate+'%;');
	
	var row = $('<div />',{'style' : 'margin-top:10px;'});
	var leftcol = $('<div />',{'style' : 'float:left;width:40px'});
	var rightcol = $('<div />',{'style' : 'float:right;width:60px;text-align:right'}).html('<h4>'+rate + '%</h4>');
	var centercol = $('<div />',{'style' : 'float:none;height:30px'});	
	leftcol.append(badge);
	centercol.append(
			$('<div />',{'class' : 'progress','style' : 'height:30px;margin-top:0px;margin-bottom:0px'}).append(progress)
	);
	row.append(leftcol);
	row.append(rightcol);
	row.append(centercol);
	$('#hirerates').append(row);

}

clientPortal.prototype.updateLastTen = function(data) {
	this.lastTenResults = data;
	var thePortal = this;
	var respondants = this.lastTenResults.content;
	$('#recentcandidates').empty();
	for (var i = 0; i < respondants.length; i++ ) {
		var profile = this.getProfile(respondants[i].profileRecommendation);
		var theRespondant = respondants[i];

		var li = $('<li />', { 'class' : 'media event' }).data('respondant',respondants[i]);

		var div = $('<div />', {
			'class' : profile.profileClass + ' profilebadge' 
		}).append($('<i />', {'class' : "fa " + profile.profileIcon }));

		var ico = $('<a />', {
			'class' : "pull-left",
		}).append(div);

		var badge = $('<div />', { 'class' : 'media-body' });

		
		$('<a />', {
			'class' : 'title',
			'text' : respondants[i].person.firstName + ' ' + respondants[i].person.lastName
		}).appendTo(badge);
		$('<p />', {
			'text' : this.getPositionBy(respondants[i].positionId).positionName
		}).appendTo(badge);
		$('<p />', {
			'html' : '\<small\>' + this.getLocationBy(respondants[i].locationId).locationName + '\<\/small\>'
		}).appendTo(badge);

		li.append(ico);
		li.append(badge);
		
		li.bind('click', function() {
			thePortal.respondant = $(this).data('respondant');
			thePortal.showComponent('respondant_score');
		});
		
		$('#recentcandidates').append(li);
	}
}

clientPortal.prototype.initGradersTable = function(){
	var thePortal = this;
	this.gTable = $('#graders').DataTable( {
		responsive: true,
		order: [[ 0, 'desc' ]],
		rowId: 'id',
		columns: [
		          { responsivePriority: 1, className: 'text-left', title: 'Status', data: 'status', render : function ( data, type, row ) {
		        	  	if (data == 10) return 'Complete'; if (data == 1) return 'New'; return 'Incomplete';
		          }},
		          { responsivePriority: 2, className: 'text-left', title: 'First Name', data: 'respondant.person.firstName'},
		          { responsivePriority: 3, className: 'text-left', title: 'Last Name', data: 'respondant.person.lastName'},
		          { responsivePriority: 4, className: 'text-left', title: 'Question', data: 'question.questionText'},
		          { responsivePriority: 5, className: 'text-left', title: 'Response', data: 'response.responseMedia',
		        	  render : function ( data, type, row ) {return thePortal.renderAudioLink(row, data).wrap("<div />").parent().html()} }
		         ]
	});
	$.fn.dataTable.ext.errMode = 'none'; // suppress errors on null, etc.
	
	if (!this.myGraders) {
		getGraders(thePortal);
	} else {
		this.showGraders();
	}
}

clientPortal.prototype.renderAudioLink = function(row, link) {
	var audio = $('<audio />' , {
		'controls': '',
		'id': 'grader_media_' + row.id,
		'text':'Your Browser Does Not Support Audio Playback'
	});
	var source = $('<source />', {'src':link,'type':'audio/mpeg'});
	audio.append(source);
	return audio;
}

clientPortal.prototype.togglePlayMedia = function(id) {

	var player = document.getElementById('grader_media_' + id);
	if (player.paused || player.ended) {
		player.play();
	} else {
		player.pause();
	}
	
	player.onplay = function() {
	    $('#playbutton_'+id).removeClass('fa-play');
	    $('#playbutton_'+id).addClass('fa-pause');
	}
	player.onended = function() {
	    $('#playbutton_'+id).removeClass('fa-pause');
	    $('#playbutton_'+id).addClass('fa-play');
	};
	player.onpause = function() {
	    $('#playbutton_'+id).removeClass('fa-pause');
	    $('#playbutton_'+id).addClass('fa-play');
	};
}

clientPortal.prototype.saveGraders = function(data) {
	this.myGraders = data;
	this.showGraders();
}

clientPortal.prototype.showGraders = function() {
	var thePortal = this;	
	if (this.myGraders.content.length > 0) {
		$('#graders').dataTable().fnAddData(this.myGraders.content);
		this.gTable.$('tr').click(function (){
			thePortal.gTable.$('tr.selected').removeClass('selected');
			$(this).addClass('selected');
			thePortal.grader = $('#graders').dataTable().fnGetData(this);
			if (thePortal.grader.criteria == null) { 
			    $.when(getGrades(thePortal),getCriteria(thePortal)).done(function () {
				    thePortal.showGradesPanel();
			    });
		    } else {
		    	thePortal.showGradesPanel();
		    }
		});
	}
}

clientPortal.prototype.showGradesPanel = function() {

	var thePortal = this;
	var id = this.grader.id;
	$('#gradername').html(this.grader.respondant.person.firstName + ' ' +
			this.grader.respondant.person.lastName);
	$('#graderquestion').html(this.grader.question.questionText);
	$('#gradedate').text('Requested: ' + '11-16-2016');
	$('#gradecompletion').text(this.grader.grades.length + ' of ' + this.grader.criteria.length + ' Completed');
	$('#playmediadiv').empty();
	$('#playmediadiv').append($('<i />', {
		'id' : 'playbutton_' + id,
		'class' : 'fa fa-play',
		'onClick' : 'portal.togglePlayMedia('+id+')'
	}));
	
	$("#grades").removeClass('hidden'); 
	$('#gradeforms').empty();
	for (var key in this.grader.criteria) {
		if (key > 0) $('#gradeforms').append($('<hr />'));
		var form = this.createGradeForm(this.grader.criteria[key]);
		$('#gradeforms').append(form);
	}
}
	

clientPortal.prototype.createGradeForm = function (criterion) {
	var grade = {'id':'','gradeText':'','gradeValue':''};
	if (this.grader.grades.length > 0) {
		this.checkGraderStatus(this.grader);
	}
	for (var i=0;i<this.grader.grades.length;i++) {
		if (criterion.questionId == this.grader.grades[i].questionId) grade = this.grader.grades[i];
	}
	
	var form =  $('<form/>', {
		 'name' : 'grade_'+this.grader.id + '_cr_' +criterion.questionId,
		 'id' : 'grade_'+this.grader.id + '_cr_' +criterion.questionId
	});
	form.append($('<input/>', {
		name : 'id',
		type : 'hidden',
		id : 'gr_'+this.grader.id + '_cr_' +criterion.questionId,
		value : grade.id
	}));
	form.append($('<input/>', {
		name : 'graderId',
		type : 'hidden',
		value : this.grader.id
	}));
	form.append($('<input/>', {
		name : 'questionId',
		type : 'hidden',
		value : criterion.questionId
	}));
	
	var quesdiv =  $('<div />').html(criterion.questionText);
	form.append($('<h4 />').html(criterion.questionText));
	var ansdiv = $('<div />');
	switch(criterion.questionType) {
		case 2:
			var like = $('<div />', {'class' : 'col-xs-6 col-sm-6 col-md-6 text-center'});
			var radioLike =	$('<input />', {
				'id'   : 'radiobox-' + criterion.questionId +"-1",
				'type' : 'radio', 'class' : 'thumbs-up', 'name' : 'gradeValue',
				'onChange' : 'portal.submitGrade('+this.grader.id+','+criterion.questionId+');', 'value' :  '11'});
			if (11 == grade.gradeValue) radioLike.prop('checked', true);
			like.append(radioLike);
			like.append($('<label />', {
				'for'   : 'radiobox-' + criterion.questionId +"-1", 'class' : 'thumbs-up' }));
			var dislike = $('<div />', {'class' : 'col-xs-6 col-sm-6 col-md-6 text-center'});
			var radioDislike =$('<input />', {
				'id'   : 'radiobox-' + criterion.questionId +"-2",
				'type' : 'radio', 'class' : 'thumbs-down', 'name' : 'gradeValue',
				'onChange' : 'portal.submitGrade('+this.grader.id+','+criterion.questionId+');', 'value' :  '1'});
			if (1 == grade.gradeValue) radioDislike.prop('checked', true);
			dislike.append(radioDislike);
			dislike.append($('<label />', {
				'for'   : 'radiobox-' + criterion.questionId +"-2", 'class' : 'thumbs-down' }));
			ansdiv.append(like);
			ansdiv.append(dislike);
			break;
		case 5: // Likert
		default:
			ansdiv.addClass('stars');
			for (var i=5;i>0;i--) {
				var ans = 2 *i;
				var star =$('<input/>',{
					'class' : 'star star-' + i,
					'id' : 'star-' + i + '-' + criterion.questionId,
					'type': 'radio',
					'name': "gradeValue",
					'onChange' : 'portal.submitGrade('+this.grader.id+','+criterion.questionId+');',
					'value': ans
				});
				if (ans == grade.gradeValue) star.prop('checked', true);
				ansdiv.append(star);
				ansdiv.append($('<label />',{
					'class' : 'star star-' + i,
					'for' : 'star-' + i + '-' + criterion.questionId,
				}));
			}
			break;
		
	}
	form.append(ansdiv);
	
	return form;
}

clientPortal.prototype.submitGrade = function(graderId, questionId) {
	var thePortal = this;
	var formname = 'grade_' + graderId + '_cr_' + questionId;
	var fields = $('#'+formname).serializeArray();
	var grade = {};
	for (var i=0;i<fields.length;i++) {
		grade[fields[i].name] = fields[i].value;
	}
	$('#'+formname+ " :input").prop('disabled', true);
	saveGrade(thePortal, grade);
}

clientPortal.prototype.logSavedGrade = function(grade) {
	var fieldname = 'gr_' + grade.graderId + '_cr_' + grade.questionId;
	var formname = 'grade_' + grade.graderId + '_cr_' + grade.questionId;
	$('#'+fieldname).val(grade.id);
	$('#'+formname+ " :input").prop('disabled', false);

	var updatedGrader = this.gTable.row('#'+grade.graderId).data();
	if (grade.graderId == updatedGrader.id) {
		var newGrade = true;
		for (var i=0;i<updatedGrader.grades.length;i++) {
			if (grade.questionId == updatedGrader.grades[i].questionId) {
				updatedGrader.grades[i].gradeValue = grade.gradeValue;
				updatedGrader.grades[i].gradeText = grade.gradeText;
				newGrade = false;
				break;
			}
		}
		if (newGrade) {
			updatedGrader.grades.push(grade);
			this.checkGraderStatus(updatedGrader);
		}
	}
};

clientPortal.prototype.checkGraderStatus = function(updatedGrader) {
	if (updatedGrader.id == this.grader.id) {
		$('#gradecompletion').text(this.grader.grades.length + ' of ' + this.grader.criteria.length + ' Completed');		
	}
	
	var shouldBe = 1;
	if (updatedGrader.grades.length > 0) shouldBe = 5;
	if (updatedGrader.grades.length >= updatedGrader.criteria.length) shouldBe = 10;
	
	if (updatedGrader.status != shouldBe) {
		updatedGrader.status = shouldBe;
		updateGraderStatus(updatedGrader); // this is aynch
		this.gTable.row('#'+updatedGrader.id).data(updatedGrader).draw();
	}
}

clientPortal.prototype.getAssessmentBy = function(asid) {
	for (var key in this.assessmentList) {
		var assessment = this.assessmentList[key];
		if (asid == assessment.id) return assessment;
	}
	
	return null;
}

clientPortal.prototype.getPositionBy = function(id) {
	for (var key in this.positionList) {
		var position = this.positionList[key];
		if (id == position.id) return position;
	}
	return null;
}

clientPortal.prototype.getLocationBy = function(id) {
	for (var key in this.locationList) {
		var location = this.locationList[key];
		if (id == location.id) return location;
	}
	return null;
}

clientPortal.prototype.getCorefactorBy = function(id) {
	for (var key in this.corefactors) {
		var corefactor = this.corefactors[key];
		if (id == corefactor.id) return corefactor;
	}
	return null;
}

clientPortal.prototype.getProfile = function(series) {
	if (series == null) series = 'unscored';
	for (var key in this.profiles) {
		var profile = this.profiles[key];
		if (series == profile.series) return profile;
	}
	return null;
}

clientPortal.prototype.resetInvitation = function() {
	$('#invitationsent').addClass('hidden');
	$('#invitationform').removeClass('hidden');	
}

//Section for search respondants / build respondants table
clientPortal.prototype.initRespondantsTable = function() {
	var thePortal = this;
	this.rTable = $('#respondants').DataTable( {
		responsive: true,
		order: [[ 0, 'desc' ]],
		rowId: 'id',
		columns: [
		          { responsivePriority: 1, className: 'text-left', title: 'Score', data: 'profileRecommendation', 
		        	  render : function ( data, type, row ) {
		        		  return thePortal.getProfileBadge(thePortal.getProfile(data)).wrap("<div />").parent().html();
		        	  }
		          },
		          { responsivePriority: 2, className: 'text-left', title: 'First Name', data: 'person.firstName'},
		          { responsivePriority: 3, className: 'text-left', title: 'Last Name', data: 'person.lastName'},
		          { responsivePriority: 6, className: 'text-left', title: 'Email', data: 'person.email'},
		          { responsivePriority: 7, className: 'text-left', title: 'Position', data: 'positionId', 
		        	  render : function ( data, type, row ) {return thePortal.getPositionBy(data).positionName;}
		          },
		          { responsivePriority: 8, className: 'text-left', title: 'Location', data: 'locationId', 
		        	  render : function ( data, type, row ) {return thePortal.getLocationBy(data).locationName;}
		          },
		          { responsivePriority: 9, className: 'text-left', title: 'Actions', data: 'status', 
		        	  render : function ( data, type, row ) {
		        		  return thePortal.renderRespondantActions(row).html();
		        	  }
		          }
		         ]
	});
	$.fn.dataTable.ext.errMode = 'none';
	if (this.searchResults == null) {
		this.searchRespondants();
	} else {
		this.updateRespondantsTable();
	}
}

clientPortal.prototype.renderRespondantActions = function(respondant) {
	var cell = $('<td />');
	switch (respondant.respondantStatus) {
		case 1: // created or started
			cell.append($('<button />',{'class':'btn-primary btn-xs','text':'Send Reminder'}));
			break;
		case 6: // reminded already, but not finished
			cell.append($('<button />',{'class':'btn-primary btn-xs','text':'Remind Again'}));
			break;
		case 11: // ungraded
			cell.append($('<button />',{'class':'btn-primary btn-xs','text':'Edit Grades'}));
			break;
		case 13: // scored - not predicted
			cell.append($('<button />',{'class':'btn-primary btn-xs','text':'View Scores'}));
		case 15: // predicted
			cell.append($('<button />',{'class':'btn-primary btn-xs','text':'View Prediction'}));
			break;
		case 10: // completed
		case 12: // graded, but not scored
		default:
			break;
	}
	return cell;
}


clientPortal.prototype.searchRespondants = function() {
	var thePortal = this;
	var fields = $('#refinequery').serializeArray();
	this.respParams = {};
	this.respParams.accountId = this.user.userAccountId;
	this.respParams.pagesize = 500;
	this.respParams.pagenum = 1;
	for (var i=0;i<fields.length;i++) {
		this.respParams[fields[i].name] = fields[i].value;
	}
	
	submitRespondantSearchRequest(this.respParams, function(data) {
		thePortal.searchResults = data;
		thePortal.updateRespondantsTable();
	});
}

clientPortal.prototype.updateRespondantsTable = function() {	
	var thePortal = this;
	if (this.searchResults.content.length > 0) {
		$('#respondants').dataTable().fnAddData(this.searchResults.content);
		this.rTable.$('tr').click(function (){
			thePortal.rTable.$('tr.selected').removeClass('selected');
			$(this).addClass('selected');
			thePortal.respondant = $('#respondants').dataTable().fnGetData(this);
			thePortal.renderAssessmentScore(false);
		});
		this.rTable.on('click', 'i', function (){
			thePortal.respondant = thePortal.rTable.row($(this).parents('tr')).data();
			thePortal.showComponent('respondant_score');
		});
	}
}

//Section for looking at / manipulating assessments
clientPortal.prototype.changeAssessmentTo = function(asid) {
	this.assessment = this.getAssessmentBy(asid);
	this.updateSurveyFields();
	this.updateSurveyQuestions();		
}

clientPortal.prototype.updateSurveyFields = function() {
	$('#assessmentname').text(this.assessment.displayName);
	$('#assessmenttime').text(msToTime(this.assessment.survey.completionTime));
	$('#assessmentdesc').html(this.assessment.survey.description);
	$('#completionguage').data('easyPieChart').update(100*this.assessment.survey.completionPercent);  
	$('#questiontotal').text(this.assessment.survey.surveyQuestions.length);
	function msToTime(s) {
		  var ms = s % 1000;
		  s = (s - ms) / 1000;
		  var secs = s % 60;
		  s = (s - secs) / 60;
		  var mins = s % 60;
		  return + mins + ':' + (secs<10 ? '0':'') + secs;
	}
}

clientPortal.prototype.initSurveyQuestionsTable = function() {
	this.qTable = $('#questions').DataTable( {
		responsive: true,
		order: [[0, 'asc'],[ 1, 'asc' ]],
		columns: [{ title: 'Sec', data: 'page'},
		          { title: '#', data: 'sequence'},
		          { title: 'Question', data: 'question.questionText'}],
		          columnDefs: [{ responsivePriority: 2, targets: 2},
		                       { responsivePriority: 4, targets: 1},
		                       { responsivePriority: 6, targets: 0}]
	});
}	

clientPortal.prototype.updateSurveyQuestions = function() {
	if (this.qTable == null) this.initSurveyQuestionsTable();
	this.qTable.clear();
	$('#questions').dataTable().fnAddData(this.assessment.survey.surveyQuestions);
	var thePortal = this;
	this.qTable.$('tr').click(function (){
		thePortal.qTable.$('tr.selected').removeClass('selected');
		$(this).addClass('selected');
	});
	return
}

clientPortal.prototype.updateHistory = function(historyData) {
	if (this.historyChart != null) this.historyChart.destroy();
	var dashHistory = $("#dashHistory").get(0).getContext("2d");
	this.historyChart = new Chart(dashHistory, {
		type: 'bar', data: historyData,
		options: { 
			bar: {stacked: true},
			scales: { 
				xAxes: [{
					gridLines: {color : "rgba(0, 0, 0, 0)"},
					stacked: true,
					categoryPercentage: 0.5
				}],
				yAxes: [{gridLines: {display: true}, scaleLabel: {fontSize: '18px'}, stacked: true}]
			},
			responsive: true,
			legend: { display: false }
		}
	});
}

clientPortal.prototype.presentPredictions = function() {
	var profile = this.getProfile(this.respondant.profileRecommendation);
	$('#candidateicon').html('<i class="fa ' + profile.profileIcon +'"></i>');
	$('#candidateicon').addClass(profile.profileClass);
	$('#compositescore').text(Math.round(this.respondant.compositeScore));
	
	var fulltext = this.respondant.person.firstName +
	               "'s application is in the top " +
	               Math.round(this.respondant.compositeScore) +
	               " percentile of applicants to " + 
	               this.getLocationBy(this.respondant.locationId).locationName + ".";
	$('#fulltextdesc').text(fulltext);
	
	this.renderAssessmentScore(false);
	
	var header = $('<h4 />',{'text': 'Probability that ' + this.respondant.person.firstName + ' ...'});
	$('#predictions').empty();
	$('#predictions').append($('<div />',{'class':'row text-center'}).append(header));

	// now - lets assume 3 max.
	var counter = 0;
	for (var i in this.respondant.predictions) {
		if (i==3) break;
        counter++;
		this.addPrediction(this.respondant.predictions[i]);
		this.produceHistogram(this.respondant.predictions[i]);
	}

	for (var i=3; i>counter; i--) {
		var card = $('<div />', { 'class' : 'col-md-4 col-sm-4 col-xs-12 text-center'});
		var preddiv = $('<div />', { 'class' : 'card-dashed text-center'});
	    preddiv.append($('<canvas />', {
	    	'class' : 'chart',
	    	'style' : 'height:100px;width:100%;'
	    }));
		preddiv.append($('<hr />'));
	    preddiv.append($('<h5 />',{'text' : 'Configure an additional prediction'} ));
		preddiv.append($('<hr />'));
	    preddiv.append($('<canvas />', {
	    	'class' : 'chart',
	    	'style' : 'height:auto;width:100%;'
	    }));
        card.append(preddiv);
	    $('#predictions').append(card);
	}
	
}

clientPortal.prototype.addPrediction = function(prediction) {
	var card = $('<div />', { 'class' : 'col-md-4 col-sm-4 col-xs-12 text-center'});
	var preddiv = $('<div />', { 'class' : 'card-solid text-center'});
    preddiv.append($('<h5 />',{'text' : prediction.positionPredictionConfig.predictionTarget.label} ));
    
    var spanid = 'prediction_' + prediction.predictionId;
    var spanChart = $('<span />', {
    	'class' : 'chart',
    	'id' : spanid,
    	'data-percent' : 0
    }).append($('<span />', {
    	'class' : 'percent',
    	'style' : 'line-height:100px;font-size:30px;'
    }));

    var canvasid = 'histogram_' + prediction.predictionId;
    var histCanvas = $('<canvas />', {
    	'class' : 'chart',
    	'id' : canvasid,
    	'style' : 'height:auto;width:100%;'
    });
	preddiv.append(spanChart);
	preddiv.append($('<hr />'));
    preddiv.append($('<h5 />',{'text' : 'Compared to other applicants...'} ));
	preddiv.append(histCanvas);
	var comparison = this.respondant.person.firstName + "'s prediction is better than " +
    	(prediction.scorePercentile * 100).toFixed(0) +
	    "% of other applicants."
    preddiv.append($('<h5 />',{'text' : comparison} ));
    card.append(preddiv);
    $('#predictions').append(card);
	
	var color;
	switch (Math.floor(4*prediction.scorePercentile)) {
		case 0:
			color = '#d9534f';
			break;
		case 1:
			color = '#F39C12';
			break;
		case 2:
			color = '#3498DB';
			break;
		case 3:
			color = '#26B99A';
			break;
		default:
			color = 'gray';
			break;		
	}
	
	$('#'+spanid).easyPieChart({
    	easing: 'easeOutBounce',
    	lineWidth: '10',
    	barColor: color,
    	scaleColor: false,
    	size: $('#'+spanid).width(),
    	onStep: function(from, to, percent) { $(this.el).find('.percent').text(Math.round(percent));}
  	});
	$('#'+spanid).data('easyPieChart').update(100*prediction.predictionScore);	
}

clientPortal.prototype.produceHistogram = function(prediction) {
  
    var canvasid = 'histogram_' + prediction.predictionId;
	var ctx = document.getElementById(canvasid);
	var color;
	switch (Math.floor(4*prediction.prediction_percentile)) {
		case 0:
			color = '#d9534f';
			break;
		case 1:
			color = '#F39C12';
			break;
		case 2:
			color = '#3498DB';
			break;
		case 3:
			color = '#26B99A';
			break;
		default:
			color = 'gray';
			break;		
	}
	
	var mean= getPredictionMean(prediction);
	var stdev = getPredictionStDev(prediction);	
	var labels = new Array();
	var bgColors = new Array();
	var borderColors = new Array();
	var datapoints = new Array();
	
	// Generate labels and data, and highlight person
	for (var i = 0; i<10; i++) {
		var low = mean + ((i-5)*stdev)/2;
		var high = mean + ((i-4)*stdev)/2;
		var label = Math.round(100*low) + "-" + Math.round(100*high) + '%';
		if (i == 0) {
			label = "<" + Math.round(100*high) + '%';
			low = 0;
		}
		if (i == 9) {
			label = Math.round(100*low) + "%+";
			high = 1;		
		}
		labels[i] = label;
		var datapoint = cdf(high,mean,stdev) - cdf(low,mean,stdev);
		datapoints[i] = datapoint.toFixed(4);
		if ((prediction.predictionScore >= low) && (prediction.predictionScore < high)) {
			bgColors[i] = color;
		} else {
			bgColors[i] = '#ccc';
		}
	}
	
	var data = {
		    labels: labels,
		    datasets: [
		        {
		            label: "frequency",
		            borderWidth: 1,
		            backgroundColor: bgColors,
		            borderColor: borderColors,
		            data: datapoints
		        }
		    ]
		};
    var options = {
    		    legend: { display : false},
  	  	        scales: {
  	  	            xAxes: [{
  	  	                stacked: false,
  	  	                gridLines: {display:false},
  	  	            	display: true
  	  	            }],
  	  	            yAxes: [{
  	  	                stacked: false,
  	  	                gridLines: {display:false},
  	  	            	display: false
  	  	            }],
  	  	            showScale: false
  	  	        }
    		};
    
	var myBarChart = new Chart(ctx, {
	    type: 'bar',
	    data: data,
	    options: options
	});

}

clientPortal.prototype.changePositionTo = function(id) {	
	this.position = this.getPositionBy(id);
	this.position.data = getStubDataForRoleBenchmark(); /// replace with REST call or pull from other var

	$('#positionname').text(this.position.positionName);
	$('#positiondesc').text(this.position.description);
	$('#div_applicant_count').html(this.position.data.role_benchmark.applicant_count);
	$('#div_hire_count').html(this.position.data.role_benchmark.hire_count);
	$('#div_hire_rate').html(Math.round((
			this.position.data.role_benchmark.hire_count/
			this.position.data.role_benchmark.applicant_count)*100)+'%');		

	//this.updatePositionModelDetails(this.position.data.role_benchmark);
	this.updateGradesTable(this.position.data.role_benchmark.role_grade);
	this.updateCriticalFactorsChart();
}
clientPortal.prototype.showAllDetails = function() {
	for (i in detailedScores) {
		var score = detailedScores[i];
		showDetail(score.corefactor_id);
	}
	$('#hideall').removeClass('hidden');
	$('#showall').addClass('hidden');
}

clientPortal.prototype.hideAllDetails = function() {
	for (i in detailedScores) {
		var score = detailedScores[i];
		hideDetail(score.corefactor_id);
	}	
	$('#showall').removeClass('hidden');
	$('#hideall').addClass('hidden');
}

clientPortal.prototype.showDetail = function(cfid) {
	$('#cfmessage_' + cfid).removeClass('hidden');	
	$('#expander_' + cfid).attr('onclick', 'portal.hideDetail('+cfid+')');
	$('#expander_' + cfid).removeClass('fa-plus-square-o');
	$('#expander_' + cfid).addClass('fa-minus-square-o');
}


clientPortal.prototype.hideDetail = function(cfid) {
	$('#cfmessage_' + cfid).addClass('hidden');
	$('#expander_' + cfid).attr('onclick', 'portal.showDetail('+cfid+')');
	$('#expander_' + cfid).removeClass('fa-minus-square-o');
	$('#expander_' + cfid).addClass('fa-plus-square-o');
}

clientPortal.prototype.inviteApplicant = function () {	
	this.invitation = {};
	var fields = $('#inviteapplicant').serializeArray();
	this.invitation = {};
	this.invitation.accountId = this.user.userAccountId;
	for (var i=0;i<fields.length;i++) {
		this.invitation[fields[i].name] = fields[i].value;
	}
	sendInvitation(this);
}


clientPortal.prototype.prepPersonalMessage = function(message) {
	var pm = message;
	if (pm != null) {
		pm = pm.replace(new RegExp("\\[FNAME\\]","g"),this.respondant.person.firstName);
		pm = pm.replace(new RegExp("\\[LNAME\\]","g"),this.respondant.person.lastName);
	
		pm = pm.replace(new RegExp("\\[CHESHE\\]","g"),"This candidate");
		pm = pm.replace(new RegExp("\\[LHESHE\\]","g"),"this candidate");
		pm = pm.replace(new RegExp("\\[CHIMHER\\]","g"),"Him or her");
		pm = pm.replace(new RegExp("\\[LHIMHER\\]","g"),"him or her");
		pm = pm.replace(new RegExp("\\[HIMHER\\]","g"),"him or her");
		pm = pm.replace(new RegExp("\\[CHISHER\\]","g"),"His or her");
		pm = pm.replace(new RegExp("\\[LHISHER\\]","g"),"his or her");
		pm = pm.replace(new RegExp("\\[HIMSELFHERSELF\\]","g"),"him or herself");
	}
	return pm;
}

clientPortal.prototype.renderAssessmentScore = function(detail) {
	$('#applicantprofile').removeClass('hidden'); 
	var scores = this.respondant.respondantScores;
	$('#assessmentname').text(this.getAssessmentBy(this.respondant.accountSurveyId).displayName);
	$('#assessmentdate').text(new Date(this.respondant.createdDate).toDateString());
	$('#candidatename').text(this.respondant.person.firstName + ' ' + this.respondant.person.lastName);
	$('#candidateemail').text(this.respondant.person.email);
	$('#candidateaddress').text(this.respondant.person.address);
	$('#candidateposition').text(this.getPositionBy(this.respondant.positionId).positionName);
	$('#candidatelocation').text(this.getLocationBy(this.respondant.locationId).locationName);
	
	$('#assessmentresults').empty();
	
	var displaygroup = "";
	// sorting happens here?
	
	for (var key in scores) {
		var value = scores[key].value;
		var corefactor = this.getCorefactorBy(scores[key].corefactorId);
		var row = $('<tr />', {	'title' : corefactor.description});
		var cell = $('<td />');
		var quartile = Math.floor(4*value/11);
		
		var progress = $('<div />', {'class' : 'progress', 'style' : 'height:30px;margin-top:10px;margin-bottom:0px' }).append($('<div />', {
			'class': 'progress-bar '+this.getBarClass(quartile)+' progress-bar-striped',
			'role': 'progressbar',
			'aria-valuenow' : value,
			'aria-valuemin' : "1",
			'aria-valuemax' : "11",
			'style' : 'line-height: 30px;font-size: 16px;font-weight: 700;width: ' 
				+ (100*value/corefactor.highValue) + '%;',
			'text' : value }));

		if (detail) {
			if (displaygroup != corefactor.displayGroup) {
				displaygroup = corefactor.displayGroup;
				var grouprow = $('<tr />');
				grouprow.append($('<th />', {'style':'text-align:center;'}).append($('<h4 />',{text:displaygroup})));
				$('#assessmentresults').append(grouprow);
			}
			
			var namediv = $('<div />', {
				'class' : 'text-left',
				'style' : 'float:left;width:120px;margin-right:2px;',
				title: corefactor.description});
			var expander = $('<h5 />');
			expander.append($('<strong />', { text : corefactor.name + ' '}));
			expander.append($('<i />', {
				'onclick' : "portal.showDetail(" + corefactor.id + ")",
				'class' : 'fa fa-plus-square-o',
				'id' : 'expander_' + corefactor.id
			}));
			namediv.append(expander);
			namediv.append('<h6><em>' +corefactor.lowDescription + '</em></h6>');
			var scorediv = $('<div />', {
				'class' : 'text-right',
				'style' : 'float:right;width:120px;margin-left:2px',
				html : '<h5><strong>' + value.toFixed(1) + " of " + corefactor.highValue + '</strong></h5>'});
			scorediv.append('<h6><em>' +corefactor.highDescription + '</em></h6>');


			cell.append(namediv);
			cell.append(scorediv);	
			cell.append(progress);
		} else {
			cell.append($('<div />', {'text': corefactor.name }));
			cell.append(progress); 
		}
		row.append(cell);
		$('#assessmentresults').append(row);

		if (detail) {
			var messageRow = $('<tr />',{
				'id' : 'cfmessage_' + scores[key].corefactorId,
				'class' : 'hidden'
			}).append($('<td />',{
				'bgcolor' : '#F7F7F7',
				'border-top' : 'none',
				'text' : this.prepPersonalMessage(corefactor.description)
			}));
			$('#assessmentresults').append(messageRow);
		}
		
	}

	
	var legend = $('<div />',{
		'style' : 'max-width:480px;margin-left:auto;margin-right:auto;'
	});
	legend.append($('<div />', {'class':'text-center', 'text': 'Bar Color Indicates Quartile'}));

	for (var i = 0; i<4; i++) {
		var div  = $('<div />', {'class' : 'col-xs-3 col-sm-3 col-md-3 col-lg 3'});	
		div.append( $('<div />', {'class' : 'progress'}).append($('<div />', {
			'class': 'progress-bar '+this.getBarClass(i)+' progress-bar-striped',
			'role': 'progressbar',
			'aria-valuenow' : 1,
			'aria-valuemin' : "0",
			'aria-valuemax' : "1",
			'style' : 'width: 100%;',
			'text' : i
		})));
		legend.append(div);
	}
	var footer = $('<tr />').append($('<td />', {'style':'background-color:#eee;'}).append(legend));
	$('#assessmentresults').append(footer);


}

clientPortal.prototype.getBarClass = function(quartile) {
	var barclass;
	switch (quartile) {
	case 0:
		barclass = 'progress-bar-danger';
		break;
	case 1:
		barclass = 'progress-bar-warning';
		break;
	case 2:
		barclass = 'progress-bar-info';
		break;
	case 3:
		barclass = 'progress-bar-success';
		break;
	default:
		barclass = 'progress-bar-default';
		break;
	}
	return barclass;
}


clientPortal.prototype.updateGradesTable = function(grades) {
	$('#gradetable').empty();
	$('#gradefooter').empty();
	
	var frag = document.createDocumentFragment();
	// measure variables
	var avg0 = 0;
	var avg1 = 0;
			
	for (var i = 0, len = Object.keys(grades).length; i < len; i++) {

		var profile = this.getProfile(grades[i].grade);
		//summary variables
		avg0 += parseFloat(grades[i].v0);
		avg1 += parseFloat(grades[i].v1);
		
		var tr0 = document.createElement("tr");
		var td0 = document.createElement("td");

		$(td0).append(this.getProfileBadge(profile));
		tr0.appendChild(td0);		
		
		var td1 = document.createElement("td");
		td1.className="text-center";
		td1.innerHTML = grades[i].v0;
		
		var td2 = document.createElement("td");
		td2.className="text-center";
		td2.innerHTML = (grades[i].v1*100).toPrecision(2)+'%';
		
		tr0.appendChild(td1);
		tr0.appendChild(td2);
		frag.appendChild(tr0);	
		
		var el = document.querySelector('#gradetable');
		el.appendChild(frag);
	}
	
	var tr0 = document.createElement("tr");
	var td0 = document.createElement("th");
	td0.innerHTML = "Average";
	var td1 = document.createElement("th");
	td1.className="text-center";
	td1.innerHTML = (avg0/Object.keys(grades).length).toFixed(1);
	var td2 = document.createElement("th");
	td2.className="text-center";
	td2.innerHTML = (avg1*100/Object.keys(grades).length).toFixed(1)+'%';
	
	tr0.appendChild(td0);
	tr0.appendChild(td1);
	tr0.appendChild(td2);	
	
	var el = document.querySelector('#gradefooter');
	el.appendChild(tr0);
}

clientPortal.prototype.getProfileBadge = function(profile) {
	var div = $('<div />', {
		'class':'profilesquare',
		'data-toggle' : 'tooltip',
		'title' : profile.labels[0]
			}).addClass(profile.profileClass);
	var icon = $('<i />', {'class':'fa'}).addClass(profile.profileIcon);
	$(div).append(icon);
	return div;
}	

clientPortal.prototype.initCriticalFactorsChart = function() {
	if (this.cfBarChart != null) this.cfBarChart.destroy();
	
    var ctx = document.querySelector("#criticalfactorschart").getContext("2d");
	var barChartConfig = {
		    type: "bar",
	  	    data: {
	  	  	  labels: ["loading..."],
  	  	  	  
  	  	  	  datasets: [{
  	  	  		label: "Applicants",
  	  	        backgroundColor: 'rgba(200, 200, 200, 0.8)',
  	  	        borderColor: 'rgba(150, 150, 150, 0.8)',
  	  	  		borderWidth: 2,
  	  	  	    data: []
  	  	  	  },
  	  	  	{
  	  	  		label: "Employees",
  	  	  		backgroundColor: 'rgba(0, 200, 0, 0.8)',
  	  	  		borderColor: 'rgba(0, 150, 0, 0.8)',
  	  	  		borderWidth: 2,
  	  	    	data: []
  	  	    	  }
  	  	  	  ]
  	  	  	},
  	  	    options: {
  	  	    	responsive: true,
  	  	        maintainAspectRatio: false,
  	  	        title: {
  	  	        	display: true,
  	  	        	fontSize: 18,
  	  	        	text: 'Critical Factors'
  	  	        },
  	  	        legend: {
  	  	        	position: 'left',
  	  	        	labels: {
  	  	        		boxWidth: 12
  	  	        	}
  	  	        },
  	  	        scales: {
  	  	            xAxes: [{
  	  	                stacked: false
  	  	                ,gridLines: {display:false}
  	  	            	,display: true
  	  	            }],
  	  	            yAxes: [{
  	                    ticks: {
  	                    	min: 0,
  	                    	max: 12,
  	                    	beginAtZero : true
  	                    },
  	  	                stacked: false
  	  	                ,gridLines: {display:false}
  	  	            	,display: false
  	  	            }]
  	  	        ,showScale: false
  	  	        },
  	  	    animation: {
  	    	  	duration: 500,
  	    	  	onComplete: function () {
  	    	  	    // render the value of the chart above the bar
  	    	  	    var ctx = this.chart.ctx;
  	    	  	    ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize, 'normal', Chart.defaults.global.defaultFontFamily);
  	    	  	    ctx.fillStyle = this.chart.config.options.defaultFontColor;
  	    	  	    ctx.textAlign = 'center';
  	    	  	    ctx.textBaseline = 'bottom';
  	    	  	    var fontVar = 'normal 16px "Helvetica Neue", Roboto, Arial'
    	    	  	if (this.chart.width < 600) fontVar = 'bold 14px "Helvetica Neue", Roboto, Arial';
  	    	  	    this.data.datasets.forEach(function (dataset) {
  	    	  	        for (var i = 0; i < dataset.data.length; i++) {
  	    	  	        	if (! dataset._meta.hidden) {
  	    	  	        		var meta;
  	    	  	        		for (key in dataset._meta) {
  	    	  	        			meta = dataset._meta[key];
  	    	  	        		}
  	    	  	                var model = meta.data[i]._model;
  	    	  	                ctx.font = fontVar;
  	    	  	                ctx.fillText(dataset.data[i].toFixed(1), model.x, model.y - 0);
  	    	  	        	}
  	    	  	        }
  	    	  	    });
  	    	  	}}    
  	  	    }
  	  	};
	this.cfBarChart = new Chart(ctx, barChartConfig);
}
	
clientPortal.prototype.updateCriticalFactorsChart = function() {
	var factors = stubCorefactors(this.corefactors);

	factors.sort(function(a,b) {
		return a.displayGroup.localeCompare(b.displayGroup);
	});
	
	$('#corefactorlist').empty();
	$(factors).each(function () {
		var row = $('<tr/>');
		row.append($('<td />',{ text : this.name }));
		row.append($('<td />',{ text : this.description }));
		row.append($('<td />',{ text : this.displayGroup }));		
		$('#corefactorlist').append(row);
	});
	
	var chartLabels = [];
	var chartData0 = []; 
	var chartData1 = [];
	
	for (var i = 0; i < factors.length;i++) {
		// randomize the pm score - 
		chartLabels.push(factors[i].name);
		chartData0.push(factors[i].score-2*Math.random());
		chartData1.push(factors[i].score+1*Math.random());
	}
	
	this.cfBarChart.config.data.labels = chartLabels;	
	this.cfBarChart.config.data.datasets[0].data = chartData0;
	this.cfBarChart.config.data.datasets[1].data = chartData1;
	this.cfBarChart.update();
}



//Payroll tools section
clientPortal.prototype.uploadPayroll = function(e) {
	$('#csvFile').parse({
		config : {
			header: true,
			dynamicTyping: true,
			complete: function(results, file) {
				$('#payroll').DataTable( {
					responsive: true,
					data: results.data,
					columns : [
					           { title: 'Employee ID', data: 'employee'},
					           { title: 'Raise Rate', data: 'RaiseRate'},
					           { title: 'Total Hours', data: 'Total Hours' },
					           { title: 'Tenure', data: 'Tenure' },
					           { title: 'Monthly Hours', data: 'Monthly Hours' }
					           ]

				});

				console.log("Parsing complete:", results, file);
			}
		},
		before : function(file, inputElem){},
		error: function(err, file, inputElem, reason){},
		complete : {}

	})
}


function cdf(x, mean, variance) {
	  return 0.5 * (1 + erf((x - mean) / (Math.sqrt(2) * variance)));
}

function erf(x) {
	  // save the sign of x
	  var sign = (x >= 0) ? 1 : -1;
	  x = Math.abs(x);

	  // constants
	  var a1 =  0.254829592;
	  var a2 = -0.284496736;
	  var a3 =  1.421413741;
	  var a4 = -1.453152027;
	  var a5 =  1.061405429;
	  var p  =  0.3275911;

	  // A&S formula 7.1.26
	  var t = 1.0/(1.0 + p*x);
	  var y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
	  return sign * y; 
}