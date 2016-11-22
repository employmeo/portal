package com.talytica.portal.resources;

import java.util.List;

import javax.validation.constraints.NotNull;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Grade;
import com.employmeo.data.model.Grader;
import com.employmeo.data.service.GraderService;

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
@Path("/1/grader")
@Api( value="/1/grader", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class GraderResource {
	
	@Autowired
	GraderService graderService;
	
	
	
	@GET
	@Path("/respondant/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets all of the graders for a respondant", response = Grader.class, responseContainer="List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Graders found")
	   })	
	public Response getGradersByRespondantId(@ApiParam(value = "respondant id") @PathParam("id") @NotNull Long respondantId) {
		log.debug("Requested graders by respondant id {}", respondantId);

		Page<Grader> graders = graderService.getGradersByUserId(respondantId);
		return Response.status(Status.OK).entity(graders).build();

	}	
	
	@GET
	@Path("/user/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets all of the graders for a respondant", response = Grader.class, responseContainer="List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Graders found")
	   })	
	public Response getGradersByUserId(@ApiParam(value = "user id") @PathParam("id") @NotNull Long userId) {
		log.debug("Requested graders by user id {}", userId);

		Page<Grader> graders = graderService.getGradersByUserId(userId);
		return Response.status(Status.OK).entity(graders).build();

	}	
	
	@GET
	@Path("/{id}/grade")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets all of the grades for grader", response = Grade.class, responseContainer="List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Grades found")
	   })	
	public Response getGradesByGraderId(@ApiParam(value = "user id") @PathParam("id") @NotNull Long graderId) {
		log.debug("Requested grades by grader id {}", graderId);

		List<Grade> grades = graderService.getGradesByGraderId(graderId);
		return Response.status(Status.OK).entity(grades).build();

	}
	
	
	@POST
	@Path("/grade")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Persists the provided grade", response = Grade.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Question saved"),
	   })	
	public Response saveQuestion(Grade grade) {
		log.debug("Requested question save: {}", grade);
		
		Grade savedGrade = graderService.saveGrade(grade);
		log.debug("Saved question {}", savedGrade);
		
		return Response.status(Status.CREATED).entity(savedGrade).build();
	}	

}
