<%@ include file="/WEB-INF/includes/inc_head.jsp"%>
<div class="">
	<div class="page-title">
		<div class="title_left">
			<h3>Candidate Results</h3>
		</div>
		<div class="title_right">
			<div
				class="col-md-5 col-sm-5 col-xs-12 form-group pull-right top_search">
				<div class="input-group">
					<input type="text" class="form-control" placeholder="Search for...">
					<span class="input-group-btn">
						<button class="btn btn-default" type="button">Go!</button>
					</span>
				</div>
			</div>
		</div>
	</div>
	<div class="clearfix"></div>
	<div class="row">
		<div class="col-md-4 col-sm-4 col-xs-12">
			<div class="x_panel">
				<div class="x_title">
					<div style='display:inline-block;margin-left:5px;'><h3 id='candidatename'></h3></div>
					<div class="profilebadge pull-left" id='candidateicon'>
						<i class="fa fa-spinner fa-spin"></i>
					</div>
				</div>
				<div class="x_content">
					<div>
					    <h2 class='text-center'>Critical Trait Scores</h2>
						<a href='/assessment_results.jsp?&respondant_id=4999' id='detailslink' class='pull-right'>More Detail</a>
						<span id='assessmentdate' class='hidden'></span>
						<h4 id='assessmentname'>Assessment</h4>
					</div>
					<div>
						<table class='table table-hover'>
							<tbody id='assessmentresults'>
							</tbody>
						</table>
						<hr>
					</div>
				</div>
				<h4>Application Details <i class="fa fa-chevron-down pull-right" onclick="$('#candidatedetails').toggleClass('hidden');"></i>
				</h4>
					<div class='row'>
						<table class="table table-hover hidden" id='candidatedetails'>
							<tbody>
								<tr title="email address">
									<td><span><i class="fa fa-envelope"></i></span></td>
									<td><span id='candidateemail'></span></td>
								</tr>
								<tr title="home address">
									<td><span><i class="fa fa-home"></i></span></td>
									<td><span id='candidateaddress'></span></td>
								</tr>
								<tr title="position applied to">
									<td><span><i class="fa fa-briefcase"></i></span></td>
									<td><span id='candidateposition'></span></td>
								</tr>
								<tr title="location applied to">
									<td><span><i class="fa fa-map-marker"></i></span></td>
									<td><span id='candidatelocation'></span></td>
								</tr>
							</tbody>
						</table>
					</div>
			</div>
		</div>
		<div class="col-md-8 col-sm-8 col-xs-12">
			<div class='x_panel'>
				<div class="x_title">
					<h3>Composite Score: <span class="pull-right" id='compositescore'></span></h3>
					<div class="clearfix"></div>
				</div>
				<div class="x_content">
					<h4 id='fulltextdesc'></h4>
					<hr>
					<div class='container fluid text-center' id='predictions'>
					</div>
					<hr>
					<div class='container fluid text-center' id='histograms'>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
<%@ include file="/WEB-INF/includes/inc_header.jsp"%>
<script>
	var urlParams;
	(window.onpopstate = function() {
		var match, pl = /\+/g, // Regex for replacing addition symbol with a space
		search = /([^&=]+)=?([^&]*)/g, decode = function(s) {
			return decodeURIComponent(s.replace(pl, " "));
		}, query = window.location.search.substring(1);

		urlParams = {};
		while (match = search.exec(query))
			urlParams[decode(match[1])] = decode(match[2]);
	})();
	var respondantId = urlParams.respondant_id;
	var respondantUuid = urlParams.respondant_uuid;
	if (respondantId != null) {
		getPredictions(respondantId);
	}
	if (respondantUuid != null) {
		getPredictionsUuid(respondantUuid);
	}
</script>

</html>