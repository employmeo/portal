package com.talytica.portal.resources;

import java.util.*;

import javax.validation.constraints.NotNull;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.*;
import com.employmeo.data.service.GraderService;
import com.talytica.portal.objects.GraderParams;

import io.swagger.annotations.*;
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

	//private static final long ONE_DAY = 24*60*60*1000; // one day in milliseconds to add to the "to-date"


	@GET
	@Path("/respondant/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets array of the graders for a Respondant", response = Grader.class, responseContainer="List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Graders found")
	   })
	public Response getGradersByRespondantId(@ApiParam(value = "respondant id") @PathParam("id") @NotNull Long respondantId) {
		log.debug("Requested graders by respondant id {}", respondantId);

		List<Grader> graders = graderService.getGradersByRespondantId(respondantId);
		return Response.status(Status.OK).entity(graders).build();

	}

	@GET
	@Path("/respondant/{id}/grades")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets array of the grades for a Respondant", response = Grade.class, responseContainer="List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Graders found")
	   })
	public Response getGradesForRespondantId(@ApiParam(value = "respondant id") @PathParam("id") @NotNull Long respondantId) {
		log.debug("Requested grades by respondant id {}", respondantId);

		List<Grader> graders = graderService.getGradersByRespondantId(respondantId);
		List<Grade> grades = new ArrayList<>();

		for (Grader grader : graders) {
		    grades.addAll(graderService.getGradesByGraderId(grader.getId()));
		}
		return Response.status(Status.OK).entity(grades).build();
	}


	@GET
	@Path("/user/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets paged-results of the graders for a User", response = Grader.class, responseContainer="Page")
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
	@ApiOperation(value = "Gets list of the grades for grader", response = Grade.class, responseContainer="List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Grades found")
	   })
	public Response getGradesByGraderId(@ApiParam(value = "user id") @PathParam("id") @NotNull Long graderId) {
		log.debug("Requested grades by grader id {}", graderId);

		List<Grade> grades = graderService.getGradesByGraderId(graderId);
		return Response.status(Status.OK).entity(grades).build();

	}

	@GET
	@Path("/{id}/criteria")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets a list the criteria (questions) for a graded question", response = Question.class, responseContainer="List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Criteria found")
	   })
	public Response getCriteriaByGraderId(@ApiParam(value = "user id") @PathParam("id") @NotNull Long questionId) {
		log.debug("Requested grades by grader id {}", questionId);

		List<Question> questions = graderService.getCriteriaByQuestionId(questionId);
		return Response.status(Status.OK).entity(questions).build();

	}

	@POST
	@Path("/grade")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Persists the provided grade", response = Grade.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Grade Saved"),
	   })
	public Response saveQuestion(@ApiParam(value = "grade") Grade grade) {
		log.debug("Requested grade save: {}", grade);

		Grade savedGrade = graderService.saveGrade(grade);
		log.debug("Saved grade {}", savedGrade);

		return Response.status(Status.CREATED).entity(savedGrade).build();
	}

	@POST
	@Path("/{id}/status")
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Updates the status of specified grader", response = Grader.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 202, message = "Status update accepted"),
	   })
	public Response updateGrader(@ApiParam(value = "grader id") @PathParam("id") Long graderId,
			@ApiParam(value = "status code") @FormParam (value="status") int statusCode) {
		log.debug("Requested grader id: {} status update to {}", graderId, statusCode);
		Grader grader = graderService.getGraderById(graderId);
		if (grader != null) {
			grader.setStatus(statusCode);
			Grader savedGrader = graderService.save(grader);
			log.debug("Saved grader {}", savedGrader);
			return Response.status(Status.CREATED).entity(savedGrader).build();
		} else {
			return Response.status(Status.NOT_FOUND).build();
		}
	}

	@POST
	@Path("/search")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets paged-results of the graders for a User", response = Grader.class, responseContainer="Page")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Graders found")
	   })
	public Response searchGraders(@ApiParam(value = "Grader Search Params") @NotNull GraderParams params) {
		log.debug("Requested graders by params {}", params);
		Date newToDate = getInclusiveDate(params.getTodate());
		Page<Grader> graders = graderService.getGradersByUserIdStatusAndDates(params.userId, params.status, params.fromdate, newToDate);
		return Response.status(Status.OK).entity(graders).build();
	}

	private Date getInclusiveDate(Date nonInclusiveDate) {
		Calendar cal = Calendar.getInstance();
		cal.setTime(nonInclusiveDate);
		cal.set(Calendar.HOUR_OF_DAY, 23);
		cal.set(Calendar.MINUTE, 59);
		cal.set(Calendar.SECOND, 59);
		Date inclusiveDate = cal.getTime();
		return inclusiveDate;
	}
}
