package com.talytica.portal.resources;


import java.util.ArrayList;
import java.util.List;
import java.util.Set;

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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Account;
import com.employmeo.data.model.AccountSurvey;
import com.employmeo.data.model.Benchmark;
import com.employmeo.data.model.Person;
import com.employmeo.data.model.Position;
import com.employmeo.data.model.Respondant;
import com.employmeo.data.model.Survey;

import com.employmeo.data.service.AccountService;
import com.employmeo.data.service.AccountSurveyService;
import com.employmeo.data.service.PersonService;
import com.employmeo.data.service.RespondantService;
import com.employmeo.data.service.SurveyService;
import com.talytica.common.service.EmailService;
import com.talytica.common.service.ExternalLinksService;
import com.talytica.portal.objects.BenchmarkEmployee;
import com.talytica.portal.objects.ConfigBenchmarkRequest;
import com.talytica.portal.objects.NewBenchmarkRequest;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

@Component
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/benchmarkwizard")
@Api( value="/1/benchmarkwizard", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class BenchmarkWizardResource {
	private static final Logger log = LoggerFactory.getLogger(BenchmarkWizardResource.class);
	
	private static final String DEFAULT_PREAMBLE = 
			"<h4>Employee Assessment Calibration</h4><p><strong>IMPORTANT:</strong> This questionnaire may see if you gave " +
	        "<span style='text-decoration: underline; color: #ff0000;'><strong>HONEST</strong></span> answers. " +
			"So make sure all your answers are <span style='text-decoration: underline;color: #ff0000;'><strong>" +
	        "HONEST</strong></span>.</p><p>If there is anything that might affect you answering the questionnaires, " + 
			"then you should not start answering the questionnaires.</p><h4>Agreement</h4><p>Participating in " +
	        "this calibration &ndash; by you clicking &ldquo;I Agree&rdquo; button, below &ndash; you agree you are " +
			"able to complete the questionnaire(s) honestly and to the best of your ability. Your company will use " +
			"the results from this process in its future recruiting, and assumes all responsibility for the application of " +
			"those results</p><p>If you agree to participate, then please click &ldquo;I Agree&rdquo; button, below:</p>";
	private static final String DEFAULT_THANKYOU = 
			"<h4>THANK YOU</h4><p>Thank you for completing the calibration. Please click the &ldquo;Submit&rdquo; button, " +
	        "below.</p><p>If requested to confirm your participation, you can provide this code: [CONFIRMATION_CODE].</p>";
	
	private static final String SIMPLE_VIEW = "benchmark.htm"; 
	private static final String TOP_PERFORMER_VIEW = "benchmark.htm"; 
	

	@Autowired
	AccountService accountService;
	
	@Autowired
	AccountSurveyService accountSurveyService;

	@Autowired
	EmailService emailService;
	
	@Autowired
	ExternalLinksService externalLinksService;

	@Autowired
	PersonService personService;
		
	@Autowired
	RespondantService respondantService;

	@Autowired
	SurveyService surveyService;

	@GET
	@Path("/{id}/options")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the list of assessments that an account can chose from", response = Survey.class, responseContainer = "List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Assessment Options found"),
	     @ApiResponse(code = 404, message = "No such Account found")
	   })	
	public Response getAssessmentOptions(@ApiParam(value = "account id") @PathParam("id") @NotNull Long accountId) {
		log.debug("Requested assessment options for account id {}", accountId);
		Account account = accountService.getAccountById(accountId);
		if(null != account) {
			return Response.status(Status.OK).entity(surveyService.getAllAvailableSurveys(500)).build();
		} else {
			return Response.status(Status.NOT_FOUND).build();
		}
	}
	
	@POST
	@Path("/start")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Creates a new position benchmarking", response = Benchmark.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Benchmark Created"),
	     @ApiResponse(code = 400, message = "Error Creating Benchmark")})
	public Response newBenchmark(@ApiParam("New Benchmark Request") NewBenchmarkRequest request) {
		Account account = accountService.getAccountById(request.accountId);
		Survey survey = surveyService.getSurveyById(request.surveyId);
		log.info("New Benchmark Request for position {} in account {}", account.getAccountName(), request.positionName);
		
		Position position = new Position();
		position.setAccount(account);
		position.setAccountId(account.getId());
		position.setPositionName(request.positionName);
		position.setDescription(request.description);
		Position savedPosition = accountService.save(position);

		Benchmark benchmark = new Benchmark();
		benchmark.setAccountId(account.getId());
		benchmark.setSurveyId(survey.getId());
		benchmark.setPositionId(savedPosition.getId());
		benchmark.setPosition(savedPosition);
		benchmark.setStatus(Benchmark.STATUS_NEW);
		Benchmark savedBenchmark = accountService.save(benchmark);
		
		return Response.status(Status.CREATED).entity(savedBenchmark).build();
	}

	@POST
	@Path("/{id}/setup")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Sets the type of benchmarking", response = Benchmark.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Benchmark Set Up"),
	     @ApiResponse(code = 400, message = "Error Setting Up Benchmark")})
	public Response chooseBenchmarkType(
			@ApiParam("benchmark id") @PathParam("id") Long benchmarkId,
			@ApiParam("Benchmark config") ConfigBenchmarkRequest request) {
		
		Benchmark benchmark = accountService.getBenchmarkById(benchmarkId);
		log.debug("fetched benchmark {} by id {}",benchmark, benchmarkId);
		benchmark.setType(request.type);
		benchmark.setStatus(Benchmark.STATUS_UNSENT);
		Position position = benchmark.getPosition();
		
		AccountSurvey accountSurvey = accountSurveyFromBenchmark(benchmark);		
		accountSurvey.setOverRideDisplayName(position.getPositionName() + " - Employee Benchmark");
		accountSurvey.setStaticLinkView(SIMPLE_VIEW);
		AccountSurvey savedAccountSurvey = accountSurveyService.save(accountSurvey);
		savedAccountSurvey.setPermalink(externalLinksService.getAssessmentLink(savedAccountSurvey));
		accountSurveyService.save(savedAccountSurvey); //tedious.
		benchmark.getAccountSurveys().add(savedAccountSurvey);
		
		if (request.type == Benchmark.TYPE_PERFORMANCE) {
			AccountSurvey performerSurvey = accountSurveyFromBenchmark(benchmark);		
			performerSurvey.setOverRideDisplayName(position.getPositionName() + " - Top Performer Benchmark");
			performerSurvey.setStaticLinkView(TOP_PERFORMER_VIEW);
			AccountSurvey savedPerformerSurvey = accountSurveyService.save(performerSurvey);
			savedPerformerSurvey.setPermalink(externalLinksService.getAssessmentLink(savedPerformerSurvey));
			accountSurveyService.save(savedPerformerSurvey); //tedious.
			benchmark.getAccountSurveys().add(savedPerformerSurvey);
		}
		if (request.type == Benchmark.TYPE_DETAILED) {
			List<Respondant> respondants = new ArrayList<Respondant>();
			//process the upload list.
			for (BenchmarkEmployee emp : request.invitees) {
				if(emp.email == null) continue;
				Account account = accountService.getAccountById(benchmark.getAccountId());
				Person person = new Person();
				person.setEmail(emp.email);
				person.setFirstName(emp.firstName);
				person.setLastName(emp.lastName);
				Person savedPerson = personService.save(person);
				Respondant bm = new Respondant();
				bm.setAccount(account);
				bm.setAccountId(account.getId());
				bm.setAccountSurvey(savedAccountSurvey);
				bm.setAccountSurveyId(savedAccountSurvey.getId());
				bm.setBenchmarkId(benchmark.getId());
				bm.setPerson(savedPerson);
				bm.setPersonId(savedPerson.getId());
				bm.setPosition(position);
				bm.setPositionId(position.getId());
				bm.setRespondantStatus(Respondant.STATUS_CREATED);
				bm.setType(Respondant.TYPE_BENCHMARK);
				respondants.add(respondantService.save(bm));
				if (emp.topPerformer) {
					//save outcome = top performer?
				}
			}
			benchmark.setInvited(respondants.size());
		}
		Benchmark savedBenchmark = accountService.save(benchmark);
		return Response.status(Status.CREATED).entity(savedBenchmark).build();		
	}

	@POST
	@Path("/{id}/send")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "sends out benchmarking requests to employees", response = Benchmark.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Benchmark Sent"),
	     @ApiResponse(code = 400, message = "Error Setting Up Benchmark")})
	public Response sendBenchmark(
			@ApiParam("benchmark id") @PathParam("id") Long benchmarkId,
			@ApiParam("Benchmark config") ConfigBenchmarkRequest request) {
		Benchmark benchmark = accountService.getBenchmarkById(benchmarkId);
		if (benchmark.getType() == Benchmark.TYPE_DETAILED) {
			Set<Respondant> respondants = respondantService.getByBenchmarkId(benchmark.getId());
			for (Respondant respondant : respondants) {
				if (respondant.getRespondantStatus() > Respondant.STATUS_CREATED) continue;
				emailService.sendEmailInvitation(respondant);
				respondant.setRespondantStatus(Respondant.STATUS_INVITED);
				respondantService.save(respondant);
			}
		} else {
			benchmark.setInvited(request.invited);
		}
		
		benchmark.setStatus(Benchmark.STATUS_SENT);		
		Benchmark savedBenchmark = accountService.save(benchmark);
		Account account = accountService.getAccountById(benchmark.getAccountId());
		if (account.getAccountStatus() == Account.STATUS_NEW) {
			account.setAccountStatus(Account.STATUS_BENCHMARKING);
			accountService.save(account);
		}
		return Response.status(Status.CREATED).entity(savedBenchmark).build();		
	}
	
	private AccountSurvey accountSurveyFromBenchmark(Benchmark benchmark) {

		Account account = accountService.getAccountById(benchmark.getAccountId());
		Survey survey = surveyService.getSurveyById(benchmark.getSurveyId());
		
		AccountSurvey accountSurvey = new AccountSurvey();
		accountSurvey.setAccount(account);
		accountSurvey.setAccountId(account.getId());
		accountSurvey.setSurveyId(survey.getId());
		accountSurvey.setSurvey(survey);
		accountSurvey.setPreambleText(DEFAULT_PREAMBLE);
		accountSurvey.setThankyouText(DEFAULT_THANKYOU);
		accountSurvey.setBenchmarkId(benchmark.getId());
		accountSurvey.setType(AccountSurvey.TYPE_BENCHMARK);
		
		return accountSurvey;
	}
	
}
