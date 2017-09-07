package com.talytica.portal.resources;

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

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Respondant;
import com.employmeo.data.model.RespondantNVP;
import com.employmeo.data.model.User;
import com.employmeo.data.service.RespondantService;
import com.employmeo.data.service.UserService;

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

	@Autowired
	private RespondantService respondantService;
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

}
