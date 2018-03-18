package com.talytica.portal.resources;

import java.sql.Timestamp;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import javax.validation.constraints.NotNull;
import javax.ws.rs.Consumes;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import javax.ws.rs.core.Response.Status;

import jersey.repackaged.com.google.common.collect.Lists;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Respondant;
import com.employmeo.data.model.RespondantNVP;
import com.employmeo.data.model.SendGridEmailEvent;
import com.employmeo.data.model.User;
import com.employmeo.data.service.PersonService;
import com.employmeo.data.service.RespondantService;
import com.employmeo.data.service.UserService;
import com.talytica.portal.objects.RespondantSearchParams;

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
@Path("/1/respondant")
@Api( value="/1/respondant", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class RespondantResource {
	
	private static final long ONE_DAY = 24*60*60*1000; // one day in milliseconds
	
	@Autowired
	private RespondantService respondantService;
	@Autowired
	private PersonService personService;
	@Autowired
	private UserService userService;
	@Context
	SecurityContext sc;

	@GET
	@Path("/{uuid}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the respondant by provided Id", response = Respondant.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Respondant found"),
	     @ApiResponse(code = 404, message = "No such Respondant found")
	   })	
	public Response getRespondant(@ApiParam(value = "respondant uuid") @PathParam("uuid") @NotNull UUID uuid) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		log.debug("Requested respondant by uuid {}", uuid);
		
		Respondant respondant = respondantService.getRespondant(uuid);
		log.debug("Returning respondant by uuid {} as {}", uuid, respondant);
		
		if(null != respondant) {
			return Response.status(Status.OK).entity(respondant).build();
		} else {
			return Response.status(Status.NOT_FOUND).build();
		}
	}	
	
	@GET
	@Path("/{id}/displaynvps")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the respondant by provided Id", response = RespondantNVP.class, responseContainer="list")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Respondant found"),
	     @ApiResponse(code = 404, message = "No such Respondant found")
	   })	
	public Response getRespondantNVPs(@ApiParam(value = "respondant id") @PathParam("id") @NotNull Long id) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		log.debug("Requested respondant by id {}", id);
		Set<RespondantNVP> nvps = respondantService.getDisplayNVPsForRespondant(id);
		log.debug("Returning nvps {} for respondant {}", nvps, id);
		return Response.status(Status.OK).entity(nvps).build();
	}	
	
	@GET
	@Path("/bybenchmark/{benchmarkId}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the list of respondants for provided benchmarktId", response = Respondant.class, responseContainer = "List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Benchmarks found"),
	     @ApiResponse(code = 404, message = "No such Account found")
	   })	
	public Response getBenchmarkRespondants(@ApiParam(value = "benchmark id") @PathParam("benchmarkId") @NotNull Long benchmarkId) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		log.debug("Requested benchmark respondants for benchmark id {}", benchmarkId);		

		return Response.status(Status.OK).entity(respondantService.getByBenchmarkId(benchmarkId)).build();
		
	}	
	
	@POST
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Persists the provided respondant", response = Respondant.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Respondant saved"),
	   })	
	public Response saveRespondant(Respondant respondant) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		log.debug("Requested respondant save: {}", respondant);
		
		Respondant savedRespondant = respondantService.save(respondant);
		log.debug("Saved respondant {}", savedRespondant);
		
		return Response.status(Status.CREATED).entity(savedRespondant).build();
	}

	@POST
	@Path("/search")
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Searches for respondants", response = Respondant.class, responseContainer = "List")
	   @ApiResponses(value = {
			     @ApiResponse(code = 200, message = "Respondant found"),
			     @ApiResponse(code = 404, message = "No such Respondant found")
			   })	
	public Iterable<Respondant> searchRespondants(
			@ApiParam(value = "Search Object", type="RespondantSearchParams") RespondantSearchParams search){
		
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		log.debug("Fetching respondants for search params {}", search);
		Timestamp from = new Timestamp(search.fromdate.getTime());
		Timestamp to = new Timestamp(search.todate.getTime() + ONE_DAY);
		List<Long> locationIds = Lists.newArrayList();
		if (search.locationId >= 1) { 
			locationIds.add(search.locationId);
		} else {
			if (user.getLocationRestrictionId() != null) locationIds = userService.getLocationLimits(user);
		}
		Long positionId = null;
		if (search.positionId >= 1) positionId = search.positionId;	
		
		if ((search.pagenum > 0) && (search.pagesize > 0)) {
			return respondantService.getBySearchParams(search.accountId, search.statusLow, search.statusHigh, locationIds, positionId, search.type, from, to, search.pagenum, search.pagesize);
		}
		
		return respondantService.getBySearchParams(search.accountId, search.statusLow, search.statusHigh, locationIds, search.positionId, search.type, from, to);

	}
	
	@GET
	@Path("/personemailhistory/{personId}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Searches for respondants", response = Respondant.class, responseContainer = "List")
	   @ApiResponses(value = {
			     @ApiResponse(code = 200, message = "Respondant found"),
			     @ApiResponse(code = 404, message = "No such Respondant found")
			   })	
	public Iterable<SendGridEmailEvent> getPersonEmailHistory(
			@PathParam(value = "personId") String personId){
		
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		log.debug("Fetching email history for personId {}", personId);

		return personService.getPersonEmailEvents(personId);
	}
	
	@GET
	@Path("/emailhistory/{email}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Searches for respondants", response = Respondant.class, responseContainer = "List")
	   @ApiResponses(value = {
			     @ApiResponse(code = 200, message = "Respondant found"),
			     @ApiResponse(code = 404, message = "No such Respondant found")
			   })	
	public Iterable<SendGridEmailEvent> getEmailHistory(
			@PathParam(value = "email") String email){
		
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		log.debug("Fetching email history for email {}", email);

		return personService.getEmailEvents(email);
	}
}
