package com.talytica.portal.resources;


import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.ws.rs.Consumes;

import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Respondant;
import com.employmeo.data.service.RespondantService;
import com.talytica.portal.objects.ApplicantDataPoint;
import com.talytica.portal.objects.DashboardParams;
import com.talytica.portal.objects.PositionProfile;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;


@Component
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/dashboard")
@Api( value="/1/dashboard", consumes=MediaType.APPLICATION_FORM_URLENCODED, produces=MediaType.APPLICATION_JSON)
public class DashboardResource {

	private static final long ONE_DAY = 24*60*60*1000; // one day in milliseconds
	private static final int LOWEST_STATUS = -1;
	private static final int HIGHEST_STATUS = 100;
	
	@Autowired
	RespondantService respondantService;
	
	@POST
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets dashboard metrics for given date-time range", response = ApplicantDataPoint.class,responseContainer = "List")
	   @ApiResponses(value = {
			     @ApiResponse(code = 200, message = "Respondant found"),
			     @ApiResponse(code = 404, message = "No such Respondant found")
			   })
	public Iterable<ApplicantDataPoint> getDashboardUpdate (
			@ApiParam(value = "Search Params") DashboardParams params) {
		
		Timestamp from = new Timestamp(params.fromdate.getTime());
		Timestamp to = new Timestamp(params.todate.getTime() + ONE_DAY);
		Long locationId = null;
		if (params.locationId >= 1) locationId = params.locationId;
		Long positionId = null;
		if (params.positionId >= 1) positionId = params.positionId;

		Page<Respondant> respondants = respondantService.getBySearchParams( params.accountId, LOWEST_STATUS, HIGHEST_STATUS,
				locationId, positionId, from, to, 1, 500);	
		
		List<String> labels = Arrays.asList("unscored", PositionProfile.PROFILE_A, PositionProfile.PROFILE_B,
				PositionProfile.PROFILE_C, PositionProfile.PROFILE_D);
		
		int[] invitedByProfile = { 0, 0, 0, 0, 0 };
		int[] startedByProfile = { 0, 0, 0, 0, 0 };
		int[] completedByProfile = { 0, 0, 0, 0, 0 };
		int[] scoredByProfile = { 0, 0, 0, 0, 0 };
		int[] hiredByProfile = { 0, 0, 0, 0, 0 };

		for (Respondant respondant: respondants) {
			int status = respondant.getRespondantStatus();
			String label = respondant.getProfileRecommendation();
			if (label == null) label = labels.get(0);
			int index = labels.indexOf(label);
			int count = 1;
			switch (status) {
			case Respondant.STATUS_TERMINATED:
			case Respondant.STATUS_QUIT:
			case Respondant.STATUS_HIRED:
				hiredByProfile[index] += count;
			case Respondant.STATUS_OFFERED:
			case Respondant.STATUS_DECLINED:
			case Respondant.STATUS_REJECTED:
			case Respondant.STATUS_SCORED:
			case Respondant.STATUS_PREDICTED:
				scoredByProfile[index] += count;
			case Respondant.STATUS_COMPLETED:
				completedByProfile[index] += count;
			case Respondant.STATUS_STARTED:
				startedByProfile[index] += count;
			case Respondant.STATUS_INVITED:
				invitedByProfile[index] += count;
				break;
			default:
				break;
			}
		}

		// Assemble Applicant Data
		List<ApplicantDataPoint> dataset= new ArrayList<ApplicantDataPoint>();
		for (int i = 0; i < labels.size(); i++) {
			ApplicantDataPoint profileData = new ApplicantDataPoint();
			JSONObject profile = PositionProfile.getProfileDefaults(labels.get(i));
			profileData.series = profile.getString("profile_name");
			profileData.profileClass = profile.getString("profile_class");
			profileData.color = profile.getString("profile_color");
			profileData.highlight = profile.getString("profile_highlight");
			profileData.overlay = profile.getString("profile_overlay");
			profileData.profileIcon = profile.getString("profile_icon");

			profileData.labels = new String[] {"Invited", "Started", "Completed", "Scored","Hired"};
			profileData.data = new int[5];
			profileData.data[0] = invitedByProfile[i];
			profileData.data[1] = startedByProfile[i];
			profileData.data[2] = completedByProfile[i];
			profileData.data[3] = scoredByProfile[i];
			profileData.data[4] = hiredByProfile[i];
			dataset.add(profileData);
		}

		
		return dataset;
	}

}