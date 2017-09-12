package com.talytica.portal.resources;


import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.ws.rs.Consumes;

import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.SecurityContext;

import jersey.repackaged.com.google.common.collect.Lists;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Account;
import com.employmeo.data.model.CustomProfile;
import com.employmeo.data.model.ProfileDefaults;
import com.employmeo.data.model.Respondant;
import com.employmeo.data.model.User;
import com.employmeo.data.service.AccountService;
import com.employmeo.data.service.RespondantService;
import com.employmeo.data.service.UserService;
import com.talytica.portal.objects.ApplicantDataPoint;
import com.talytica.portal.objects.DashboardParams;

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
	private static final int LOWEST_STATUS = Respondant.STATUS_CREATED;
	private static final int HIGHEST_STATUS = Respondant.STATUS_HIRED;
	
	@Autowired
	RespondantService respondantService;
	@Autowired
	AccountService accountService;
	@Autowired
	UserService userService;
	@Context
	SecurityContext sc;
	
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
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		
		Account account = accountService.getAccountById(params.accountId);
		Timestamp from = new Timestamp(params.fromdate.getTime());
		Timestamp to = new Timestamp(params.todate.getTime() + ONE_DAY);
		List<Long> locationIds = Lists.newArrayList();
		if (params.locationId >= 1) { 
			locationIds.add(params.locationId);
		} else {
			if (user.getLocationRestrictionId() != null) locationIds = userService.getLocationLimits(user);
		}
		Long positionId = null;
		if (params.positionId >= 1) positionId = params.positionId;

		Page<Respondant> respondants = respondantService.getBySearchParams( params.accountId, LOWEST_STATUS, HIGHEST_STATUS,
				locationIds, positionId, Respondant.TYPE_APPLICANT, from, to, 1, 500);	
		
		List<String> labels = Arrays.asList("unscored", ProfileDefaults.PROFILE_A, ProfileDefaults.PROFILE_B,
				ProfileDefaults.PROFILE_C, ProfileDefaults.PROFILE_D);
		
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
			if (status >= Respondant.STATUS_HIRED) hiredByProfile[index] += count;
			if (status >= Respondant.STATUS_PREDICTED) scoredByProfile[index] += count;
			if (status >= Respondant.STATUS_COMPLETED) completedByProfile[index] += count;
			if (status >= Respondant.STATUS_STARTED) startedByProfile[index] += count;		
			if (status >= Respondant.STATUS_INVITED) invitedByProfile[index] += count;
		}

		// Assemble Applicant Data
		CustomProfile profile = account.getCustomProfile();
		List<ApplicantDataPoint> dataset= new ArrayList<ApplicantDataPoint>();
		for (int i = 0; i < labels.size(); i++) {
			ApplicantDataPoint profileData = new ApplicantDataPoint();	
			
			profileData.series = profile.getName(labels.get(i));
			profileData.labels = new String[1];
			profileData.labels[0] = profile.getName(labels.get(i));
			profileData.profileClass = profile.getCssClass(labels.get(i));
			profileData.color = profile.getColor(labels.get(i));
			profileData.highlight = profile.getHighlight(labels.get(i));
			profileData.overlay = profile.getOverlay(labels.get(i));
			profileData.profileIcon = profile.getIcon(labels.get(i));

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