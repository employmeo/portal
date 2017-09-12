package com.talytica.portal.resources;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.validation.constraints.NotNull;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.core.SecurityContext;

import jersey.repackaged.com.google.common.collect.Lists;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Account;
import com.employmeo.data.model.AccountSurvey;
import com.employmeo.data.model.Benchmark;
import com.employmeo.data.model.CustomProfile;
import com.employmeo.data.model.Location;
import com.employmeo.data.model.Position;
import com.employmeo.data.service.AccountService;
import com.employmeo.data.service.AccountSurveyService;
import com.employmeo.data.service.UserService;
import com.talytica.portal.objects.ApplicantDataPoint;
import com.employmeo.data.model.ProfileDefaults;
import com.employmeo.data.model.User;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/account")
@Api( value="/1/account", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class AccountResource {

	@Autowired
	private AccountService accountService;
	@Autowired
	private AccountSurveyService accountSurveyService;
	@Autowired
	private UserService userService;
	@Context
	SecurityContext sc;

	
	@GET
	@Deprecated // nobody should be calling this!
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the list of all Accounts", response = Account.class, responseContainer = "List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Accounts found"),
	     @ApiResponse(code = 404, message = "Accounts not found")
	   })	
	public Iterable<Account> getAllAccounts() {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName()); 
		log.warn("deprecated method called");
		return accountService.getAllAccounts();
	}
	
	@GET
	@Deprecated // nobody should be calling this!
	@Path("/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the account by provided Id", response = Account.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Account found"),
	     @ApiResponse(code = 404, message = "No such Account found")
	   })	
	public Response getAccount(@ApiParam(value = "account id") @PathParam("id") @NotNull Long id) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		log.warn("deprecated method called");
		log.debug("Requested account by id {}", id);
		
		Account account = accountService.getAccountById(id);
		log.debug("Returning account by id {} as {}", id, account);
		
		if(null != account) {
			return Response.status(Status.OK).entity(account).build();
		} else {
			return Response.status(Status.NOT_FOUND).build();
		}
	}
	
	@POST
	@Deprecated
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Persists the provided account", response = Account.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Account saved"),
	   })	
	public Response saveAccount(Account account) {
		log.warn("deprecated method called");
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName()); 
		log.debug("Requested account save: {}", account);
		
		Account savedAccount = accountService.save(account);
		log.debug("Saved account {}", savedAccount);
		
		return Response.status(Status.CREATED).entity(savedAccount).build();
	}

	@PUT
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Updates the provided account", response = Account.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 202, message = "Account updatedd"),
	   })	
	public Response updateAccount(Account account) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName()); 
		log.debug("Requested account save: {}", account);
		
		Account savedAccount = accountService.save(account);
		log.debug("Saved account {}", savedAccount);
		
		return Response.status(Status.ACCEPTED).entity(savedAccount).build();
	}
	
	
	@GET
	@Path("/{id}/locations")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the locations for provided account Id", response = Location.class, responseContainer = "List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Locations found"),
	     @ApiResponse(code = 404, message = "No such Account found")
	   })	
	public List<Location> getLocations(@ApiParam(value = "account id") @PathParam("id") @NotNull Long id) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName()); 
		if (null == user) throw new WebApplicationException(Response.Status.NOT_FOUND);
		
		log.debug("User {} requested locations", user.getId());			
		List <Location> locations = accountService.getVisibleLocations(user.getUserAccountId());
		if (user.getLocationRestrictionId() != null) {
			List<Long> ids = userService.getLocationLimits(user);
			List<Location> restricted = Lists.newArrayList();
			for (Location loc : locations) 	if (ids.contains(loc.getId())) restricted.add(loc);
			log.debug("Returning {} restricted locations for user id {}", restricted.size(), user.getId());	
			return restricted;
		}
		log.debug("Returning {} locations for account id {}", locations.size(), user.getUserAccountId());	
		return locations;
	}	

	@POST
	@Path("/{id}/location")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Saves the provided location", response = Location.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Location Saved"),
	     @ApiResponse(code = 404, message = "No such Account found")
	   })	
	public Response saveLocation(
			@ApiParam(value = "account id") @PathParam("id") @NotNull Long id,
			@ApiParam(value = "Location") @NotNull Location location) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName()); 
		
		Account account = accountService.getAccountById(id);
		if (null == account) return Response.status(Status.NOT_FOUND).build();
		if (null == location.getAccountId()) location.setAccountId(id);
		
		Location savedLocation = accountService.save(location);
		log.debug("Saved location with id {}", savedLocation.getId());
		if (account.getDefaultLocationId() == null) {
			account.setDefaultLocationId(savedLocation.getId());
			accountService.save(account);
		}
		return Response.status(Status.OK).entity(savedLocation).build();
	}	
	
	@GET
	@Path("/{id}/positions")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the account by provided Id", response = Position.class, responseContainer = "List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Positions Found"),
	     @ApiResponse(code = 404, message = "No such Account found")
	   })	
	public List<Position> getPositions(@ApiParam(value = "account id") @PathParam("id") @NotNull Long id) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName()); 
		if (null == user) throw new WebApplicationException(Response.Status.NOT_FOUND);
		log.debug("User {} requested positions", user.getId());				
		List <Position> positions = accountService.getActivePositions(user.getUserAccountId());
		log.debug("Returning {} positions for account id {}", positions.size(), user.getUserAccountId());
		return positions;
	}
	
	@POST
	@Path("/{id}/position")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Saves the provided position", response = Position.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Position Saved"),
	     @ApiResponse(code = 404, message = "No such Account found")
	   })	
	public Response savePosition(
			@ApiParam(value = "account id") @PathParam("id") @NotNull Long id,
			@ApiParam(value = "Position") @NotNull Position position) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName()); 
		
		Account account = accountService.getAccountById(id);
		if (null == account) return Response.status(Status.NOT_FOUND).build();
		if (null == position.getAccountId()) position.setAccountId(id);
		
		Position savedPosition = accountService.save(position);
		log.debug("Saved Position with ID {}", savedPosition.getId());
		if (account.getDefaultPositionId() == null) {
			account.setDefaultPositionId(savedPosition.getId());
			accountService.save(account);
		}
		return Response.status(Status.OK).entity(savedPosition).build();
	}
	
	@GET
	@Path("/{id}/assessments")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the assessments for provided accountId", response = AccountSurvey.class, responseContainer = "List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Assessments found"),
	     @ApiResponse(code = 404, message = "No such Account found")
	   })	
	public Response getAssessments(@ApiParam(value = "account id") @PathParam("id") @NotNull Long id) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName()); 
		log.debug("Requested assessments for account id {}", id);
		
		Account account = accountService.getAccountById(id);
		log.debug("Returning assessments for account id {}", id);
		
		if(null != account) {
			return Response.status(Status.OK).entity(account.getAccountSurveys()).build();
		} else {
			return Response.status(Status.NOT_FOUND).build();
		}
	}	
	
	@PUT
	@Path("/{id}/assessment")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Saves the provided assessment configuration", response = AccountSurvey.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Assessment Saved"),
	     @ApiResponse(code = 404, message = "No such Account found")
	   })	
	public Response saveAccountSurvey(
			@ApiParam(value = "account id") @PathParam("id") @NotNull Long id,
			@ApiParam(value = "Account Survey") @NotNull AccountSurvey accountSurvey) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName()); 
		
		Account account = accountService.getAccountById(id);
		if (null == account) return Response.status(Status.NOT_FOUND).build();
		if (null == accountSurvey.getAccountId()) accountSurvey.setAccountId(id);
		
		AccountSurvey savedAccountSurvey = accountSurveyService.save(accountSurvey);
		log.debug("Saved Account Survey with ASID {}", savedAccountSurvey.getId());
		if (account.getDefaultAsId() == null) {
			account.setDefaultAsId(accountSurvey.getId());
			accountService.save(account);
		}
		return Response.status(Status.OK).entity(savedAccountSurvey).build();
	}

	@GET
	@Path("/{id}/benchmarks")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the new or inprogress benchmarking for provided accountId", response = Benchmark.class, responseContainer = "List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Benchmarks found"),
	     @ApiResponse(code = 404, message = "No such Account found")
	   })	
	public Response getBenchmarks(@ApiParam(value = "account id") @PathParam("id") @NotNull Long id) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName()); 
		log.debug("Requested benchmarks for account id {}", id);	
		Account account = accountService.getAccountById(id);
		log.debug("Returning profiles for account id {}", id);
		
		if(null != account) {		
			return Response.status(Status.OK).entity(accountService.getBenchmarksByAccountId(id)).build();
		} else {
			return Response.status(Status.NOT_FOUND).build();
		}
	}
	
	@GET
	@Path("/{id}/profiles")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the profiles configured for provided accountId", response = ApplicantDataPoint.class, responseContainer = "List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Account found"),
	     @ApiResponse(code = 404, message = "No such Account found")
	   })	
	public Response getProfiles(@ApiParam(value = "account id") @PathParam("id") @NotNull Long id) {
		log.debug("Requested profiles for account id {}", id);
		Account account = accountService.getAccountById(id);

		if(null == account) {
			return Response.status(Status.NOT_FOUND).build();
		}
		
		List<String> labels = Arrays.asList("unscored", ProfileDefaults.PROFILE_A, ProfileDefaults.PROFILE_B,
				ProfileDefaults.PROFILE_C, ProfileDefaults.PROFILE_D);
		List<ApplicantDataPoint> dataset= new ArrayList<ApplicantDataPoint>();
		
		for (int i = 0; i < labels.size(); i++) {
			ApplicantDataPoint profileData = new ApplicantDataPoint();
			CustomProfile profile = account.getCustomProfile();
			profileData.series = labels.get(i);
			profileData.labels = new String[1];
			profileData.labels[0] = profile.getName(profileData.series);
			profileData.profileClass = profile.getCssClass(profileData.series);
			profileData.color = profile.getColor(profileData.series);
			profileData.highlight = profile.getHighlight(profileData.series);
			profileData.overlay = profile.getOverlay(profileData.series);
			profileData.profileIcon = profile.getIcon(profileData.series);
			dataset.add(profileData);
		}
		
		log.debug("Returning profiles for account id {}", id);
		return Response.status(Status.OK).entity(dataset).build();
	}	
}
