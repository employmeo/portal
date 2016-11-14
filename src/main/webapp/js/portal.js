//Useful Global Variables
var historyChart;
var respondant;
var qTable;
var detailedScores;

Chart.defaults.global.defaultFontColor = '#000';
Chart.defaults.global.defaultFontSize = 16;
Chart.defaults.global.defaultFontFamily = '"Helvetica Neue", Roboto, Arial, "Droid Sans", sans-serif';

/* start: create the app */
clientPortal = function() {
	this.cookies = {};
	this.urlParams = {};
	this.user = {};

	this.assessmentList = {};
	this.positionList = {};
	this.locationList = {};
	this.corefactors = {};
	this.profiles = {
			"unscored" : { label : 'Unscored', profileClass : 'btn-default', profileIcon : 'fa-question-circle-o'},
			"profile_a" : { label : 'Rising Star', profileClass : 'btn-success', profileIcon : 'fa-rocket'},
			"profile_b" : { label : 'Long Timer', profileClass : 'btn-info', profileIcon : 'fa-user-plus'},
			"profile_c" : { label : 'Churner', profileClass : 'btn-warning', profileIcon : 'fa-warning'},
			"profile_d" : { label : 'Red Flag', profileClass : 'btn-danger', profileIcon : 'fa-hand-stop-o'},
			};

	this.respondant = {};
	this.dashParams = {};
	this.historyChart = null;
	this.dashApplicants = null;
	this.dashHires = null;
	this.qTable = null;
	this.detailedScores = null;
	this.init();
}

clientPortal.prototype.init = function() {
	// Load up Cookies & URL Parameters
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
	    var cur = ca[i].split('=');
	    this.cookies[cur[0].trim()] = cur[1];
	}
	var match, pl = /\+/g, // Regex for replacing addition symbol with a space
		search = /([^&=]+)=?([^&]*)/g, decode = function(s) {
			return decodeURIComponent(s.replace(pl, " "));
		}, query = window.location.search.substring(1);
	while (match = search.exec(query)) this.urlParams[decode(match[1])] = decode(match[2]);

	// Try to Login:
	if (this.cookies.hasOwnProperty('hash-word')) {
		$('#login').toggleClass('hidden');
		console.log('logmein');
		this.loginUser();
	} else {
		$('#wait').toggleClass('hidden');			
		$('#login').load('/components/login.htm');
      	var imagenum = Math.floor(Math.random()*12+1);
      	$('#mainbody').addClass('coverpage');
    	$('#mainbody').css('background-image',"url('/images/background-" + imagenum + ".jpg')");
	}
}

clientPortal.prototype.login = function () {
	$("#wait").removeClass('hidden');			
	$('#loginresponse').text('');
	$('#login').toggleClass('hidden');
	var thePortal = this;
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

clientPortal.prototype.loginFail = function(data) {
	$("#wait").removeClass('hidden');
	$('#loginresponse').text('');
	$('#login').toggleClass('hidden');
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

clientPortal.prototype.initializeDatePicker = function () {
	var thePortal = this;
	var cb = function(start, end, label) {
		$('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
		$('#fromdate').val(start.format('YYYY-MM-DD'));
		$('#todate').val(end.format('YYYY-MM-DD'));
		thePortal.requestDashUpdate();
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

clientPortal.prototype.requestDashUpdate = function() {
	var fields = $('#refinequery').serializeArray();
	this.dashParams = {};
	this.dashParams.accountId = this.user.userAccountId;
	for (var i=0;i<fields.length;i++) {
		this.dashParams[fields[i].name] = fields[i].value;
	}
	submitDashUpdateRequest(this);
	this.respParams = this.dashParams;
	this.respParams.pagesize = 10;
	this.respParams.pagenum = 1;
	this.respParams.statusLow = 10; //Show only completed and above
	this.respParams.statusHigh = 100; //Show all others
	submitLastTenUpdateRequest(this);
}

clientPortal.prototype.updateDash = function(data) {
	
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
	
	updateHistory(getHistoryData());
	
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

	var badge = getProfileBadge(data.profileClass, data.profileIcon, data.series);

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
	var thePortal = this;
	var respondants = data.content;
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
			console.log(this);
			thePortal.respondant = $(this).data('respondant');
			thePortal.showComponent('respondant_score');
		});
		
		$('#recentcandidates').append(li);
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
	for (var key in this.profiles) {
		var profile = this.profiles[key];
		if (series == profile.series) return profile;
	}
	return null;
}


function resetInvitation() {
	$('#invitationsent').addClass('hidden');
	$('#invitationform').removeClass('hidden');	
}



//Section for search respondants / build respondants table
function initRespondantsTable() {
	var rTable = $('#respondants').DataTable( {
		responsive: true,
		order: [[ 0, 'desc' ]],
		columns: [
		          { className: 'text-center', responsivePriority: 1, title: 'Score', 
		        	  data: 'respondant_profile_icon', 
		        	  render : function ( data, type, row ) {
		        		  return '<div class="profilemini ' + row.respondant_profile_class +
		        		  '"><i class="fa '+ data + '"></i></div>';
		        	  }
		          },
		          { responsivePriority: 2, className: 'text-left', title: 'First Name', data: 'respondant_person_fname'},
		          { responsivePriority: 3, className: 'text-left', title: 'Last Name', data: 'respondant_person_lname'},
		          { responsivePriority: 6, className: 'text-left', title: 'Email', data: 'respondant_person_email'},
		          { responsivePriority: 7, className: 'text-left', title: 'Position', data: 'respondant_position_name'},
		          { responsivePriority: 8, className: 'text-left', title: 'Location', data: 'respondant_location_name'}
		          ]
	});
	$.fn.dataTable.ext.errMode = 'none';
	updateRespondantsTable();
}


//Section for looking at / manipulating assessments
clientPortal.prototype.changeAssessmentTo = function(asid) {
	this.assessment = getAssessmentBy(asid);
	this.updateSurveyFields();
	this.updateSurveyQuestions();		
}

clientPortal.prototype.updateSurveyFields = function() {
	$('#assessmentname').text(this.assessment.displayName);
	$('#assessmenttime').text(msToTime(this.assessment.survey.completionTime));
	$('#assessmentdesc').html(this.assessment.survey.description);
	$('#completionguage').data('easyPieChart').update(100*this.assessment.survey.completionPercent);  
	$('#questiontotal').text(assessment.survey.questions.length);
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
	qTable = $('#questions').DataTable( {
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
	if (qTable == null) initSurveyQuestionsTable();
	qTable.clear();
	$('#questions').dataTable().fnAddData(this.assessment.survey.questions);
	qTable.$('tr').click(function (){
		qTable.$('tr.selected').removeClass('selected');
		$(this).addClass('selected');
	});
	return
}

function updateHistory(historyData) {
	var dashHistory = $("#dashHistory").get(0).getContext("2d");
	historyChart = new Chart(dashHistory, {
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
	return;
}

function showApplicantScoring(applicantData) {
	renderAssessmentScore(applicantData.scores);
	refreshPositionTenure(getPositionTenureData()); // use stub code
}

clientPortal.prototype.presentPredictions = function() {
	var profile = this.getProfile(this.respondant.profileRecommendation);
	$('#candidateicon').html('<i class="fa ' + profile.profileIcon +'"></i>');
	$('#candidateicon').addClass(profile.profileClass);
	$('#compositescore').text(Math.round(this.respondant.compositeScore));
	$('#candidatename').text(this.respondant.person.firstName + ' ' + this.respondant.person.lastName);
	$('#candidateemail').text(this.respondant.person.email);
	$('#candidateaddress').text(this.respondant.person.address);
	$('#candidateposition').text(this.getPositionBy(this.respondant.positionId).positionName);
	$('#candidatelocation').text(this.getLocationBy(this.respondant.locationId).locationName);
	$('#assessmentname').text(this.getAssessmentBy(this.respondant.accountSurveyId).displayName);
	$('#assessmentdate').text(this.respondant.respondantCreatedDate);
	
	var fulltext = this.respondant.person.firstName +
	               "'s application is in the top " +
	               Math.round(this.respondant.compositeScore) +
	               " percentile of applicants to " + 
	               this.getLocationBy(this.respondant.locationId).locationName + ".";
	$('#fulltextdesc').text(fulltext);
	
	this.renderAssessmentScore();
	
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
	var comparison = this.respondant.person.firstName + "'s predictions is better than " +
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

function changePositionTo(pos_id) {
	$(positionList).each(function() {
		if (pos_id == this.position_id) {
			this.data = getStubDataForRoleBenchmark(); /// replace with REST call or pull from other var

			updatePositionDetails(this);
			updatePositionModelDetails(this.data.role_benchmark);
			updateGradesTable(this.data.role_benchmark.role_grade);
			updateCriticalFactorsChart(this);

		}		
	});
}

function updatePositionDetails(position) {
	$('#positionname').text(position.position_name);
	$('#positiondesc').text(position.position_description);
}

//Payroll tools section
function uploadPayroll(e) {
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

function copyToClipboard(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val($(element).text()).select();
    document.execCommand("copy");
    $temp.remove();
}

function presentRespondantScores(dataScores) {
	$('#candidatename').text(respondant.respondant_person_fname + ' ' + respondant.respondant_person_lname);
	$('#candidateemail').text(respondant.respondant_person_email);
	$('#candidateaddress').text(respondant.respondant_person_address);
	$('#candidateposition').text(respondant.respondant_position_name);
	$('#candidatelocation').text(respondant.respondant_location_name);
	$('#assessmentname').text(respondant.respondant_survey_name);
	$('#assessmentdate').text(respondant.respondant_created_date);

	detailedScores = dataScores.detailed_scores;
	renderDetailedAssessmentScore();
}

function showAllDetails() {
	for (i in detailedScores) {
		var score = detailedScores[i];
		showDetail(score.corefactor_id);
	}
	$('#hideall').removeClass('hidden');
	$('#showall').addClass('hidden');
}

function hideAllDetails() {
	for (i in detailedScores) {
		var score = detailedScores[i];
		hideDetail(score.corefactor_id);
	}	
	$('#showall').removeClass('hidden');
	$('#hideall').addClass('hidden');
}

function showDetail(cfid) {
	$('#cfmessage_' + cfid).removeClass('hidden');	
	$('#expander_' + cfid).attr('onclick', 'hideDetail('+cfid+')');
	$('#expander_' + cfid).removeClass('fa-plus-square-o');
	$('#expander_' + cfid).addClass('fa-minus-square-o');
}


function hideDetail(cfid) {
	$('#cfmessage_' + cfid).addClass('hidden');
	$('#expander_' + cfid).attr('onclick', 'showDetail('+cfid+')');
	$('#expander_' + cfid).removeClass('fa-minus-square-o');
	$('#expander_' + cfid).addClass('fa-plus-square-o');
}

function renderDetailedAssessmentScore() {
	$('#assessmentresults').empty();
	detailedScores.sort(function(a, b) {
	    return a.corefactor_display_group.localeCompare(b.corefactor_display_group);
	});
	var displaygroup = "";
	
	for (var i in detailedScores) {
		var score = detailedScores[i];
		if (displaygroup != score.corefactor_display_group) {
			displaygroup = score.corefactor_display_group;
			var grouprow = $('<tr />');
			grouprow.append($('<th />', {'style':'text-align:center;'}).append($('<h4 />',{text:displaygroup})));
			$('#assessmentresults').append(grouprow);
		}
		var row = $('<tr />', {
			'title' : score.corefactor_description});
		var namediv = $('<div />', {
			'class' : 'col-xs-10 col-sm-8 col-md-6 col-lg-6 text-left',
			title: score.corefactor_description});
		var expander = $('<h5 />');
		expander.append($('<strong />', { text : score.corefactor_name + ' '}));
		expander.append($('<i />', {
			'onclick' : "showDetail(" + score.corefactor_id + ")",
			'class' : 'fa fa-plus-square-o',
			'id' : 'expander_' + score.corefactor_id
		}));
		namediv.append(expander);
		var scorediv = $('<div />', {
			'class' : 'col-xs-2 col-sm-4 col-md-6 col-lg-6 text-right', 
			html : '<h5><strong>' + score.cf_score.toFixed(1) + " of " + score.corefactor_high + '</strong></h5>'});
		var lowdesc = $('<div />', {
			'class' : 'hidden-xs col-sm-3 col-md-2 col-lg-2 text-left', 
			html : '<h6><em>' +score.corefactor_low_desc + '</em></h6>'});
		var highdesc = $('<div />', {
			'class' : 'hidden-xs col-sm-3 col-md-2 col-lg-2 text-right', 
			html : '<h6><em>' +score.corefactor_high_desc + '</em></h6>'});
		var progress = $('<div />', {'class' : 'progress col-xs-12 col-sm-6 col-md-8 col-lg-8'
				}).append($('<div />', {
			'class': 'progress-bar progress-bar-success progress-bar-striped',
			'role': 'progressbar',
			'aria-valuenow' : score.cf_score,
			'aria-valuemin' : "1",
			'aria-valuemax' : "11",
			'style' : 'width: ' + (100*score.cf_score/score.corefactor_high) + '%;'
		}));

		var tablecell = $('<td />');
		tablecell.append(namediv);
		tablecell.append(scorediv);
		tablecell.append(lowdesc);
		tablecell.append(progress);
		tablecell.append(highdesc);
		row.append(tablecell);
		$('#assessmentresults').append(row);
		var messageRow = $('<tr />',{
			'id' : 'cfmessage_' + score.corefactor_id,
			'class' : 'hidden'
		}).append($('<td />',{
			'bgcolor' : '#F7F7F7',
			'border-top' : 'none',
			'text' : prepPersonalMessage(score.cf_description)
			}));
		$('#assessmentresults').append(messageRow);
		

	}
	
}

function prepPersonalMessage (message) {
	var pm = message;
	if (pm != null) {
		pm = pm.replace(new RegExp("\\[FNAME\\]","g"),respondant.respondant_person_fname);
		pm = pm.replace(new RegExp("\\[LNAME\\]","g"),respondant.respondant_person_lname);
	
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

clientPortal.prototype.renderAssessmentScore = function() {
	var scores = this.respondant.respondantScores;
	$('#detailslink').prop("href", '/assessment_results.jsp?&respondant_id=' + this.respondant.id);
	$('#assessmentresults').empty();
	for (var key in scores) {
		var value = scores[key].value;
		var corefactor = this.getCorefactorBy(scores[key].corefactorId);
		var row = $('<tr />');
		var cell = $('<td />');
		var quartile = Math.floor(4*value/11);
		
		cell.append($('<div />', {'text': corefactor.name }));
		cell.append( $('<div />', {'class' : 'progress'}).append($('<div />', {
			'class': 'progress-bar '+getBarClass(quartile)+' progress-bar-striped',
			'role': 'progressbar',
			'aria-valuenow' : value,
			'aria-valuemin' : "1",
			'aria-valuemax' : "11",
			'style' : 'width: ' + value/0.11 + '%;',
			'text' : value
		}))); 
		row.append(cell);
		$('#assessmentresults').append(row);
	}

	var footer = $('<tr />');
	var legend = $('<td />', {'style':'background-color:#eee;'});
	legend.append($('<div />', {'class':'text-center', 'text': 'Bar Color Indicates Quartile'}));

	for (var i = 0; i<4; i++) {
		var div  = $('<div />', {'class' : 'col-xs-3 col-sm-3 col-md-3 col-lg 3'});	
		div.append( $('<div />', {'class' : 'progress'}).append($('<div />', {
			'class': 'progress-bar '+getBarClass(i)+' progress-bar-striped',
			'role': 'progressbar',
			'aria-valuenow' : 1,
			'aria-valuemin' : "0",
			'aria-valuemax' : "1",
			'style' : 'width: 100%;',
			'text' : i
		})));
		legend.append(div);
	}
	$('#assessmentresults').append(footer.append(legend));

    function getBarClass(quartile) {
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

}


function updatePositionModelDetails(role_benchmark) {
	document.querySelector('#div_applicant_count').innerHTML = role_benchmark.applicant_count;
	document.querySelector('#div_hire_count').innerHTML = role_benchmark.hire_count;
	document.querySelector('#div_hire_rate').innerHTML = Math.round((role_benchmark.hire_count/role_benchmark.applicant_count)*100)+'%';		
}

function updateGradesTable(arr1) {
	$('#gradetable').empty();
	$('#gradefooter').empty();
	
	var frag = document.createDocumentFragment();
	// measure variables
	var avg0 = 0;
	var avg1 = 0;
			
	for (var i = 0, len = Object.keys(arr1).length; i < len; i++) {
		//summary variables
		avg0 += parseFloat(arr1[i].v0);
		avg1 += parseFloat(arr1[i].v1);
		
		var tr0 = document.createElement("tr");
		var td0 = document.createElement("td");
		var divClass;
		var iconClass;
		var label;
		
		switch (arr1[i].grade){
			case "A":
				divClass='btn-success';
				iconClass='fa-rocket';
				label = 'Rising Star';
				break;
			case "B":
				divClass='btn-info';
				iconClass='fa-user-plus';
				label = 'Long Timer';
				break;
			case "C":
				divClass='btn-warning';
				iconClass='fa-warning';
				label = 'Churner';
				break;
			case "D":
				divClass='btn-danger';
				iconClass='fa-hand-stop-o';
				label = 'Red Flag';
				break;
		}	
		$(td0).append(getProfileBadge(divClass, iconClass, label));
		tr0.appendChild(td0);		
		
		var td1 = document.createElement("td");
		td1.className="text-center";
		td1.innerHTML = arr1[i].v0;
		
		var td2 = document.createElement("td");
		td2.className="text-center";
		td2.innerHTML = (arr1[i].v1*100).toPrecision(2)+'%';
		
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
	td1.innerHTML = (avg0/Object.keys(arr1).length).toFixed(1);
	var td2 = document.createElement("th");
	td2.className="text-center";
	td2.innerHTML = (avg1*100/Object.keys(arr1).length).toFixed(1)+'%';
	
	tr0.appendChild(td0);
	tr0.appendChild(td1);
	tr0.appendChild(td2);	
	
	var el = document.querySelector('#gradefooter');
	el.appendChild(tr0);
}

function getProfileBadge(divClass,iconClass,label) {
	var div = $('<div />', {
		'class':'profilesquare',
		'data-toggle' : 'tooltip',
		'title' : label
			}).addClass(divClass);
	var icon = $('<i />', {'class':'fa'}).addClass(iconClass);
	$(div).append(icon);
	return div;
}	

function initCriticalFactorsChart() {
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
  	    	  	        	if (! dataset._meta[0].hidden) {
  	    	  	                var model = dataset._meta[0].data[i]._model;
  	    	  	                ctx.font = fontVar;
  	    	  	                ctx.fillText(dataset.data[i].toFixed(1), model.x, model.y - 0);
  	    	  	        	}
  	    	  	        }
  	    	  	    });
  	    	  	}}    
  	  	    }
  	  	};
	return new Chart(ctx, barChartConfig);

}
	
function updateCriticalFactorsChart(position) {

	position.position_corefactors.sort(function(a,b) {
		return a.corefactor_display_group.localeCompare(b.corefactor_display_group);
	});
	
	$('#corefactorlist').empty();
	$(position.position_corefactors).each(function () {
		var row = $('<tr/>');
		row.append($('<td />',{ text : this.corefactor_name }));
		row.append($('<td />',{ text : this.corefactor_description }));
		row.append($('<td />',{ text : this.corefactor_display_group }));		
		$('#corefactorlist').append(row);
	});
	
	var chartLabels = [];
	var chartData0 = []; 
	var chartData1 = [];
	
	for (var i = 0; i < position.position_corefactors.length;i++) {
		chartLabels.push(position.position_corefactors[i].corefactor_name);
		chartData0.push(position.position_corefactors[i].pm_score_a-2*Math.random());
		chartData1.push(position.position_corefactors[i].pm_score_a+1*Math.random());
	}
	
	cfBarChart.config.data.labels = chartLabels;	
	cfBarChart.config.data.datasets[0].data = chartData0;
	cfBarChart.config.data.datasets[1].data = chartData1;
	
	cfBarChart.update();
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