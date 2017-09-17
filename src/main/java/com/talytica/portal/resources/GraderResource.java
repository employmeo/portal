package com.talytica.portal.resources;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import javax.validation.constraints.NotNull;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import javax.ws.rs.core.Response.Status;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.*;
import com.employmeo.data.service.GraderService;
import com.employmeo.data.service.PersonService;
import com.employmeo.data.service.QuestionService;
import com.employmeo.data.service.RespondantService;
import com.employmeo.data.service.UserService;
import com.talytica.common.service.EmailService;
import com.talytica.portal.objects.GraderParams;
import com.talytica.portal.objects.NewGraderRequest;

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
	@Autowired
	RespondantService respondantService;
	@Autowired
	PersonService personService;
	@Autowired
	EmailService emailService;
	@Autowired
	UserService userService;
	@Autowired
	QuestionService questionService;
	@Context
	SecurityContext sc;

	//private static final long ONE_DAY = 24*60*60*1000; // one day in milliseconds to add to the "to-date"


	@GET
	@Path("/respondant/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets array of the graders for a Respondant", response = Grader.class, responseContainer="List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Graders found")
	   })
	public Response getGradersByRespondantId(@ApiParam(value = "respondant id") @PathParam("id") @NotNull Long respondantId) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
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
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
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
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
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
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		log.debug("Requested grades by grader id {}", graderId);

		List<Grade> grades = graderService.getGradesByGraderId(graderId);
		return Response.status(Status.OK).entity(grades).build();

	}

	@GET
	@Path("/{questionId}/criteria")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets a list of the criteria (questions) for a gradable question", response = Question.class, responseContainer="List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Criteria found")
	   })
	public Response getCriteriaByQuestionId(@ApiParam(value = "question id") @PathParam("questionId") @NotNull Long questionId) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		log.debug("Requested criteria by question id {}", questionId);
		List<Question> questions = graderService.getCriteriaByQuestionId(questionId);
		return Response.status(Status.OK).entity(questions).build();
	}

	@GET
	@Path("/{id}/allcriteria")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets a list of all criteria (questions) for a summary grader", response = Question.class, responseContainer="List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Criteria found")
	   })
	public Response getCriteriaByGraderId(@ApiParam(value = "grader id") @PathParam("id") @NotNull Long graderId) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		List<Question> questions = graderService.getSummaryCriteriaByGraderId(graderId);
		log.debug("Requested {} criteria by grader id {}", questions.size(), graderId);
		return Response.status(Status.OK).entity(questions).build();
	}
	
	@GET
	@Path("/{id}/allresponses")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets a list of all responses for a summary grader respondant", response = com.employmeo.data.model.Response.class, responseContainer="List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Responses found")
	   })
	public Response getResponsesByGraderId(@ApiParam(value = "respondant id") @PathParam("id") @NotNull Long respondantId) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		Set<com.employmeo.data.model.Response> responses = respondantService.getGradeableResponses(respondantId);
		log.debug("Requested {} criteria by grader id {}", responses.size(),respondantId);
		return Response.status(Status.OK).entity(responses).build();
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
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		log.debug("Requested grade save: {}", grade);
		Grade savedGrade = graderService.saveGrade(grade);
		log.debug("Saved grade {}", savedGrade);

		return Response.status(Status.CREATED).entity(savedGrade).build();
	}

	@POST
	@Path("/newgrader")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Adds a new grader to respondant", response = Grader.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Grader Saved")
	   })
	public Grader saveNewGrader(@ApiParam(value = "grader", type="NewGraderRequest") NewGraderRequest ngr) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		log.debug("Requested new grader: {}", ngr);

		Question question = questionService.getQuestionById(ngr.getQuestionId());
		Respondant respondant = respondantService.getRespondantById(ngr.getRespondantId());
		Person person = new Person();
		person.setFirstName(ngr.getFirstName());
		person.setLastName(ngr.getLastName());
		person.setEmail(ngr.getEmail());
		Person savedPerson = personService.save(person);
		Grader grader = new Grader();
		grader.setAccount(user.getAccount());
		grader.setAccountId(user.getUserAccountId());
		grader.setPerson(savedPerson);
		grader.setPersonId(savedPerson.getId());
		grader.setQuestionId(ngr.getQuestionId());
		grader.setRespondantId(ngr.getRespondantId());
		grader.setQuestion(question);
		grader.setRespondant(respondant);
		grader.setStatus(Grader.STATUS_NEW);
		grader.setType(Grader.TYPE_PERSON);
		Grader savedGrader = graderService.save(grader);
		log.debug("Saved grade {}", savedGrader);
		emailService.sendGraderRequest(savedGrader);
		if (respondant.getRespondantStatus() == Respondant.STATUS_INSUFFICIENT_GRADERS) {
			respondant.setRespondantStatus(Respondant.STATUS_UNGRADED);
			respondantService.save(respondant);
		} else if (respondant.getRespondantStatus() == Respondant.STATUS_INSUFFICIENT_ADVGRADERS) {
			respondant.setRespondantStatus(Respondant.STATUS_ADVUNGRADED);
			respondantService.save(respondant);
		}
		return savedGrader;
		
	}
	
	@POST
	@Path("/wavemin/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Waves the minimum grader requirement for a respondant")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "waved")
	   })
	public void waveMinimum(@ApiParam(value = "respondantId") @PathParam("id") Long id) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		Respondant respondant = respondantService.getRespondantById(id);
		respondant.setWaveGraderMin(true);
		respondantService.save(respondant);
		return;
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
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
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
	@Path("/{id}/remind")
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Updates the status of specified grader", response = Grader.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 202, message = "Status update accepted"),
	   })
	public Grader remindGrader(@ApiParam(value = "grader id") @PathParam("id") Long graderId) {
		log.debug("Requested remind grader id: {}", graderId);
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		Grader grader = graderService.getGraderById(graderId);
		if (grader != null) {
			if (grader.getType() == Grader.TYPE_PERSON) {
				emailService.sendReferenceRequestReminder(grader);
			} else {
				emailService.sendGraderReminder(grader);
			}
			grader.setStatus(Grader.STATUS_REMINDED);
			Grader savedGrader = graderService.save(grader);
			log.debug("Saved grader {}", savedGrader);
			return savedGrader;
		} else {
			return null;
		}
	}
	
	@POST
	@Path("/{id}/ignore")
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Updates the status of specified grader", response = Grader.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 202, message = "Status update accepted"),
	   })
	public Grader ignoreGrader(@ApiParam(value = "grader id") @PathParam("id") Long graderId) {
		log.debug("Requested remind grader id: {}", graderId);
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		Grader grader = graderService.getGraderById(graderId);
		if (grader != null) {
			grader.setStatus(Grader.STATUS_IGNORED);
			Grader savedGrader = graderService.save(grader);
			log.debug("Saved grader {}", savedGrader);
			return savedGrader;
		} else {
			return null;
		}
	}
	
	@POST
	@Path("/search")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets paged-results of the graders for a User", response = Grader.class, responseContainer="Page")
	   @ApiResponses(value = {@ApiResponse(code = 200, message = "Graders found")})
	public Response searchGraders(@ApiParam(value = "Grader Search Params") @NotNull GraderParams params) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		log.debug("Requested graders by params {}", params);
		Page<Grader> graders = graderService.getGradersByUserIdStatusAndDates(params.userId, params.status, params.getFromdate(), params.getTodate());
		log.debug("Verbose listing of graders page: {}", graders.getContent());
		return Response.status(Status.OK).entity(graders).build();
	}


}
