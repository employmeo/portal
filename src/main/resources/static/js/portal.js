Chart.defaults.global.defaultFontColor = '#000';
Chart.defaults.global.defaultFontSize = 16;
Chart.defaults.global.defaultFontFamily = '"Helvetica Neue", Roboto, Arial, "Droid Sans", sans-serif';

/* start: create the app */
function clientPortal(version) {
    this.body = $('body');
    this.leftcol = $('.left_col');
    this.version = version;
	this.urlParams = {};
	this.user = {};
	
	// Account Object Lists
	this.assessmentList = [];
	this.positionList = [];
	this.locationList = [];
	this.benchmarkList = [];
	this.corefactors = [];
	this.profiles = [];
	this.emailHistories = {};

	// data search params
	this.respParams = {};
	this.dashParams = {};
	this.graderParams = {};

	// search results
	this.dashResults = null;
	this.searchResults = null;
	this.lastTenResults = null;
	this.myGraders = null;
	
	this.respondant = null;
	this.position = null;
	this.location = null;
	this.assessment = null;
	this.benchmark = null;
	this.invitation = null;
	this.signuprequest = null;
	
	// charts:
	this.historyChart = null;
	this.dashApplicants = null;
	this.dashHires = null;
	this.cfBarChart = null;
	this.voiceMoodsChart = null;
	this.benchmarkCharts = [];
	
	//tables:
	this.gTable = null;
	this.rRefereces == null;
	this.rTable = null;
	this.asTable = null;
	this.locTable = null;
	this.posTable = null;
	
	$.fn.dataTable.ext.errMode = 'none'; // suppress errors on null, etc.
	
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
  	var imagenum = Math.floor(Math.random()*11+1);
  	$('#mainbody').addClass('coverpage');
	$('#mainbody').css('background-image',"url('/images/background-" + imagenum + ".jpg')");
	if (this.urlParams.hasOwnProperty('hash')){
		$('#login').load('/components/reset.htm?version='+this.version);		
	} else {
		$('#login').load('/components/login.htm?version='+this.version);		
	}
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
	
	if (!this.urlParams.component) { // if account new / free trial... force welcome / setup page
		this.urlParams.component = 'dash';
		if (1 == this.user.account.accountStatus) this.urlParams.component = 'welcome';
		if (50 == this.user.account.accountStatus) this.urlParams.component = 'benchmarks';
	}

	$('#portal').toggleClass('hidden');
  	$('#mainbody').removeClass('coverpage');
	$('#mainbody').css('background-image','');
	$('#leftnav').load('/components/left.htm?version='+this.version);
	$('#topnav').load('/components/top.htm?version='+this.version);

	$.when (getLocations(thePortal), getPositions(thePortal), getAssessments(thePortal),
			getBenchmarks(thePortal), getCorefactors(thePortal), getProfiles(thePortal),getKeys(thePortal)).done(
			function () {
				if (thePortal.urlParams.respondantUuid) {
					$.when(getRespondantByUuid(thePortal, thePortal.urlParams.respondantUuid)).done(
						function () {
							thePortal.showComponent(thePortal.urlParams.component);
							$('#wait').toggleClass('hidden')
						});				
				} else {
					thePortal.showComponent(thePortal.urlParams.component);
					$('#wait').toggleClass('hidden')						
				}
			}
	);
}

clientPortal.prototype.loginFail = function(data) {
	$("#wait").addClass('hidden');
	$('#loginresponse').text(data.responseText);
	$('#login').removeClass('hidden');
}

clientPortal.prototype.requestPasswordChange = function() {
	var fields = $('#newpasswordform').serializeArray();
	this.cprf = {};
	for (var i=0;i<fields.length;i++) {
		this.cprf[fields[i].name] = fields[i].value;
	}
	if (this.cprf.newpass != this.cprf.confirmpass) {
		$('#newpasswordresponse').text('Passwords do not match - please try again.');
		return;
	}
	$("#wait").removeClass('hidden');
	submitPasswordChangeRequest(this);
}

clientPortal.prototype.signup = function() {
	var fields = $('#signupform').serializeArray();
	this.signuprequest = {};
	for (var i=0;i<fields.length;i++) {
		this.signuprequest[fields[i].name] = fields[i].value;
	}	
	$("#wait").removeClass('hidden');
	submitSignupRequest(this);
}

clientPortal.prototype.signupsmb = function() {
	var fields = $('#signupsmbform').serializeArray();
	this.signuprequest = {};
	for (var i=0;i<fields.length;i++) {
		this.signuprequest[fields[i].name] = fields[i].value;
	}	
	$("#wait").removeClass('hidden');
	submitSMBSignupRequest(this);
}

clientPortal.prototype.logout = function () {
	$("#wait").removeClass('hidden');			
	postLogout();
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
		if ((this.accountSurveyStatus !=99) && (this.type == 100)) {
			$('#asid').append($('<option />', { 
				value: this.id,
				text : this.displayName 
			}));
		}
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

clientPortal.prototype.updateBenchmarkSelect = function (detail) {
	$.each(	this.benchmarkList, function (index, value) {
		$('#benchmarkId').append($('<option/>', { 
			value: this.id,
			text : this.position.positionName + ' Benchmark'
		}));
	});
	if (this.benchmark) $('#benchmarkId').val(this.benchmark.id);
	if (detail) {
		 this.changeBenchmarkTo($('#benchmarkId').val());
	}
}

clientPortal.prototype.initializeDatePicker = function (callback) {
	var cb = function(start, end, label) {
		$('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
		$('#fromdate').val(start.format('YYYY-MM-DD'));
		$('#todate').val(end.format('YYYY-MM-DD'));
		callback();
	}

	var optionSet1 = {
			startDate: moment().subtract(89, 'days'),
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
	
	var assessment = null;
	if (null != this.user.account.defaultAsId) assessment = this.getAssessmentBy(this.user.account.defaultAsId);
	if (null != assessment) {
		$('#staticlink').attr('href',assessment.permalink);
		$('#staticlink').text(assessment.permalink);
		$('#smblinkdisplay').removeClass('hidden');
	} else {
		$('#smblinkdisplay').addClass('hidden');		
	}
	
	if (Object.keys(this.dashParams).length > 0) {
		// code to put the dashboard details in the right place.
		var drp = $('#reportrange').data('daterangepicker');
		drp.setStartDate(moment(this.dashParams.fromdate));
		drp.setEndDate(moment(this.dashParams.todate));
		$('#reportrange span').html(drp.startDate.format('MMMM D, YYYY') + ' - ' + drp.endDate.format('MMMM D, YYYY'));
		$('#locationId').val(this.dashParams.locationId);
		$('#positionId').val(this.dashParams.positionId);
		
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
	var hireratebars = 0;
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
		if (dataPoint.data[3] > 0) {this.addHireRateBar(dataPoint);hireratebars++;}
	}
	if (hireratebars == 0) $('#hirerates').append($('<div />',{'class':'no-data','text':'No Data Available'}));
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
	var total = 0;
	for (var i=0; i<data.datasets[0].data.length;i++) total += data.datasets[0].data[i];
	if (total >= 1) {
		$("#dashApplicants").removeClass('hidden');
		$("#appliedNoData").addClass('hidden');
		// Build Applicants Widget
		this.dashApplicants = new Chart($("#dashApplicants").get(0).getContext("2d"), {
			type: 'doughnut',
			data: data,
			options: {
				cutoutPercentage : 35,
				responsive : true,
				legend: { display: false }
			}});
	} else {
		$("#dashApplicants").addClass('hidden');
		$("#appliedNoData").removeClass('hidden');
	}
}

clientPortal.prototype.refreshDashHires = function(data) {
	if (this.dashHires != null) this.dashHires.destroy();
	var total = 0;
	for (var i=0; i<data.datasets[0].data.length;i++) total += data.datasets[0].data[i];
	if (total >= 1) {
		$("#dashHires").removeClass('hidden');
		$("#hiredNoData").addClass('hidden');
		// Build Hires Widget
	this.dashHires = new Chart($("#dashHires").get(0).getContext("2d"), {
		type: 'doughnut', 
		data: data, 
		options: {
			cutoutPercentage : 35,
			responsive : true,
			legend: { display: false }
	}});
	} else {
		$("#dashHires").addClass('hidden');
		$("#hiredNoData").removeClass('hidden');		
	}
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
			thePortal.showComponent('candidate_detail');
		});
		
		$('#recentcandidates').append(li);
	}
}

clientPortal.prototype.initStripeDetails = function () {
	var thePortal = this;
	if (!this.stripeCustomer) {
		$.when(getBillingSettings(thePortal),getNextInvoice(thePortal),getInvoiceHistory(thePortal)).done(function (){thePortal.renderStripeDetails();});
	} else {
		thePortal.renderStripeDetails();
	}
}

clientPortal.prototype.renderStripeDetails = function () {
	var source = null;
	var card = null;
	var sub;
	var period;
	if (!this.stripeCustomer) return;
	if (this.stripeCustomer.subscriptions.totalCount > 0) {
		for (var i in this.stripeCustomer.subscriptions.data) {
			sub = this.stripeCustomer.subscriptions.data[i];
			if ((status == "active") || (status == "trialing")) break;
		}
	} 
	if (!sub) {
		$('#accountproblemsmessage').removeClass('hidden');
	} else {
		$('#accountbillingstatus').removeClass('hidden');
		$('#accounttype').text(sub.plan.name);
		$('#accountstatus').text(sub.status);	
		$('#billingplan').text(sub.plan.name);
		$('#billingstatus').text(sub.status);
		period = moment(1000*sub.currentPeriodStart).format('MMM-DD') + ' to ' + moment(1000*sub.currentPeriodEnd).format('MMM-DD');
		$('#billingperiod').text(period);
		if (sub.status == "trialing") {
			$('#accounttrialmessage').removeClass('hidden');
			$('#accounttrialdaysleft').text(Math.floor((sub.trialEnd*1000 - new Date()) / (24*3600*1000)));
		}
	}
	if (this.stripeCustomer.sources.totalCount > 0) {
		for (var i in this.stripeCustomer.sources.data) {
			source = this.stripeCustomer.sources.data[i];
			if (source.object == "card") {
				card = source.brand + " " + source.expMonth + "/" + source.expYear;
			}
		}
	}
	if (!card) {
		$('#nocardonfile').removeClass('hidden');
		$('#yescardonfile').addClass('hidden');
		var btn = $('<script />', {
			'id':'addcardscript',
			'class':'stripe-button',
			'src':'https://checkout.stripe.com/checkout.js',
			'data-name':'Talytica',
			'data-key' : this.keys.stripe,
			'data-email':this.stripeCustomer.email,
			'data-zip-code': true,
			'data-label':'Add Credit Card',
			'data-panel-label':'Save Payment Info',
			'data-image':'https://portal.talytica.com/images/favicon-32x32.png',
			'data-allow-remember-me': false,
			'data-locale' : 'auto'	
		});
		$('#addcardform').append(btn);
	} else {
		$('#yescardonfile').removeClass('hidden');
		$('#nocardonfile').addClass('hidden');
		$('#carddetails').text(card);		
	}

	this.showInvoiceDetails();
}

clientPortal.prototype.showInvoiceDetails = function() {
	var thePortal = this;
	if (this.invoiceHistory) {
		this.invTable = $('#invoicehistorytable').DataTable( {
			 "paging" : false, "filter" : false, "ordering" : false, "info" : false, "responsive" : true,
			order: [[ 0, 'desc' ]],
			rowId: 'id',
			data : thePortal.invoiceHistory,
		    language: { emptyTable: "No invoice history" },
			columns: [
				{ responsivePriority: 1, className: 'text-left', title: 'ID', data: 'receiptNumber'},
				{ responsivePriority: 1, className: 'text-left', title: 'Date', data: 'date',
				  render: function ( data, type, row) { return moment(1000*data).format('MMMM DD, YYYY'); }},
				{ responsivePriority: 2, className: 'text-left', title: 'Period', data: 'periodStart',
				  render: function ( data, type, row) { 
					  return moment(1000*data).format('MMM-DD') + ' to ' + moment(1000*row.periodEnd).format('MMM-DD'); }},
				{ responsivePriority: 1, className: 'text-right', title: 'Amount', data: 'total',
						  render: function (data,type,row) {return '$ ' + data/100}}
	        ]
			});
	} else {
		if (this.invTable) this.invTable.destroy();
		$('#invoicehistory').addClass('hidden');
	}
	if (this.nextInvoice) {
		$('#nextbilldue').text(moment(this.nextInvoice.date*1000).format('MMMM DD, YYYY'));
		$('#nextbillamt').text('$ ' + this.nextInvoice.amountDue/100);
	}
}

clientPortal.prototype.addCreditCard = function(){
	var fields = $('#addcardform').serializeArray();
	var object = {};
	for (var i=0;i<fields.length;i++) {
		object[fields[i].name] = fields[i].value;
	}
	addStripeCreditCard(this, object.stripeToken);
}

clientPortal.prototype.initGradersTable = function(){
	var thePortal = this;
	this.gTable = $('#graders').DataTable( {
		responsive: true,
		order: [[ 0, 'desc' ]],
		rowId: 'id',
		columns: [
		          { responsivePriority: 3, className: 'text-left', title: 'Date', data: 'createdDate', render: function ( data, type, row) {
		        	  return moment(data).format('MM-DD-YY');
		          }},
		          { responsivePriority: 1, className: 'text-left', title: 'Candidate', data: 'respondant.person' ,
		        	  render : function ( data, type, row ) {if(!data) return ''; return data.firstName + ' ' + data.lastName;}},
		          { responsivePriority: 2, className: 'text-left', title: 'Status', data: 'status', render : function ( data, type, row ) {
		        	  if (data == 20) return 'Ignored'; if (data == 10) return 'Complete'; if (data == 1) return 'New'; return 'Started';
		          }},
		          { responsivePriority: 4, className: 'text-left', title: 'Question', data: 'question.description',
		        	  render: function ( data, type, row) {
		        		  if(!data) return '';
		        		  if (row.type== 1) return data;
		        	      return 'All Questions In: ' + thePortal.getAssessmentBy(row.respondant.accountSurveyId).displayName;
		        	      }},
		          { responsivePriority: 4, className: 'text-right', title: 'Ignore', data: 'id',
			        	  render : function ( data, type, row ) {
			        		  if(!data) return '';
			        		  if (row.status < 10) return '<button class="btn btn-danger btn-xs" onClick=portal.ignoreGrader('+row.id+')>X</button>'; 
		        	          return '';
		        	      }} 
		         ]
	});
	$.fn.dataTable.ext.errMode = 'none'; // suppress errors on null, etc.
	
	if (!this.myGraders) {
		this.searchGraders();
	} else {
		var drp = $('#reportrange').data('daterangepicker');
		drp.setStartDate(moment(this.graderParams.fromdate));
		drp.setEndDate(moment(this.graderParams.todate));
		$('#reportrange span').html(drp.startDate.format('MMMM D, YYYY') + ' - ' + drp.endDate.format('MMMM D, YYYY'));
		if (this.graderParams.status.length >2) $('#statusall').prop('checked',true);
		this.updateGradersTable(this.myGraders);
	}
}

clientPortal.prototype.searchGraders = function() {
	this.graderParams ={};
	this.graderParams.userId = this.user.id;
	this.graderParams.status = [1,5];
	if ($('#statusall').prop('checked')) this.graderParams.status.push(10);
	this.graderParams.fromdate = $('#fromdate').val();
	this.graderParams.todate = $('#todate').val();
	getGraders(this);
}


clientPortal.prototype.renderAudioLink = function(row, link) {
	var media = $('<audio />' , {
		'controls': '',
		'id': 'grader_media_' + row.id,
		'text':'Your Browser Does Not Support Video/Audio Playback'
	});
	var source = $('<source />', {'src':link});
	media.append(source);
	return media.wrap("<div />").parent().html();
}

clientPortal.prototype.renderVideoLink = function(row, link) {
	var media = $('<video />' , {
		'controls': '',
		'id': 'grader_media_' + row.id,
		'text':'Your Browser Does Not Support Video/Audio Playback'
	});
	var source = $('<source />', {'src':link});
	media.append(source);
	return media.wrap("<div />").parent().html();
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

clientPortal.prototype.updateGradersTable = function(data) {
	this.myGraders = data;		
	
	var thePortal = this;	
	if (this.myGraders.content != null) {
		$('#graders').dataTable().fnClearTable();
		if (this.myGraders.content.length > 0) $('#graders').dataTable().fnAddData(this.myGraders.content);
		this.gTable.$('tr').click(function (){
			thePortal.gTable.$('tr.selected').each(function () {
				$(this).removeClass('selected');
				thePortal.gTable.row(this).child.hide()});	
			$(this).addClass('selected');
			thePortal.grader = $('#graders').dataTable().fnGetData(this);
			if (thePortal.grader.criteria == null) { 
				var grader = $('#graders').dataTable().fnGetData(this);
			    $.when(getGrades(grader),getCriteria(grader)).done(function () {
				    thePortal.showGradesPanel();
			    });
		    } else {
		    	thePortal.showGradesPanel();
		    }

			var row = thePortal.gTable.row(this);
			
        	if(thePortal.grader.type == 1) {
        		thePortal.grader.responses = [thePortal.grader.response];
        		row.child(thePortal.renderAudioDetail(thePortal.grader.respondant, thePortal.grader.responses)).show();
        		$('div.container', row.child()).slideDown();
        		row.child().addClass('selected');
        	} else {
        		if (!thePortal.grader.responses) {
        			$.when(getAllResponses(thePortal.grader)).done(function() {
        				row.child( thePortal.renderAudioDetail(thePortal.grader.respondant, thePortal.grader.responses)).show();
        				$('div.container', row.child()).slideDown();
        				row.child().addClass('selected');
        				});
        		} else {
        			row.child( thePortal.renderAudioDetail(thePortal.grader.respondant, thePortal.grader.responses)).show();
        			$('div.container', row.child()).slideDown();
        			row.child().addClass('selected');
        		}
        	}
	
		});
	}
}


clientPortal.prototype.renderAudioDetail = function(respondant, responses) {
	var wrapper = $('<div />',{'class' : 'container', 'style' : 'display:none;'});
	var table = $('<table />', {'class' :'table table-condensed', 'style' :'margin:0px auto 0px auto;'});
 	var titles = $('<tr />');
	titles.append($('<th />',{ 'text' : 'Question'}));
	titles.append($('<th />',{ 'text' : 'Response'}));	
	table.append(titles);
	
	responses.sort(function(a,b) {
		return a.id - b.id;
	});
	
	for (var i=0;i<responses.length;i++) {
		response = responses[i];
		var ques = this.getQuestionFor(response.questionId, respondant.accountSurveyId);
		var row = $('<tr />');
		row.append($('<td />',{ 'text' : (i+1)+'. '+ques.questionText}));
		if (ques.questionType == 28) { row.append($('<td />').append(this.renderVideoLink(response, response.responseMedia))); }
		else {row.append($('<td />').append(this.renderAudioLink(response, response.responseMedia)));}
		table.append(row);
	}
	wrapper.append(table);
	return wrapper.wrap("<div />").parent().html();	
}

clientPortal.prototype.getQuestionFor = function(questionId, asid) {
	for (key in this.getAssessmentBy(asid).survey.surveyQuestions) {
		if (this.getAssessmentBy(asid).survey.surveyQuestions[key].questionId == questionId) 
			return this.getAssessmentBy(asid).survey.surveyQuestions[key].question;
	}
}

clientPortal.prototype.showGradesPanel = function() {

	var thePortal = this;
	if (this.grader == null) {
		$("#grades").addClass('hidden'); 
		$('#gradeforms').empty();
		return;
	}
	$('#gradername').html(this.grader.respondant.person.firstName + ' ' +
			this.grader.respondant.person.lastName);
	$('#gradedate').text(moment(this.grader.createdDate).format('MMM DD, YYYY'));
	$('#gradecompletion').text(this.grader.grades.length + ' of ' + this.grader.criteria.length + ' Completed');	
	$("#grades").removeClass('hidden'); 
	$('#gradeforms').empty();
	for (var key in this.grader.criteria) {
		if (key > 0) $('#gradeforms').append($('<hr />'));
		var form = this.createGradeForm(this.grader.criteria[key]);
		$('#gradeforms').append(form);
	}
}

clientPortal.prototype.initRespondantGradeables = function() {
	var thePortal = this;
	if (!this.respondant.gradeableresponses) {
		$.when(getGradeableResponses(thePortal.respondant)).done(function () {thePortal.showRespondantGradeables();});
	} else {
		this.showRespondantGradeables();
	}
}

clientPortal.prototype.showRespondantGradeables = function() {
	$('#gradeablescontainer').empty();
	$('#gradeablescontainer').html(this.renderAudioDetail(this.respondant, this.respondant.gradeableresponses));
	$('div.container','#gradeablescontainer').slideDown();
	this.renderOtherScoresIn('Graded','gradedresults');
	if ((this.respondant.gradeableresponses != null) && (this.respondant.gradeableresponses.length > 0)) $('#evaluations').removeClass('hidden');	
}

clientPortal.prototype.initRespondantReferences = function() {
	var thePortal = this;
	this.rReferences = $('#referencetable').DataTable( {
        "paging" : false, "filter" : false, "ordering" : false, "info" : false, "responsive" : true,
		order: [[ 0, 'desc' ]],
		rowId: 'id',
		columns: [
	          	  { responsivePriority: 1, className: 'text-left', title: '', data: 'status',
	          		  render: function (data,type,row) {
	          			  var cell = $('<td />');
	          			  switch (data) {
	          			  case 20:
	          				  cell.append($('<i />',{'class': 'fa fa-minus-square-o','title':'Declined / Ingored'}));
	          				  break;
	          			  case 10:
	          				  cell.append($('<i />',{'class': 'fa fa-check-square-o','title':'Complete'}));
	          				  break;
	          			  default:
	          				  cell.append($('<i />',{'class': 'fa fa-square-o','title':'Incomplete'}));
	          				  break;
	          			  }
	          			  return cell.html();
	          		  }
	          	  },
		          { responsivePriority: 1, className: 'text-left', title: 'Reference Name', data: 'person' ,
		        	  render : function ( data, type, row ) {return data.firstName + ' ' + data.lastName;}},
			      { responsivePriority: 2, className: 'text-left', title: 'Email', data: 'person.email'},
		          { responsivePriority: 5, className: 'text-left', title: 'Relationship', data: 'relationship'},
		          { responsivePriority: 6, className: 'text-left', title: 'Overall Score', data: 'summaryScore', render :
		        	  function (data,type,row) {if (row.status == 10) return thePortal.getStars(data, false);return '';}},
		          { responsivePriority: 4, className: 'details-control', title: 'Expand' }
		         ]
	});
	$.fn.dataTable.ext.errMode = 'none'; // suppress errors on null, etc.
	
	if (!this.respondant.graders) {
		$.when(getRespondantGraders(thePortal)).done(function () {thePortal.showRespondantReferences();});
	} else {
		this.showRespondantReferences();
	}
}

clientPortal.prototype.getStars = function(data, size) {
	if (isNaN(data) || (data==null)) return data;
	var tail = '';
	if (size) tail = '-lg';
	var stardiv = $('<div />',{'class':'star-ratings-sprite'+tail}).append($('<span />',
			{'class':'star-ratings-sprite-rating'+tail,'style' : 'width:'+(10*data)+'%'}));
	return stardiv.wrap('<div>').parent().html();
}

clientPortal.prototype.showRespondantReferences = function() {
	this.renderReferenceLikerts('Reference Scores','referenceresults');
	var references = [];
	for (var key in this.respondant.graders) {
		if (this.respondant.graders[key].type >= 100) references.push(this.respondant.graders[key]);
	}
	var warning = false;
	var ipAddresses = [];
	var emails = [];
	var decline = false;
	$('#referencewarning').css('display','none');
	for (var i=0;i<references.length;i++) {
		if (references[i].status == 20) decline=true;
		var ipAddress = references[i].ipAddress;
		var email = references[i].person.email;
		if (ipAddresses.indexOf(ipAddress) > -1) warning = true;
		if (emails.indexOf(email) > -1) warning = true;
		if (ipAddress) ipAddresses.push(ipAddress);
		emails.push(email);
		if (warning) break;
	}
	if (warning) {
		$('#warningtext').text('Some references share the same email or IP address.');
		$('#referencewarning').slideDown();
	} else if ((ipAddresses.indexOf(portal.respondant.ipAddress)>=0) || (emails.indexOf(portal.respondant.person.email)>=0)) {
		$('#warningtext').text('Candidate email or IP address matches a reference.');
		$('#referencewarning').slideDown();		
	}
	
	$('#referencetable').dataTable().fnClearTable();
	if (references.length > 0) {
		var thePortal = this;
		$('#referencetable').dataTable().fnAddData(references);
		this.rReferences.$('td.details-control').click(function (){
			var td = this;
			var tr = $(this).closest('tr');
	        var row = thePortal.rReferences.row( tr );
	        if ( row.child.isShown() ) {
	            row.child.hide();
	            tr.removeClass('shown');
	        } else {
	        	var grader = row.data();
	            row.child('<i class="fa fa-spinner fa-spin"></i>').show();
	            tr.addClass('shown');
	    		if (!grader.grades) {
	    			$.when(getGrades(grader),getCriteria(grader)).done(function () {thePortal.showReferenceResponses(td);});
	    		} else {
	    			thePortal.showReferenceResponses(td);
	    		}
	        }
		});
		var ungradedStatus = [11,12,31,32];
		if (ungradedStatus.indexOf(portal.respondant.respondantStatus) >=0) {
			if (decline) $('#addnewreference').removeClass('hidden');
			if ((portal.respondant.respondantStatus == 12) || (portal.respondant.respondantStatus == 32)) {
				$('#waveminimum').removeClass('hidden');
			}
		}
		$('#references').removeClass('hidden');	
	}
}

clientPortal.prototype.showReferenceResponses = function(td) {
	var tr = $(td).closest('tr');
    var myrow = this.rReferences.row( tr );
	var count = 0;
	var grader = myrow.data();
	var table = $('<table />',{'class' : 'table table-condensed'});
	for (var i=0;i<grader.grades.length;i++) {
		for (var j=0;j<grader.criteria.length;j++) {
			if (grader.criteria[j].questionId == grader.grades[i].questionId) grader.grades[i].sequence = j;
		}
	}
	grader.grades.sort(function(a,b) {
		if (a.sequence == b.sequence) return b.id - a.id;
		return a.sequence - b.sequence;
	});

	var lastGrade = null;
	for (var key in grader.grades) {
		var grade = grader.grades[key];
		if (grade.sequence == lastGrade) continue;
		count++;
		var row = $('<tr />');
		row.append($('<td />',{'text': count + ". " }));
		row.append($('<td />',{'html': grade.questionText}));
		if (grade.gradeText) {
			row.append($('<td />',{'class' : 'text-right', 'html': grade.gradeText }));
		} else {
			row.append($('<td />',{'class' : 'text-right', 'html': this.getStars(grade.gradeValue, false) }));
		}
		table.append(row);
		lastGrade = grade.sequence;
	}
	if (grader.status != 10) {
		var row = $('<tr />');
		if (grader.status == 20) {
			row.append($('<td />',{'text': 'Responses not used'}));
			row.append($('<td />',{'class' : 'text-right', 'text': 'Ignored / Declined'}));
		} else {
			row.append($('<td />',{'text': 'Reference incomplete'}));
			var cell = $('<td />',{'class' : 'text-right'});
			var remind = $('<button />', {
				'text' : 'remind',
				'data-toggle' : 'modal',
				'data-target' : '#confirm',
				'onClick' : 'portal.remindReference('+ grader.id +');',
				'class' : 'btn btn-xs btn-primary'
			});
			if (grader.status == 2) remind.text('remind again');
			var ignore = $('<button />', {
				'text' : 'ignore',
				'data-toggle' : 'modal',
				'data-target' : '#confirm',
				'onClick' : 'portal.confirmIgnoreReference('+ grader.id +');',
				'class' : 'btn btn-xs btn-danger'		
			});
			var history = $('<button />',{
				'class':'btn btn-default btn-xs',
				'text':'history',
				'data-displayed':0,
				'data-direction':'emailhistoryleft',
				'onClick' : 'portal.displayEmailHistory(this,"'+grader.person.email+'");'
			});
			cell.append(remind);
			cell.append(ignore);
			cell.append(history);
			row.append(cell);
		}
		table.append(row);
	}
    myrow.child(table.wrap("<div />").parent().html()).show();
}

clientPortal.prototype.remindRespondant = function(respondantId) {
	var thePortal = this;
	$.when(sendInviteReminder(respondantId)).done(function () {
		$('#confirmheader').text('Remind Candidate');
		$('#confirmbody').html('A reminder has been sent');
	    $('#modalconfirm').hide();
	    $('#modaldismiss').text('Ok');
	    $('#modaldismiss').show();
		var resp;
		if (thePortal.rTable) resp = thePortal.rTable.row('#'+respondantId).data();
		if (resp) {
			if (resp.respondantStatus < 6) resp.respondantStatus = 6;
			if ((resp.respondantStatus > 20) && (resp.respondantStatus < 26)) resp.respondantStatus = 26;
			thePortal.rTable.row('#'+respondantId).data(resp).draw();		
		} else if (thePortal.brTable) {
			resp = thePortal.brTable.row('#'+respondantId).data();	
			if (resp.respondantStatus < 6) resp.respondantStatus = 6;	
			if ((resp.respondantStatus > 20) && (resp.respondantStatus < 26)) resp.respondantStatus = 26;
			thePortal.brTable.row('#'+respondantId).data(resp).draw();	
		}
		if (thePortal.respondant.id == respondantId) {
			thePortal.renderApplicantDetails();
		}
	});
}

clientPortal.prototype.remindReference = function (referenceId) {
	remindEmailGrader(referenceId);
	$('#confirmheader').text('Remind Reference');
	$('#confirmbody').html('A reminder has been sent');
    $('#modalconfirm').hide();
    $('#modaldismiss').text('Ok');
    $('#modaldismiss').show();   
} 

clientPortal.prototype.confirmIgnoreReference = function (referenceId) {
	$('#confirmheader').text('Are you sure?');
	$('#confirmbody').html('Reference input will be ignored');
	$('#modalconfirm').attr('onClick', 'portal.ignoreReference('+ referenceId +');');
    $('#modalconfirm').text('Confirm');
    $('#modalconfirm').show();
    $('#modaldismiss').text('Cancel');
    $('#modaldismiss').show();		
}

clientPortal.prototype.ignoreReference = function (referenceId) {
	submitIgnoreReference(referenceId, this);
}

clientPortal.prototype.ignoreReferenceComplete = function (data) {
	for (var i=0;i<this.respondant.graders.length;i++) {
		if (data.id == this.respondant.graders[i].id) {
			this.respondant.graders[i].status = data.status;
			break;
		}
	}
	this.showRespondantReferences();
	$('#confirm').modal('hide');
}


clientPortal.prototype.addNewReference = function() {
	var thePortal = this;
	var fields = $('#newgrader').serializeArray();
	var ngr = {};
	for (var i=0;i<fields.length;i++) {
		ngr[fields[i].name] = fields[i].value;
	}
	ngr.respondantId = this.respondant.id;
	//reset form. slide toggle it away.
	$.when(addNewRespondantReference(thePortal, ngr)).done(function () {
		$('#newreferenceform').slideUp();
		$('#confirmheader').text('New Reference');
		$('#confirmbody').html('A request has been sent to ' + ngr.email);
	    $('#modalconfirm').hide();
	    $('#modaldismiss').text('Ok');
	    $('#modaldismiss').show();
		$('#modaldismiss').attr('onClick', 'portal.showRespondantReferences();');
		$('#confirm').modal('show');
	});
}

clientPortal.prototype.confirmWaveMinimum = function() {
	$('#confirmheader').text('Are you sure?');
	$('#confirmbody').html('References scores will be calculated, and open references closed.');
	$('#modalconfirm').attr('onClick', 'portal.waveMinimum('+this.respondant.id+');');
    $('#modalconfirm').text('Confirm');
    $('#modalconfirm').show();
    $('#modaldismiss').text('Cancel');
    $('#modaldismiss').show();
}

clientPortal.prototype.waveMinimum = function(respondantId) {
	var thePortal = this;
	$('#confirmbody').empty();
	$('#confirmbody').append($('<i />',{'class':'fa fa-spin fa-spinner fa-3x'}));
	$.when(waveMinGraders(respondantId)).done(function () {
		if ((thePortal.respondant.respondantStatus == 12) || (thePortal.respondant.respondantStatus == 32)){
			thePortal.respondant.respondantStatus = thePortal.respondant.respondantStatus - 1;
		}
		$('#confirm').modal('hide');
		$('#waveminimum').addClass('hidden');
	})
}

clientPortal.prototype.initDisplayResponses = function() {
	var thePortal = this;
	 $('#selfevaluation').addClass('hidden');
	this.displayResponses = $('#displayresponses').DataTable( {
        "paging" : false, "filter" : false, "ordering" : false, "info" : false, "responsive" : true,
		order: [[ 0, 'desc' ]],
		rowId: 'id',
		columns: [
		          { responsivePriority: 1, className: 'text-left', title: 'Question', data: 'name'} ,
		          { responsivePriority: 2, className: 'text-left', title: 'Candidate Answer', data: 'value'}
		         ]
	});
	$.fn.dataTable.ext.errMode = 'none'; // suppress errors on null, etc.
	
	if (!this.respondant.displayresponses) {
		$.when(getDisplayResponses(thePortal.respondant)).done(function () {thePortal.showDisplayResponses();});
	} else {
		this.showDisplayResponses();
	}
}

clientPortal.prototype.showDisplayResponses= function() {
	var showPersonalRatings = false;
	if (this.renderOtherScoresIn('Personal Ratings','personalratings') > 0) {
		$('#selfratings').removeClass('hidden');
		showPersonalRatings = true;
	}
	$('#displayresponses').dataTable().fnClearTable();
	if (this.respondant.displayresponses.length > 0) {
		$('#displayresponses').dataTable().fnAddData(this.respondant.displayresponses);
		$('#displayresponses').removeClass('hidden');
		$('#displayresponsesdiv').removeClass('hidden');
		showPersonalRatings = true;
	};
	if (showPersonalRatings) $('#selfevaluation').removeClass('hidden');
}

clientPortal.prototype.getRespondantGraderById = function(id) {
	for (var key in this.respondant.graders) {
		if (id == this.respondant.graders[key].id) return this.respondant.graders[key];
	}
	return null;
}

clientPortal.prototype.createGradeForm = function (criterion) {
	var grade = {'id':'','gradeText':'','gradeValue':null};
	if (this.grader.grades.length > 0) {
		this.checkGraderStatus(this.grader);
	}
	for (var i=0;i<this.grader.grades.length;i++) {
		if (criterion.questionId == this.grader.grades[i].questionId) grade = this.grader.grades[i];
	}
	
	var form =  $('<form/>', {
		 'name' : 'grade_'+this.grader.id + '_cr_' +criterion.questionId,
		 'action' : 'javascript:portal.submitGrade('+this.grader.id+','+criterion.questionId+');',
		 'class' : 'form',
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
	
	form.append($('<span />',{'class' : 'control-label', 'text' : 'Required'}));		
	form.append($('<h4 />').html(criterion.questionText));
	var ansdiv = $('<div />', {'class' : 'form-group'});
	switch(criterion.questionType) {
		case 2:
			var like = $('<div />', {'class' : 'col-xs-6 col-sm-6 col-md-6 text-center'});
			var radioLike =	$('<input />', {
				'id'   : 'radiobox-' + criterion.questionId +"-1",
				'type' : 'radio', 'class' : 'thumbs-up', 'name' : 'gradeValue',
				'onChange' : 'this.form.submit()', 'value' :  '10'});
			if (10 == grade.gradeValue) radioLike.prop('checked', true);
			like.append(radioLike);
			like.append($('<label />', {
				'for'   : 'radiobox-' + criterion.questionId +"-1", 'class' : 'thumbs-up' }));
			var dislike = $('<div />', {'class' : 'col-xs-6 col-sm-6 col-md-6 text-center'});
			var radioDislike =$('<input />', {
				'id'   : 'radiobox-' + criterion.questionId +"-2",
				'type' : 'radio', 'class' : 'thumbs-down', 'name' : 'gradeValue',
				'onChange' : 'this.form.submit()', 'value' :  '0'});
			if (0 == grade.gradeValue) radioDislike.prop('checked', true);
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
				var ans = 2*i;
				if (criterion.direction < 0) ans = 10 - 2*i;
				var star =$('<input/>',{
					'class' : 'star star-' + i,
					'id' : 'star-' + i + '-' + criterion.questionId,
					'type': 'radio',
					'name': "gradeValue",
					'onChange' : 'this.form.submit()',
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
	ansdiv.append($('<div />', {'class' : 'clearfix'}));
	form.append(ansdiv);
	var notes = $('<div />', {'class' : 'form-group has-feedback'});
	notes.append($('<label />',{'class' : 'control-label', 'text' : 'Notes','for' : 'notes_' + criterion.questionId}));
	var comments = grade.gradeText;
	notes.append($('<textarea />',{
		'name' : 'gradeText',
		'class' : 'form-control',
		'text' : comments,
		'onkeypress' : '$("#savenotes_'+criterion.questionId+'").removeClass("hidden");',
		'id' : 'notes_' + criterion.questionId}));
	var button = 'save';
	notes.append($('<button />',{
		'text' : 'save',
		'id' : 'savenotes_' + criterion.questionId,
		'class' : 'btn btn-primary btn-xs pull-right hidden',
		'type' : 'submit'}));
	form.append(notes);
	
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
	if (!grade.gradeValue) {
		 $('#'+formname).addClass('has-error');
		return false;
	} else {
		 $('#'+formname).removeClass('has-error');		
	}
	$('#'+formname+ " :input").prop('disabled', true);
	saveGrade(thePortal, grade);
	$('#savenotes_'+questionId).addClass('hidden');
}

clientPortal.prototype.logSavedGrade = function(grade) {
	var fieldname = 'gr_' + grade.graderId + '_cr_' + grade.questionId;
	var formname = 'grade_' + grade.graderId + '_cr_' + grade.questionId;
	$('#'+fieldname).val(grade.id);
	$('#'+formname+ " :input").prop('disabled', false);

	var updatedGrader = this.gTable.row('#'+grade.graderId).data();
	if (grade.graderId == updatedGrader.id) {
		var newGrade = true;
		if (updatedGrader.grades == null) updatedGrader.grades = new Array();
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
}

clientPortal.prototype.ignoreGrader = function(graderId) {

	var ignoredGrader = this.gTable.row('#'+graderId).data();
	ignoredGrader.status = 20; // This is ignored status?
	updateGraderStatus(ignoredGrader); // this is aynch - but don't care about response
	this.gTable.row('#'+graderId).remove().draw();
	window.event.stopPropagation();
	if (this.grader.id == graderId) {
		this.grader = null;
		this.showGradesPanel();
	}
	return false;
	
}
	
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

clientPortal.prototype.getBenchmarkBy = function(id) {
	for (var key in this.benchmarkList) {
		var benchmark = this.benchmarkList[key];
		if (id == benchmark.id) return benchmark;
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
		          { responsivePriority: 1, className: 'text-left', title: 'Score', data: 'compositeScore', 
		        	  render : function ( data, type, row ) { 
		        		    var badge = '<div style="display:inline-block;">' + 
		        		      thePortal.getProfileBadge(thePortal.getProfile(row.profileRecommendation)).wrap("<div />").parent().html() + '</div>';
		        		    var score = 'N/A';
		        		    if (data != null) score = data.toFixed(0);
		        		    var scorediv = '<div style="display:inline-block;font-size:26px;line-height:30px;float:right;">' +
		        		      score + '</div>';
		        		    return badge + scorediv;
		        		  }
		          },
		          { responsivePriority: 2, className: 'text-left', title: 'First Name', data: 'person',
		        	  render : function ( data, type, row ) {
		        		  var link = $('<a />',{
		        			  'onClick' : 'portal.setRespondantTo('+row.id+');portal.showComponent("candidate_detail")',
		        			  'text' : data.firstName + ' ' + data.lastName
		        		  });
		        	  	  return $(link).wrap('<div>').parent().html();
		        	  }},
			      { responsivePriority: 8, className: 'text-left', title: 'Status', data: 'respondantStatus',
			        	  render : function ( data, type, row ) { return thePortal.getStatusText(data);}},
		          { responsivePriority: 9, className: 'text-left', title: 'Position', data: 'positionId', 
		        	  render : function ( data, type, row ) { return thePortal.getPositionBy(data).positionName;}},
		          { responsivePriority: 10, className: 'text-left', title: 'Location', data: 'locationId', 
		        	  render : function ( data, type, row ) { return thePortal.getLocationBy(data).locationName;}},
		          { responsivePriority: 11, className: 'text-left', title: 'Email', data: 'person.email'},		        	  
		          { responsivePriority: 5, className: 'text-left', title: 'Actions', data: 'respondantStatus', 
		        	  render : function ( data, type, row ) { return thePortal.renderRespondantActions(row).html();}}
		         ]
	});
	$.fn.dataTable.ext.errMode = 'none';
	if (this.searchResults == null) {
		this.searchRespondants();
	} else {
		// put params in 
		var drp = $('#reportrange').data('daterangepicker');
		drp.setStartDate(moment(this.respParams.fromdate));
		drp.setEndDate(moment(this.respParams.todate));
		$('#fromdate').val(drp.startDate.format('YYYY-MM-DD'));
		$('#todate').val(drp.endDate.format('YYYY-MM-DD'))
		$('#reportrange span').html(drp.startDate.format('MMMM D, YYYY') + ' - ' + drp.endDate.format('MMMM D, YYYY'));
		$('#locationId').val(this.respParams.locationId);
		$('#positionId').val(this.respParams.positionId);
		$('#statusLow').val(this.respParams.statusLow);
		$('#statusHigh').val(this.respParams.statusHigh);
		if ((this.respParams.statusLow == "1") && (this.respParams.statusHigh == "14")) this.toggleSearchStatus($('#searchInc'));
		if ((this.respParams.statusLow == "1") && (this.respParams.statusHigh == "50")) this.toggleSearchStatus($('#searchBoth'));
		if ((this.respParams.statusLow == "15") && (this.respParams.statusHigh == "50")) this.toggleSearchStatus($('#searchComp'));
		this.updateRespondantsTable();
	}
}

clientPortal.prototype.getStatusText = function (status) {
	if ((status == 0) || (status == 20)) return 'Created';
	if ((status == 1) || (status == 21)) return 'Invited';
	if ((status == 5) || (status == 6) || (status == 25) || (status == 26)) return 'Incomplete';
	if ((status == 10) || (status == 30)) return 'Submitted';
	if ((status == 11) || (status == 31)) return 'Needs Input';
	if ((status == 15) || (status == 35)) return 'Scored';
	if ((status == 19) || (status == 89) || (status == 99)) return 'Not Hired';
	if (status == 100) return 'Hired';
	return 'In Process';
}

clientPortal.prototype.renderRespondantActions = function(respondant) {
	var cell = $('<td />',{'class':'text-center'});
	var thePortal = this;
	switch (respondant.respondantStatus) {
		case -20:  // created but not pre-screened
		case 0:  // created but not emailed (yet)
			break;
		case 1:
		case 5: // created or started
		case 21: // created or started
		case 25: // created or started
			cell.append($('<button />',{
				'class':'btn btn-primary btn-xs',
				'text':'Remind',
				'data-toggle' : 'modal',
				'data-target' : '#confirm',
				'onClick' : 'portal.remindRespondant('+respondant.id+');'
			}));
			break;
		case 6: // reminded already, but not finished
		case 26: // reminded already, but not finished
			cell.append($('<button />',{
				'class':'btn btn-primary btn-xs',
				'text':'Remind Again',
				'data-toggle' : 'modal',
				'data-target' : '#confirm',
				'onClick' : 'portal.remindRespondant('+respondant.id+');'
			}));
			break;
		default:
			break;
			//remove the button for view detail. instead set elsewhere
			//if (respondant.type != 1) break; // only view candidates
			//cell.append($('<button />',{
			//	'class':'btn btn-primary btn-xs',
			//	'text':'View Detail',
			//	'onClick' : 'portal.setRespondantTo('+respondant.id+');portal.showComponent("candidate_detail");'
			//}));
			//break;
	}
	return cell;
}


clientPortal.prototype.toggleSearchStatus = function(button) {
	$('#buttonBar').children().removeClass('btn-primary');
	$('#buttonBar').children().addClass('btn-default');
	$(button).removeClass('btn-default');
	$(button).addClass('btn-primary');
	$('#statusLow').val($(button).data('min'));
	$('#statusHigh').val($(button).data('max'));
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
	$('#tablewait').removeClass('hidden');
	submitRespondantSearchRequest(this.respParams, function(data) {
		thePortal.searchResults = data;
		thePortal.updateRespondantsTable();
		$('#tablewait').addClass('hidden');
	});
}

clientPortal.prototype.searchRespondantsExtend = function() {
	var thePortal = this;
	if (this.searchResults.last) return;
	$('#tablewait').removeClass('hidden');
	this.respParams.pagenum++;
	submitRespondantSearchRequest(this.respParams, function(data) {
		thePortal.searchResults.content = thePortal.searchResults.content.concat(data.content);
		thePortal.searchResults.last = data.last;
		if (!data.last) {
			thePortal.searchRespondantsExtend();
		} else {
			thePortal.updateRespondantsTable();
			$('#tablewait').addClass('hidden');
		}
	});	
}

clientPortal.prototype.updateRespondantsTable = function() {
	var thePortal = this;
	if (!this.searchResults.content) return;
	$('#respondants').dataTable().fnClearTable();
	if (this.searchResults.content.length > 0) {
		$('#respondants').dataTable().fnAddData(this.searchResults.content);
		this.rTable.$('tr').click(function (){
			thePortal.rTable.$('tr.selected').removeClass('selected');
			$(this).addClass('selected');
			thePortal.respondant = $('#respondants').dataTable().fnGetData(this);
			thePortal.renderApplicantDetails();
			thePortal.renderAssessmentScore(false);
		});
		
		this.rTable.columns([1,2,3,4]).every( function () {
            var column = this;
            var cell = $('#filters').children()[this[0][0]];
            var select = $('<select style="width:100%;"><option value=""></option></select>')
                .appendTo( $(cell).empty() )
                .on( 'change', function () {
                    var val = $.fn.dataTable.util.escapeRegex(
                        $(this).val()
                    );

                    column
                        .search( val ? '^'+val+'$' : '', true, false )
                        .draw();
                } );

            column.cells('', column[0]).render('display').sort().unique().each( function ( d, j ) {
                select.append( '<option value="'+d+'">'+d+'</option>' )
            } );
		});
		
	}
	if (this.searchResults.last) {
		$('#extendsearch').addClass('hidden');
	} else {
		$('#extendsearch').removeClass('hidden');
		$('#additionalentries').text('Retrieve ' + (this.searchResults.totalElements - this.searchResults.size) + ' additional entries');
	}
}

clientPortal.prototype.setRespondantTo = function(respondantId) {
	this.respondant = this.rTable.row('#'+respondantId).data();
}

//Section for looking at / manipulating assessments
clientPortal.prototype.changeAssessmentTo = function(asid) {
	this.assessment = this.getAssessmentBy(asid);
	this.updateSurveyFields();	
}

clientPortal.prototype.updateSurveyFields = function() {
	$('#assessmentname').text(this.assessment.displayName);
	$('#assessmenttime').text(msToTime(this.assessment.survey.completionTime));
	$('#assessmentdesc').html(this.assessment.survey.description);
	$('#completionguage').data('easyPieChart').update(100*this.assessment.survey.completionPercent);  
	$('#questiontotal').text(this.assessment.survey.surveyQuestions.length);

}

clientPortal.prototype.initSettingsPage = function() {
	$('#accountname').text(this.user.account.accountName);
	$('#accountlocation').text(this.getLocationBy(this.user.account.defaultLocationId).street1);
	this.initStripeDetails();
	this.initLocationTable();
	this.initPositionTable();
	this.initAssessmentTable();
}

clientPortal.prototype.initLocationTable = function() {
	var thePortal = this;
	if (this.locTable) this.locTable.destroy();
	this.locTable = $('#locationstable').DataTable( {
		"paging" : true, "filter" : true, "ordering" : true, "info" : false, "responsive" : true,
		rowId: 'id',
		data: this.locationList,
		columns: [{ title: 'ID', data: 'id'},
		          { title: 'Location Name', data: 'locationName'},
		          { title: 'Address', data: 'street1'}], 
		createdRow : function (row, data, dataIndex) {
		    $(row).click(function (){
				thePortal.locTable.$('tr.selected').removeClass('selected');
				$(this).addClass('selected');
				var location = $('#locationstable').dataTable().fnGetData(this);
				thePortal.putObjectInForm(location, 'locationUpdate');
				$('#locationId').val(location.id);
				$("#locationaction").text("Edit");
				$('#editlocation').slideDown();
			});
		}
	});
}

clientPortal.prototype.initPositionTable = function() {
	var thePortal = this;
	if (this.posTable) this.posTable.destroy();
	this.posTable = $('#positionstable').DataTable( {
		"paging" : false, "filter" : false, "ordering" : true, "info" : false, "responsive" : true,
		rowId: 'id',
		data: this.positionList,
		columns: [{ title: 'ID', data: 'id'},
		          { title: 'Position', data: 'positionName'},
		          { title: 'Description', data: 'description'}],
		createdRow : function (row, data, dataIndex) {
		    $(row).click(function (){
				thePortal.posTable.$('tr.selected').removeClass('selected');
				$(this).addClass('selected');
				var position = $('#positionstable').dataTable().fnGetData(this);
				thePortal.putObjectInForm(position, 'positionUpdate');
				$('#positionId').val(position.id);
				$("#positionaction").text("Edit");
				$('#editposition').slideDown();
			});
		}
	});
}

clientPortal.prototype.initAssessmentTable = function(){
	var thePortal = this;
	this.asTable = $('#assessmentstable').DataTable( {
		"paging" : false, "filter" : false, "ordering" : true, "info" : false, "responsive" : true,
		rowId: 'id',
		data: this.assessmentList,
		columns: [{ title: 'ID', data: 'id'},
		          { title: 'Name', data: 'displayName', render : function(data,type,row) {
		        	  return row.overRideDisplayName || data;}},
		          { title: 'Static Link', data: 'permalink'}
		          ],
		createdRow : function (row, data, dataIndex) {
		    $(row).click(function (){
				thePortal.asTable.$('tr.selected').removeClass('selected');
				$(this).addClass('selected');
				var assessment = $('#assessmentstable').dataTable().fnGetData(this);
				thePortal.putObjectInForm (assessment, 'assessmentUpdate');
				thePortal.changeAssessmentTo(assessment.id);	
				$('#assessmentId').val(assessment.id);
				$('#editassessment').slideDown();
			});
		}
	});
}

//Section for search respondants / build respondants table
clientPortal.prototype.showBenchmarkRespondants = function() {
	var thePortal = this;
	var completed = 0;
	for (var key in this.benchmark.respondants) if (this.benchmark.respondants[key].respondantStatus >= 10) completed++;
	$('#completed').text(completed);
	var participationrate = 100*(completed) / (this.benchmark.invited || 1)
	$('#participationrate').text(participationrate.toFixed(0)+'%');
	
	if ((participationrate >= 80) || completed >= 20) {
		$('#completed').addClass('text-success');
		$('#participationrate').addClass('text-success');
		$('#calculatebutton').removeClass('hidden');
	} else {
		$('#completed').addClass('text-danger');
		$('#participationrate').addClass('text-danger');
	}
	this.brTable = $('#benchmarkrespondants').DataTable( {
		responsive: true, destroy: true,
		data: this.benchmark.respondants,
		rowId: 'id',
		columns: [
		          { responsivePriority: 2, className: 'text-left', title: 'First Name', data: 'person',
		        	  render : function ( data, type, row ) { return data.firstName + ' ' + data.lastName; }},
			          { responsivePriority: 11, className: 'text-left', title: 'Email', data: 'person.email'},		        	  
			      { responsivePriority: 8, className: 'text-left', title: 'Status', data: 'respondantStatus',
			        	  render : function ( data, type, row ) { return thePortal.getStatusText(data);}},
		          { responsivePriority: 5, className: 'text-center', title: 'Actions', data: 'respondantStatus', 
		        	  render : function ( data, type, row ) { return thePortal.renderRespondantActions(row).html();}}
		         ]
	});
}

clientPortal.prototype.putObjectInForm = function (object, formid) {
	$('#' + formid + ' :input').each(function( index ) {
		if("TEXTAREA" == $(this)[0].tagName) {
			var content = object[this.name] || '';
			tinymce.get(this.id).setContent(content);
		}
		$(this).val(object[this.name]);
	});
}

clientPortal.prototype.mergeObjectFromForm = function (object, formid) {
	$('#' + formid + ' :input').each(function( index ) {
		if (!this.name) return;
		if("TEXTAREA" == $(this)[0].tagName) {
			object[this.name] = tinymce.get(this.id).getContent();
		} else {
			if ($(this).val()) object[this.name] = $(this).val();
			if (!$(this).val() && object[this.name]) object[this.name] = null;
		}
	});
}

clientPortal.prototype.updateAssessment = function() {
	var thePortal = this;
	var formname = 'assessmentUpdate';
	var id = $('#assessmentId').val();
	var assessment = this.getAssessmentBy(id);
	this.mergeObjectFromForm(assessment, formname);
	$.when(saveAssessment(assessment)).done(function(){
		thePortal.asTable.$('tr.selected').removeClass('selected');
		$('#assessmentstable').dataTable().fnClearTable();
		$('#assessmentstable').dataTable().fnAddData(thePortal.assessmentList);
		$('#editassessment').slideUp();
		});
}

clientPortal.prototype.updateLocation = function() {
	var thePortal = this;
	var formname = 'locationUpdate';
	var id = $('#locationId').val();
	var location = {};
	if ("Edit" == $('#locationaction').text()) {
		location = this.getLocationBy(id);
	} else {
		location.accountId = this.user.userAccountId;
		this.locationList.push(location);
	}
	this.mergeObjectFromForm(location, formname);
	$.when(saveLocation(location)).done(function(){
		$('#locationstable').dataTable().fnClearTable();
		$('#locationstable').dataTable().fnAddData(thePortal.locationList);
		$('#editlocation').slideUp();
		});
}

clientPortal.prototype.updatePosition = function() {
	var thePortal = this;
	var formname = 'positionUpdate';
	var id = $('#positionId').val();
	var position = {};
	if ("Edit" == $('#positionaction').text()) {
		position = this.getPositionBy(id);
	} else {
		position.accountId = this.user.userAccountId;
		this.positionList.push(position);
	}
	this.mergeObjectFromForm(position, formname);
	$.when(savePosition(position)).done(function(){
		thePortal.posTable.$('tr.selected').removeClass('selected');
		$('#positionstable').dataTable().fnClearTable();
		$('#positionstable').dataTable().fnAddData(thePortal.positionList);
		$('#editposition').slideUp();
		});
}

clientPortal.prototype.updateHistory = function(historyData) {
	if (this.historyChart != null) this.historyChart.destroy();
	
	if ((this.user.account.accountType == 1) || (this.user.account.accountType == 999)) {
		$("#dashHistory").removeClass('hidden');
		$("#hiremixNoData").addClass('hidden');
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
	} else {
		$("#dashHistory").addClass('hidden');
		$("#hiremixNoData").removeClass('hidden');
	}
}

clientPortal.prototype.renderApplicantDetails = function() {
	$('#applicantprofile').removeClass('hidden');
	var profile = this.getProfile(this.respondant.profileRecommendation);
	var composite = '';
	if (this.respondant.compositeScore) composite = this.respondant.compositeScore.toFixed(2);
	$('#compositescore').text(composite);
	$('#candidatename').text(this.respondant.person.firstName + ' ' + this.respondant.person.lastName);
	$('#applicantdetailtable').empty();
	$('#applicantscore').empty();
	$('#applicantscore').append($('<div>',{'class':'pull-left'}).append(portal.getProfileBadge(profile)));
	$('#applicantscore').append($('<div>',{'class':'pull-right lead'}).append(composite));
	$('#applicantscore').append($('<div>',{'class':'text-center lead'}).append(profile.labels[0]));

	var reminderStatus = [1,5,6,21,25,26];
	if (reminderStatus.indexOf(this.respondant.respondantStatus)>=0) {
		var row = $('<tr />');
		row.append($('<td />').append($('<i />',{'class':'fa fa-paper-plane'})));
		var cell = this.renderRespondantActions(this.respondant);
		cell.append($('<button />',{
			'class':'btn btn-default btn-xs',
			'text':'History',
			'data-direction':'emailhistory',
			'data-displayed':0,
			'onClick' : 'portal.displayEmailHistory(this,"'+this.respondant.person.email+'");'
		}));

		row.append(cell);
		$('#applicantdetailtable').append(row);	
	}
    this.addApplicantDetail('Assessment','fa fa-clipboard',this.getAssessmentBy(this.respondant.accountSurveyId).displayName);
	this.addApplicantDetail('Address','fa fa-home', this.respondant.person.address);
	this.addApplicantDetail('E-mail','fa fa-envelope', this.respondant.person.email);
	if (this.respondant.respondantStatus <10) this.addApplicantDetail('Link','fa fa-link', this.keys.assessmentPrefix + this.respondant.respondantUuid);
	this.addApplicantDetail('Phone Number','fa fa-phone',this.respondant.person.phone);
	this.addApplicantDetail('Position','fa fa-briefcase',this.getPositionBy(this.respondant.positionId).positionName);
	this.addApplicantDetail('Location','fa fa-map-marker',this.getLocationBy(this.respondant.locationId).locationName);
	this.addApplicantDetail('Look-up ID','fa fa-id-badge', this.respondant.payrollId);
}

clientPortal.prototype.displayEmailHistory = function(button, email) {
	if (!this.emailHistories[email]) {
		var thePortal = this;
		$.when(getEmailHistory(thePortal,email)).done(function () {thePortal.showEmailHistory(button,email);});
	} else {
		this.showEmailHistory(button,email);
	}
}

clientPortal.prototype.showEmailHistory = function(button,email) {
	var showing = $(button).attr('data-displayed');
	var divclass = $(button).attr('data-direction');
	if (showing == 0) {
		var	history = $('<div />',{'class':divclass});
		history.append($('<div />',{'class':'emailhistorytitle','text':'History: ' + email}));
		var table = $('<table />',{'class':'table table-hover table-condensed'});
		var items = this.emailHistories[email];
		var header = $('<tr />');
		header.append($('<th />',{'text': 'Event' }));
		header.append($('<th />',{'text': 'Timestamp' }));
		table.append($('<thead />').append(header));
		for (i in items) {
			var row = $('<tr />');
			row.append($('<td />',{'class' : 'text-left', 'html': items[i].event }));
			row.append($('<td />',{'class' : 'text-right', 'html': moment(items[i].timestamp).format("MMM DD, hh:mma") }));
			table.append(row);
		}
		history.append(table);
		$(button).append(history);
		$(button).attr('data-displayed',showing+1);
	} else {
		$(button).empty();
		$(button).text('history');	
		$(button).attr('data-displayed',0);
	}
}

clientPortal.prototype.addApplicantDetail = function(label, icon, value) {
	if (!value) return;
	if (!value.trim()) return;
	var row = $('<tr />',{'title':label});
	row.append($('<td />').append($('<i />',{'class':icon})));
	row.append($('<td />',{'text' : value}));	
	$('#applicantdetailtable').append(row);
}


clientPortal.prototype.renderPredictions = function() {
	if ((this.respondant.predictions == null) || (this.respondant.predictions.length == 0)) {
		$('#predictionpanel').addClass('hidden');
		return;
	} else {
		$('#predictionpanel').removeClass('hidden');
		this.respondant.predictions.sort(function(a,b) {
			return a.positionPredictionConfig.displayPriority - b.positionPredictionConfig.displayPriority;
		});
	}
	var profile = this.getProfile(this.respondant.profileRecommendation);
	$('#compositescore').text(Math.round(this.respondant.compositeScore));
	
	var fulltext = this.respondant.person.firstName +
				   "'s results are better than " +
	               Math.round(this.respondant.compositeScore) +
	               "% of all applicants, but worse than " +
	               (100-Math.round(this.respondant.compositeScore)) +
	               "% of applicants to " + 
	               this.getLocationBy(this.respondant.locationId).locationName + ".";
	$('#fulltextdesc').text(fulltext);
	
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
	
	var mean= prediction.positionPredictionConfig.mean;//getPredictionMean(prediction);
	var stdev = prediction.positionPredictionConfig.stDev;//getPredictionStDev(prediction);	
	var labels = new Array();
	var bgColors = new Array();
	var borderColors = new Array();
	var datapoints = new Array();
	
	// Generate labels and data, and highlight person
	for (var i = 0; i<10; i++) {
		var low = mean + ((i-5)*stdev)/2;
		if (low >1) continue;
		var high = mean + ((i-4)*stdev)/2;
		if (high <0) continue;
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

	$('#positionname').text(this.position.positionName);
	$('#positiondesc').text(this.position.description);

}

clientPortal.prototype.changeBenchmarkTo = function(id) {
	// reset the benchmarks page
	for (var key in this.benchmarkCharts) {
		this.benchmarkCharts[key].destroy();
		this.benchmarkCharts.splice[key,0];
	}
	$('#factors_barchart').empty();
	$('#factors_radarchart').empty();
	$('#benchmarklinks').addClass('hidden');
	$('#resumebutton').addClass('hidden');
	$('#respondantspanel').addClass('hidden');
	$('#completed').removeClass();
	$('#participationrate').removeClass();
	$('#calculatebutton').addClass('hidden');
	
	this.benchmark = this.getBenchmarkBy(id);
	if (!this.benchmark) return;
	
	$('#positionname').text(this.benchmark.position.positionName);
	$('#invited').text(this.benchmark.invited || 0);
	$('#completed').text(this.benchmark.participantCount || 0);
	var participationrate = 100*(this.benchmark.participantCount || 0) / (this.benchmark.invited || 1)
	$('#participationrate').text(participationrate.toFixed(0)+'%');
	$('#createddate').text(moment(this.benchmark.createdDate).format('MM/DD/YYYY'));
	
	switch (this.benchmark.type) {
		case 100:
			$('#benchmarktype').text('Simple');
			$('#benchmarklinks').removeClass('hidden');
			break;
		case 200:
			$('#benchmarktype').text('Performance');
			$('#benchmarklinks').removeClass('hidden');
			break;
		case 300:
			$('#benchmarktype').text('Detailed');
			break;
		default:
			$('#benchmarktype').text('Other');
			break;
	}
	
	switch (this.benchmark.status) {
		case 100:
		case 200: // In Setup.
			$('#benchmarkstatus').text('In Setup');
			$('#resumebutton').removeClass('hidden');
		break;
		case 300: // In Progress
			$('#benchmarkstatus').text('In Progress');
			$('#respondantspanel').removeClass('hidden');
			if (this.benchmark.respondants) {
				this.showBenchmarkRespondants();
			} else {
				var thePortal = this;
				$.when(getBenchmarkRespondants(thePortal)).done(function (){thePortal.showBenchmarkRespondants()});
			}
			$('#assessmentlinks').DataTable({
				destroy: true, info: false, sort: false, paging: false, filter: false, responsive: true,
				data: this.benchmark.accountSurveys,
				rowId: 'id',
				columns : [
				           {title: 'Assessment', data: 'displayName'},
				           {title: 'Link', data: 'permalink'}
				]
			});
		break;
		default:
			$('#benchmarkstatus').text('Completed');
			this.showBenchmarkCharts();
		break;
				
	}
}

clientPortal.prototype.showAllDetails = function() {
	for (i in this.respondant.respondantScores) {
		var score = this.respondant.respondantScores[i];
		this.showDetail(score.corefactorId);
	}
	$('#hideall').removeClass('hidden');
	$('#showall').addClass('hidden');
}

clientPortal.prototype.hideAllDetails = function() {
	for (i in this.respondant.respondantScores) {
		var score = this.respondant.respondantScores[i];
		this.hideDetail(score.corefactorId);
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


clientPortal.prototype.prepPersonalMessage = function(score) {
	
	var corefactor = this.getCorefactorBy(score.corefactorId);
	var message = null;
	for (var i in corefactor.corefactorDescriptions) {
		var desc = corefactor.corefactorDescriptions[i];
		if ((score.value >= desc.lowEnd) && (score.value <= desc.highEnd)) message = desc.description;
	}
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
	var thePortal = this;
	var scores = this.respondant.respondantScores;
	var excludeGroups = ['Hidden','Bio Data','Graded','Personal Ratings','Reference Scores', 'Voice Moods','Audio Characteristics'];
	if ((scores == null) || (scores.length == 0)) {
		$('#criticaltraitscores').addClass('hidden');
		$('#assessmentscores').addClass('hidden');
		return;
	}
	
	// sorting happens here?
	if (!detail) {
		$('#criticaltraitscores').removeClass('hidden');
		// sort by importance - unknown ??
	} else {
		$('#assessmentscores').removeClass('hidden');
		$('#assessmentname').text(this.getAssessmentBy(this.respondant.accountSurveyId).displayName);
		$('#assessmentdate').text(new Date(this.respondant.createdDate).toDateString());
		scores.sort(function(a,b) {
			var aCf = thePortal.getCorefactorBy(a.corefactorId);
			var bCf = thePortal.getCorefactorBy(b.corefactorId);
			// sort first by group
			if (aCf.displayGroup.localeCompare(bCf.displayGroup) !=0) return aCf.displayGroup.localeCompare(bCf.displayGroup);
			// then by parent ID - parents at top of group.
			if (aCf.parentId != null) {
				if (bCf.parentId == null) {
					return 1;
				} else {
					return aCf.displayGroup.localeCompare(aCf.parentId > bCf.parentId);
				}
			} else if (bCf.parentId != null) {
				return -1;
			}
			return aCf.name.localeCompare(bCf.name);
		});
	}
	
	var resultsDiv = $('#assessmentresults');
	if (detail) resultsDiv = $('#detailassessmentresults');
	resultsDiv.empty();
	var displaygroup = "";	
	var counter = 0;
	for (var key=0;key<scores.length;key++) {
		
		var value = scores[key].value;
		var corefactor = this.getCorefactorBy(scores[key].corefactorId);
        if ('Hidden' == corefactor.displayGroup) continue;
		if (detail) {
			if (excludeGroups.indexOf(corefactor.displayGroup) != -1) continue;
			if (corefactor.parentId != null) continue;
			if ((detail) && (displaygroup != corefactor.displayGroup)) {
				displaygroup = corefactor.displayGroup;
				var grouprow = $('<tr />');
				grouprow.append($('<th />', {'style':'text-align:center;'}).append($('<h4 />',{text:displaygroup})));
				resultsDiv.append(grouprow);
			}
			resultsDiv.append(this.renderScoreDetail(scores[key]));
			resultsDiv.append(this.renderScorePersonalMessage(scores[key]));	
		} else {
			resultsDiv.append(this.renderSimpleScore(scores[key]))
			if (counter >= 4) break;
		}
		counter++;
		
	}

	resultsDiv.append(this.getLegend());
    if ((counter == 0) && detail) $('#assessmentscores').addClass('hidden');
    if ((counter == 0) && !detail) $('#criticaltraitscores').addClass('hidden');
}

clientPortal.prototype.renderAudioAnalytics = function() {
	var counter = 0;
	var scores = this.respondant.respondantScores;
	
	
	var data = [];
	var labels = [];
	var colors = [];
		
	for (var key=0;key<scores.length;key++) {	
		var value = scores[key].value;
		var corefactor = this.getCorefactorBy(scores[key].corefactorId);
		if (corefactor.displayGroup != 'Voice Moods') continue;;	
		data.push(Math.round(10*value));
		labels.push(corefactor.name);
		colors.push(corefactor.lowDescription);
		counter++;
	}
	
	if (counter > 0) {
		voiceMoodsChart = new Chart($("#voicemoodscanvas").get(0).getContext("2d"),
			{
				type: 'polarArea',		
				options: {
					title : { text : 'Mood Chart', display:true},
					responsive: true,
					startAngle: -Math.PI / 6,
					maintainAspectRatio: false,
			  	    legend: {
			  	    	display: true, 
			  	    	position: 'bottom', fullWidth: false,
			  	    	labels: {fontSize: 10, boxWidth: 10}
					},
					animation: {animateRotate: true}},
				data: {
					labels : labels,
					datasets : [{
						data: data,
						backgroundColor: colors
					}]
				}
			});			
	}
	
	counter += this.renderOtherScoresIn('Audio Characteristics', 'voicereadings');
	if (counter > 0) $('#audioanalytics').removeClass('hidden');
	
}

clientPortal.prototype.renderReferenceLikerts = function(type, location) {
	var thePortal = this;
	var scores = this.respondant.respondantScores;	
	var resultsDiv = $('#'+location);
	resultsDiv.empty();
	var counter = 0;

	scores.sort(function(a,b) {
		var aCf = thePortal.getCorefactorBy(a.corefactorId);
		var bCf = thePortal.getCorefactorBy(b.corefactorId);
		// sort first by group
		if (Math.abs(aCf.defaultCoefficient) == Math.abs(bCf.defaultCoefficient)) {
			return aCf.name.localeCompare(bCf.name);			
		} 
		return Math.abs(bCf.defaultCoefficient)- Math.abs(aCf.defaultCoefficient);
	});
	
	for (var key=0;key<scores.length;key++) {	
		var value = 2+(8*((scores[key].value-1)/9));
		var corefactor = this.getCorefactorBy(scores[key].corefactorId);
		if (corefactor.displayGroup != type) continue;
		var tr = $('<tr />');
		tr.append($('<th />',{'html' : '<h2>'+corefactor.name+'</h2>'}));
		tr.append($('<th />',{'html'  : portal.getStars(value,true)}));
		resultsDiv.append(tr);
		counter++;	
	}

	if (counter == 0){
		$('#'+location).append($('<tr />').append($('<th />',{'class' : 'text-center', 'html' : '<h4>No Scores Available</h4>'})));
	}
	return counter;
}


clientPortal.prototype.renderOtherScoresIn = function(type, location) {
	var thePortal = this;
	var scores = this.respondant.respondantScores;
	
	var resultsDiv = $('#'+location);
	resultsDiv.empty();
	var counter = 0;

	scores.sort(function(a,b) {
		var aCf = thePortal.getCorefactorBy(a.corefactorId);
		var bCf = thePortal.getCorefactorBy(b.corefactorId);
		// sort first by group
		if (Math.abs(aCf.defaultCoefficient) == Math.abs(bCf.defaultCoefficient)) {
			return aCf.name.localeCompare(bCf.name);			
		} 
		return Math.abs(bCf.defaultCoefficient)- Math.abs(aCf.defaultCoefficient);

	});
	
	for (var key=0;key<scores.length;key++) {	
		var value = scores[key].value;
		var corefactor = this.getCorefactorBy(scores[key].corefactorId);
		if (corefactor.displayGroup != type) continue;
		resultsDiv.append(this.renderScoreDetail(scores[key]));
		resultsDiv.append(this.renderScorePersonalMessage(scores[key]));	
		counter++;	
	}

	if (counter == 0){
		$('#'+location).append($('<tr />').append($('<th />',{'class' : 'text-center', 'html' : '<h4>No Scores Available</h4>'})));
	}
	return counter;
}


clientPortal.prototype.renderScoreDetail = function(score) {
	var value = score.value;
	var corefactor = this.getCorefactorBy(score.corefactorId);
	var row = $('<tr />', {	'title' : corefactor.description});
	var cell = $('<td />');
	var quartile = Math.floor(4*value/11);
	
	var progress = $('<div />', {
		'class' : 'progress', 
		'id' : 'progress_' + corefactor.id,
		'style' : 'height:30px;margin-top:10px;margin-bottom:0px' 
			}).append($('<div />', {
			'class': 'progress-bar '+this.getBarClass(quartile)+' progress-bar-striped',
			'role': 'progressbar',
			'aria-valuenow' : value,
			'aria-valuemin' : "1",
			'aria-valuemax' : "11",
			'style' : 'line-height: 30px;font-size: 16px;font-weight: 700;width: ' 
				+ (100*value/corefactor.highValue) + '%;',
			'text' : value.toFixed(1) }));

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

	row.append(cell);
	return row;
}

clientPortal.prototype.addBenchmarksToScoreDetail = function() {
	var benchmark;
	for (var key in this.benchmarkList) {
		if (this.benchmarkList[key].positionId == this.respondant.positionId) benchmark = this.benchmarkList[key];
	}
	if (!benchmark || (benchmark.populations.length ==0)) return;

	var counter = 0;
	for (var key in benchmark.populations) {
		if (!benchmark.populations[key].targetValue) continue;
		counter++;
		var profile = this.getProfile(benchmark.populations[key].profile);
		var scores = benchmark.populations[key].populationScores;
		for (var i=0;i<scores.length;i++) {
			var circle = $('<div />', {
				'class' : profile.profileClass + ' benchmark hidebm-'+counter,
				'text'  : scores[i].mean.toFixed(1),
				'style' : '--val:'+(100*(scores[i].mean-1)/11)+'%;'
			});
			$('#progress_'+scores[i].corefactorId).append(circle);
		}
		var displaybm = $('<div />', {
			'class': 'selectbm-'+ counter,
			'onclick' : '$("#scorescolumn").toggleClass("showbm-'+counter+'");'
			});
		displaybm.append($('<button />', {'class' : 'pull-left benchmark ' + profile.profileClass})
				.append($('<i />', {'class' : 'fa ' + profile.profileIcon})));
		displaybm.append($('<span />',{'text':benchmark.populations[key].name}));
		$('#benchmarkgroups').append(displaybm);
	}

	if (counter > 0) $('#benchmarks').removeClass('hidden');
}

clientPortal.prototype.renderScorePersonalMessage = function(score) {
	var messageRow = $('<tr />',{
		'id' : 'cfmessage_' + score.corefactorId,
		'class' : 'hidden'
	}).append($('<td />',{
		'bgcolor' : '#F7F7F7',
		'border-top' : 'none',
		'text' : this.prepPersonalMessage(score)
	}));
	return messageRow;
}

clientPortal.prototype.renderSimpleScore = function(score) {
	var detail = true;
	var value = score.value;
	var corefactor = this.getCorefactorBy(score.corefactorId);
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
		'text' : value.toFixed(1) }));

	cell.append($('<div />', {'text': corefactor.name }));
	cell.append(progress); 
	row.append(cell);
	return row;
}


clientPortal.prototype.getLegend = function() {
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
	return legend;
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

clientPortal.prototype.showBenchmarkCharts = function() {
	if (!this.benchmark.populations || (this.benchmark.populations.length == 0)) return;
	
	this.benchmark.populations.sort(function(a,b) {
		return a.size < b.size; // reverse order of size
	});
	var factors = [];
	
	this.benchmark.populations[0].populationScores.sort(function(a,b){
		return a.significance < b.significance; // order of increasing significance
	});
	
	var groups = [{title : 'Cognitive Scores', displayGroups: ['Cognitive Scores', 'Skills and Abilities'], type: 'bar'},
	              {title : 'Personality Traits', displayGroups: ['Personality Traits'], type: 'radar'},
		          {title : 'Culture Fit', displayGroups: ['Culture Fit'], type: 'bar'},
		          {title : 'Career Interests', displayGroups: ['Career Interests'], type: 'radar'},
		          {title : 'Motivations', displayGroups: ['Motivations'], type: 'radar'}];
	for (var item in groups) {
		group = groups[item];
	    var chartLabels = [];
		var chartData = [];
		var genPop = {
				label : 'General Population',
		        backgroundColor: 'rgba(220, 220, 220, 0.6)',
			    borderColor: 'rgba(150, 150, 150, 0.8)',
			  	borderWidth: 2,
			  	data : []
			};
		for (var key in this.benchmark.populations) {
			if (!this.benchmark.populations[key].targetValue) continue; // exclude the "false" populations
			var profile = this.getProfile(this.benchmark.populations[key].profile);
			var dataSet = {
				label : this.benchmark.populations[key].name,
	  	  		backgroundColor: profile.overlay,
	  	  		borderColor: profile.color,
		  		borderWidth: 2,
		  		data: []
			};
			var scores = this.benchmark.populations[key].populationScores;
			for (var i in scores) {
				var cf = this.getCorefactorBy(scores[i].corefactorId);
				if (cf.parentId != null) continue; // don't show minor traits
				if (group.displayGroups.indexOf(cf.displayGroup) == -1) continue; // include only for group
				if (chartLabels.indexOf(cf.name) == -1) {
					chartLabels.push(cf.name);
					genPop.data[chartLabels.indexOf(cf.name)] = cf.meanScore.toFixed(1);
				}
				dataSet.data[chartLabels.indexOf(cf.name)] = scores[i].mean.toFixed(1);
			}
			chartData.push(dataSet);			
		}
		chartData.push(genPop);
		if (chartLabels.length == 0) continue;
		
		var postAnimate = function(){};
		var panel = $('<div />', {'class':'x_panel'}).append(
				$('<div />', {'class':'x_title'}).append(
						$('<h3 />', {'class':'text-center','text':group.title})
				));
		panel.append($('<div />',{'class':'x_content'}).append($('<canvas />', {
			id : 'factorschart_'+item, style : 'min-height:320px;'})));

		var isBar = (group.type == 'bar');
		if (isBar) {
			postAnimate = showValues;
			$('#factors_barchart').append(panel);
		} else {
			var column = $('<div />', {'class':'col-xs-12 col-sm-4'}).append(panel);
			$('#factors_radarchart').append(column);			
		}

		var chart = new Chart(document.querySelector("#factorschart_"+item).getContext("2d"), {
		    type: group.type,
	  	    data: { labels: chartLabels, datasets: chartData },
		  	options: {
		  	   	responsive: true,
		  	    maintainAspectRatio: false,
		  	    legend: {position: 'top', labels: {boxWidth: 12 }},
		  	    scale: {
	                ticks: {
	                    beginAtZero: !isBar
	                }
	            },
		  	    scales: {
		  	        xAxes: [{stacked: false, gridLines: {display:false}, display: isBar }],
		  	        yAxes: [{ticks: {
		               		min: 1,
		               		max: 10,
		               		beginAtZero : true
		  	        	},
		            	stacked: false, gridLines: {display:false}, display: false
		  	        }],
		  	        showScale: false
		  	    },
	  	  	    animation: {
	  	  	    	duration: 200,
	  	    	  	onComplete: postAnimate
		  	    }
		  	}
		});
		
		this.benchmarkCharts.push(chart);
	}	
}

showValues = function () {
	    var ctx = this.chart.ctx;
	  	    ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize, 'normal', Chart.defaults.global.defaultFontFamily);
	  	    ctx.fillStyle = this.chart.config.options.defaultFontColor;
	  	    ctx.textAlign = 'center';
	  	    ctx.textBaseline = 'bottom';
	  	    var fontVar = 'normal 16px "Helvetica Neue", Roboto, Arial';
	  	if (this.chart.width < 600) fontVar = 'bold 14px "Helvetica Neue", Roboto, Arial';
	  	    this.data.datasets.forEach(function (dataset) {
	  	        for (var i = 0; i < dataset.data.length; i++) {
  	        		var meta;
  	        		for (var key in dataset._meta) meta = dataset._meta[key];
	  	        	if (meta && !meta.hidden) {
	  	                var model = meta.data[i]._model;
	  	                ctx.font = fontVar;
	  	                ctx.fillText(dataset.data[i], model.x, model.y - 0);
	  	        	}
	  	        }
	  	    });
}

clientPortal.prototype.initSetupWizard = function() {
	if (this.benchmark && this.benchmark.status >=300) this.benchmark=null; //remove  
	if (!this.benchmark) for (var key in this.benchmarkList) {
		if (this.benchmarkList[key].status <= 200) {
			this.benchmark = this.benchmarkList[key];
			break;
		}
	}
	if (this.benchmark)	return this.setupWizardStepTwo();
	
	// get assessments to choose from, and populate the table.
	$('#wait').removeClass('hidden');
	if (!this.assessmentOptions) {
		var thePortal = this;
		$.when(getAssessmentOptions(thePortal)).done(function(){thePortal.showAssessmentOptions();});
	} else {
		this.showAssessmentOptions();
	}
}

clientPortal.prototype.initSMBSetupWizard = function() {
	// get assessments to choose from, and populate the table.
	$('#wait').removeClass('hidden');
	if (!this.assessmentOptions) {
		var thePortal = this;
		$.when(getAssessmentOptions(thePortal)).done(function(){thePortal.showAssessmentOptions();});
	} else {
		this.showAssessmentOptions();
	}
}

clientPortal.prototype.showAssessmentOptions = function() {
	$('#assessmentgroup').empty();
	for (var key in this.assessmentOptions) {
		option = this.assessmentOptions[key];
		var row = $('<div />',{'class':'form-group'});
		var optionname = $('<div />',{'class':'col-xs-12 col-sm-3'});
		optionname.append($('<input />',{
			'type':'radio',
			'class':'cleancheck',
			'name':'surveyId',
			'id':'surveyId-' + option.id,
			'value': option.id
		}));
		optionname.append($('<label />',{
			'class':'h4 cleancheck',
			'text':option.name,
			'for':'surveyId-' + option.id
		}));
		row.append(optionname);
		var name = 'desc-' + option.id;
		var details = $('<div />',{'class':'col-xs-12 col-sm-9'});
		var oneliner = $('<h4 />', {'onclick': 'portal.toggleItem("'+name+'");'});
		oneliner.append($('<i />',{'class':'fa fa-question-circle pull-right'}));
		oneliner.append(option.oneLiner);
		details.append(oneliner);
		details.append($('<div />',{'style':'display:none;', 'id':name}).html(option.description));
		row.append(details);
		$('#assessmentgroup').append(row);	

	}
	$('#wait').addClass('hidden');
}

clientPortal.prototype.toggleItem = function(item){
	$('#'+item).slideToggle();
}

clientPortal.prototype.setupWizardPosition = function() {
	var surveyId = $('#wizard-position :input[name=surveyId]:checked').val();
	if (!surveyId) {
		$('#assessmentgroup').addClass('has-error');
		return false;
	}
	this.benchmarkRequest = {}; //get the position;
	this.benchmarkRequest.positionName = $('#positionName').val();
	this.benchmarkRequest.accountId = this.user.userAccountId;
	this.benchmarkRequest.surveyId = surveyId;
	
	var thePortal = this;
	$('#wait').removeClass('hidden');
	$.when(newBenchmark(thePortal)).done(function(){thePortal.setupWizardStepTwo();})
};

clientPortal.prototype.setupSMBWizard = function() {
	var surveyId = $('#wizard-assessment :input[name=surveyId]:checked').val();
	if (!surveyId) {
		$('#assessmentgroup').addClass('has-error');
		return false;
	}
	this.signupRequest = {};
	this.signupRequest.surveyId = surveyId;
	
	var thePortal = this;
	$('#wait').removeClass('hidden');
	$.when(configureSMBAssessment(thePortal)).done(function(){thePortal.showComponent('dash');$('#wait').addClass('hidden');})
};

clientPortal.prototype.setupWizardStepTwo = function() {
	$('#setupwizardone').removeClass('active');
	$('#setupwizardone').addClass('activated');
	$('#wizard_position').addClass('hidden');
	$('#setupwizardline').attr('data-now-value','50.0');
	$('#setupwizardline').css('width','50%');
	$('#wizard_benchmark').removeClass('hidden');
	$('#setupwizardtwo').addClass('active');
	$('#bmname').text(this.benchmark.position.positionName);
	$('#wait').addClass('hidden');
	// check if benchmark already(s) has assessments 
	this.benchmarkConfig = {};
	if (this.benchmark.accountSurveys.length>0) return this.setupWizardStepThree(); 

};

clientPortal.prototype.setupWizardSelectBenchmark = function () {
	this.benchmarkConfig.type = $('#wizard-benchmark :input[name=choice]:checked').val();
	$('#uploadbutton').prop('disabled',false);
	if (this.benchmarkConfig.type != "300") {
		$('#detailedbenchmark').slideUp(); 
	} else {
		$('#detailedbenchmark').slideDown();
		if(!this.uploadresults || this.uploadresults.data.length == 0) $('#uploadbutton').prop('disabled',true);
	}
}

clientPortal.prototype.setupWizardBenchmark = function() {
	if (this.uploadresults && this.benchmarkConfig.type == "300") this.benchmarkConfig.invitees = this.uploadresults.data;
	var thePortal = this;
	$('#wait').removeClass('hidden');
	$.when(configureBenchmark(thePortal)).done(function(){thePortal.setupWizardStepThree();})
}

clientPortal.prototype.setupWizardStepThree = function() {
	$('#setupwizardtwo').removeClass('active');
	$('#setupwizardtwo').addClass('activated');
	$('#wizard_benchmark').addClass('hidden');
	$('#setupwizardline').attr('data-now-value','83.3');
	$('#setupwizardline').css('width','83.3%');
	$('#setupwizardthree').addClass('active');
	$('#wizard_send').removeClass('hidden');
	$('#wait').addClass('hidden');
	if(this.benchmark.type == 300) {
		$('#invited').val(this.benchmark.invited);
		$('#invited').prop('disabled',true);
		$('#benchmarklinks').addClass('hidden');	
	} else {
		$('#assessmentlinks').DataTable({
			destroy: true, info: false, sort: false, paging: false, filter: false, responsive: true,
			data: this.benchmark.accountSurveys,
			rowId: 'id',
			columns : [
			           {title: 'Assessment', data: 'displayName', 'class':'lead'},
			           {title: 'Link', data: 'permalink', 'class':'lead'}
			]
		});
		$('#completeWizard').text('Click to Confirm Send');
	}	
};

clientPortal.prototype.completeSetupWizard = function() {
	this.benchmarkConfig.invited = $('#invited').val();
	$('#wait').removeClass('hidden');
	sendBenchmark(this);
};

clientPortal.prototype.calculateBenchmark = function() {
	$('#wait').removeClass('hidden');
	calcBenchmark(this);
};

clientPortal.prototype.parseFileToTable = function(file, tablename) {	
	var requiredHeaders = ['firstName','lastName','email','topPerformer'];
	var acceptableformats = ['text/csv', 'application/vnd.ms-excel'];
	$('#fileuploaddiv').addClass('has-file');
	$('#fileuploaddiv .filename').text(file.name);
	if (acceptableformats.indexOf(file.type) == -1) {
		$('#fileuploaddiv').addClass('has-error');
		$('#fileuploaddiv .fileerror').text('Invalid File Type');
		return;
	} else {
		$('#fileuploaddiv').removeClass('has-error');		
	}
	var thePortal = this;
	Papa.parse(file, {
		header: true,
		dynamicTyping: true,
		complete: function(results, file) {
			thePortal.uploadresults = results;
			var headers = [];
			for (var i=0;i<results.meta.fields.length;i++) {
				var index = requiredHeaders.indexOf(results.meta.fields[i])
				if (index != -1) {
					headers.push({ title: results.meta.fields[i], data: results.meta.fields[i]});
					requiredHeaders.splice(index,1);
				} else {
					headers.push({
						title: 'Ignored: ' + results.meta.fields[i],
						data: results.meta.fields[i],
						'class' : 'text-muted'});	
				}
			}

			if (requiredHeaders.length > 0) {
				$('#fileuploaddiv').addClass('has-error');
				$('#fileuploaddiv .fileerror').text('Missing Fields: ' + requiredHeaders);
				thePortal.uploadresults = null;
			} else if (results.data.length < 10) {
				$('#fileuploaddiv').addClass('has-error');
				$('#fileuploaddiv .fileerror').text(results.data.length + ' record(s) in set. At least 10 are required');
				thePortal.uploadresults = null;
			} else {
				$('#fileuploaddiv').addClass('has-success');
				thePortal.uploadresults = results;
				$('#uploadbutton').prop('disabled',false);
			}
			
			thePortal.fileUploadTable = $('#'+tablename).DataTable( {
				destroy: true, filter: false, responsive: true,
				data: results.data,
				columns : headers
			});
		},
		error: function(err, file, inputElem, reason){
			$('#fileuploaddiv').addClass('has-error');
			$('#fileuploaddiv .fileerror').text(reason);
			console.log(err, file, inputElem, reason);
		}
	});
}

clientPortal.prototype.clearFileUpload = function(tablename) {
	$('#fileuploaddiv').removeClass('has-error');		
	$('#fileuploaddiv').removeClass('has-file');
	$('#fileuploaddiv input').val('');
	if ($.fn.DataTable.isDataTable('#'+tablename)) {
		$('#'+tablename).dataTable().fnDestroy();
		$('#'+tablename).empty();
	}
}

// jpPDF function
clientPortal.prototype.saveCandidatePDF = function () {
	var filename = portal.respondant.person.firstName + " " + portal.respondant.person.lastName + ".pdf";
	this.savePDF(filename,"#mainpanel");
}

clientPortal.prototype.savePDF = function (filename, divId) {
	var pdf = new jsPDF('p', 'in', 'letter');
	pdf.internal.scaleFactor=96;
	$(divId).addClass('topdf');
	$('#wait').removeClass('hidden');
	pdf.addHTML($(divId), 0,0, {pagesplit:true}, function()
	{
		pdf.save(filename);
		$(divId).removeClass('topdf');
		$('#wait').addClass('hidden');
	});
}

// Navigation and UI functions.
clientPortal.prototype.readyLeftNav = function() {
	var thePortal = this;
    var URL = window.location; //
    this.sidebar = $('#sidebar-menu');
    this.sidebar_footer = $('.sidebar-footer');
    if (this.user.account.accountType < 100) $('#benchmarkingmenu').addClass('hidden');
    if ((this.user) && (this.user.userType == 100)) {
    	this.sidebar.find('li').filter('[data-restrict="100"]').remove();
    }
    this.sidebar.find('li ul').slideUp();
    this.sidebar.find('li').removeClass('active');
    this.sidebar.find('li').on('click', function(ev) {
    	var link = $('a', this).attr('href');
    	// prevent event bubbling on parent menu
    	if (link) {
    		ev.stopPropagation();
    	} 
    	// execute slidedown if parent menu
    	else {
    		if ($(this).is('.active')) {
    			$(this).removeClass('active');
    			$('ul', this).slideUp();
	        } else {
	            thePortal.sidebar.find('li').removeClass('active');
	            thePortal.sidebar.find('li ul').slideUp();
	            
	            $(this).addClass('active');
	            $('ul', this).slideDown();
	        }
	    }
    });
    
}

clientPortal.prototype.readyTopNav  =function() {
	$('#user_fname').text(this.user.firstName);
    this.menutoggle = $('#menu_toggle');
    var thePortal = this;
    this.menutoggle.on('click', function() {
        if (thePortal.body.hasClass('nav-md')) {
        	thePortal.body.removeClass('nav-md').addClass('nav-sm');
        	thePortal.leftcol.removeClass('scroll-view').removeAttr('style');
        	thePortal.sidebar_footer.hide();

            if (thePortal.sidebar.find('li').hasClass('active')) {
            	thePortal.sidebar.find('li.active').addClass('active-sm').removeClass('active');
            }
        } else {
        	thePortal.body.removeClass('nav-sm').addClass('nav-md');
            thePortal.sidebar_footer.show();

            if (thePortal.sidebar.find('li').hasClass('active-sm')) {
            	thePortal.sidebar.find('li.active-sm').addClass('active').removeClass('active-sm');
            }
        }
    });
}

clientPortal.prototype.showComponent = function(component) {
	this.sidebar.find('.current-page').removeClass('current-page');
	this.sidebar.find('ul').children('li').children('ul').slideUp(0);
	this.sidebar.find('.active').removeClass('active');

    notifications = []; // eventually, we'll do this a better way.
    if (this.benchmark && component != 'wizard' && this.benchmark.status <300) {
    	var notification = {};
    	notification.id = this.benchmark.id;
    	notification.text = 'Reminder - you have not completed initial benchmarking. ';
       	notification.link = 'Click Here to Return';
       	notification.component = 'wizard';
       	notifications.push(notification);
    }
    
    var thePortal = this;
	$('#mainpanel').load('/components/'+component+'.htm?version='+this.version, function(){thePortal.showNotifications(notifications);});
	
	this.sidebar.find("a[data-component='" + component + "']").parent('li').addClass('current-page');
    this.sidebar.find('a').filter(function () {
        return $(this).data('component') == component;
    }).parent('li').addClass('current-page').parent('ul').slideDown(0).parent().addClass('active'); 
    
}

clientPortal.prototype.showNotifications = function(notifications) {
	for (var key in notifications) {
		notification = notifications[key];
		var notifydiv = $('<div />', {'id' : 'notification-' + notification.id, 'class': 'alert lead text-center col-xs-12 bg-info'});
		notifydiv.append($('<span>', {text : notification.text}));
		notifydiv.append($('<a />', { text : notification.link, href : '#', onclick : 'portal.showComponent("'+notification.component+'");'}));
		$('#mainpanel').prepend(notifydiv);
	}
}

clientPortal.prototype.activateUIElements = function() {
	
	// Close ibox function
	$('.close-link').click(function () {
	    var content = $(this).closest('div.x_panel');
	    content.remove();
	});
	
	// Collapse ibox function
	$('.collapse-link').click(function () {
	    var x_panel = $(this).closest('div.x_panel');
	    var button = $(this).find('i');
	    var content = x_panel.find('div.x_content');
	    content.slideToggle(200);
	    (x_panel.hasClass('fixed_height_390') ? x_panel.toggleClass('').toggleClass('fixed_height_390') : '');
	    (x_panel.hasClass('fixed_height_320') ? x_panel.toggleClass('').toggleClass('fixed_height_320') : '');
	    button.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
	    setTimeout(function () {
	        x_panel.resize();
	    }, 50);
	});


	// Accordion
	$(function () {
	    $(".expand").on("click", function () {
	        $(this).next().slideToggle(200);
	        $expand = $(this).find(">:first-child");

	        if ($expand.text() == "+") {
	            $expand.text("-");
	        } else {
	            $expand.text("+");
	        }
	    });
	});
	
}

// Helper Functions:

function msToTime(s) {
	  var ms = s % 1000;
	  s = (s - ms) / 1000;
	  var secs = s % 60;
	  s = (s - secs) / 60;
	  var mins = s % 60;
	  return + mins + ':' + (secs<10 ? '0':'') + secs;
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