package com.talytica.portal.resources;


import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

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

import org.apache.commons.math3.distribution.TDistribution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Account;
import com.employmeo.data.model.AccountSurvey;
import com.employmeo.data.model.Benchmark;
import com.employmeo.data.model.Corefactor;
import com.employmeo.data.model.Outcome;
import com.employmeo.data.model.Person;
import com.employmeo.data.model.Population;
import com.employmeo.data.model.PopulationScore;
import com.employmeo.data.model.PopulationScorePK;
import com.employmeo.data.model.Position;
import com.employmeo.data.model.Respondant;
import com.employmeo.data.model.RespondantScore;
import com.employmeo.data.model.Survey;
import com.employmeo.data.model.User;
import com.employmeo.data.service.AccountService;
import com.employmeo.data.service.AccountSurveyService;
import com.employmeo.data.service.CorefactorService;
import com.employmeo.data.service.PersonService;
import com.employmeo.data.service.PopulationService;
import com.employmeo.data.service.RespondantService;
import com.employmeo.data.service.SurveyService;
import com.employmeo.data.service.UserService;
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

	private static final Long TOPPERFORMERTARGET = 4l; // for now.
	private static final Long GETSHIREDTARGET = 1l; // for now.

	
	@Value("benchmark.htm")
	private String SIMPLE_VIEW; 
	@Value("topperformer.htm")
	private String TOP_PERFORMER_VIEW; 
	@Value("4701d03f-ee00-4c13-86a6-3b26107e0b05")
	private String BENCHMARK_EMAIL_TEMPLATE_ID;
	
	@Context
	SecurityContext sc;
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
	@Autowired
	UserService userService;
	// Put these elsewhere...
	@Autowired
	CorefactorService corefactorService;
	@Autowired
	PopulationService populationService;

	
	@GET
	@Path("/{id}/options")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the list of assessments that an account can chose from", response = Survey.class, responseContainer = "List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Assessment Options found"),
	     @ApiResponse(code = 404, message = "No such Account found")
	   })	
	public Response getAssessmentOptions(@ApiParam(value = "account id") @PathParam("id") @NotNull Long accountId) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		log.debug("Requested assessment options for account id {}", accountId);
		Account account = accountService.getAccountById(accountId);
		if(null != account) {
			return Response.status(Status.OK).entity(surveyService.getAllAvailableSurveys(account.getAccountType())).build();
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
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
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
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		Benchmark benchmark = accountService.getBenchmarkById(benchmarkId);
		log.debug("fetched benchmark {} by id {}",benchmark, benchmarkId);
		Account account = accountService.getAccountById(benchmark.getAccountId());
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
			//List<Respondant> respondants = new ArrayList<Respondant>();
			//process the upload list.
			int counter=0;
			for (BenchmarkEmployee emp : request.invitees) {
				if(emp.email == null) continue;
				Person person = new Person();
				person.setEmail(emp.email);
				person.setFirstName(emp.firstName);
				person.setLastName(emp.lastName);
				Person savedPerson = personService.save(person);
				Respondant bmr = new Respondant();
				bmr.setAccount(account);
				bmr.setAccountId(account.getId());
				bmr.setAccountSurvey(savedAccountSurvey);
				bmr.setAccountSurveyId(savedAccountSurvey.getId());
				bmr.setBenchmarkId(benchmark.getId());
				bmr.setPerson(savedPerson);
				bmr.setPersonId(savedPerson.getId());
				bmr.setPosition(position);
				bmr.setPositionId(position.getId());
				bmr.setRespondantStatus(Respondant.STATUS_CREATED);
				bmr.setType(Respondant.TYPE_BENCHMARK);
				Respondant respondant = respondantService.save(bmr);
				//respondants.add(respondant);
				counter++;
				respondantService.addOutcomeToRespondant(respondant, GETSHIREDTARGET, true);				
				if (emp.topPerformer != null && emp.topPerformer)
					respondantService.addOutcomeToRespondant(respondant, TOPPERFORMERTARGET, true);
			}
			benchmark.setInvited(counter);
			//benchmark.setInvited(respondants.size());
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
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
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

	// Logically, this needs to move to integration app at some point.
	
	@GET
	@Path("/{id}/complete")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Completes Benchmarking Process", response = Benchmark.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Benchmark Sent"),
	     @ApiResponse(code = 400, message = "Error Setting Up Benchmark")})
	public Response completeBenchmark(@ApiParam("benchmark id") @PathParam("id") Long benchmarkId) {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		Benchmark benchmark = accountService.getBenchmarkById(benchmarkId);

		Set<Respondant> respondants = respondantService.getCompletedForBenchmarkId(benchmark.getId());
		
		HashMap<String, Population> populations = new HashMap<String, Population>();
		HashMap<Population, Set<Respondant>> populationSets = new HashMap<Population, Set<Respondant>>();
		for (Population pop : benchmark.getPopulations()) { // in case of a redo.
			populations.put(pop.getName(),pop);
			populationSets.put(pop, new HashSet<Respondant>());
		}
		
		for (Respondant respondant : respondants) {
			Set<Outcome> outcomes = respondantService.getOutcomesForRespondant(respondant.getId());
			for (Outcome outcome : outcomes) {
				String popName = outcome.getPredictionTarget().getLabel();
				if (!outcome.getValue()) popName+= " (false)";
				Population population = populations.get(popName);
				if (population == null) {
					population = new Population();
					if (!outcome.getValue()) { // if negative - e.g. not top performer
						population.setProfile("profile_c");
					} else if (outcome.getPredictionTarget().getPredictionTargetId() != 1) {
						population.setProfile("profile_a"); // top performer
					} else {
						population.setProfile("profile_b"); // avg performer
					}
					population.setTargetId(outcome.getPredictionTarget().getPredictionTargetId());
					population.setTarget(outcome.getPredictionTarget());
					population.setTargetValue(outcome.getValue());
					population.setBenchmark(benchmark);
					population.setBenchmarkId(benchmarkId);
					population.setName(popName);
					populations.put(popName, population);
					Set<Respondant> set = new HashSet<Respondant>();
					populationSets.put(population, set);
					log.debug("New Population {} ", popName);
				}
				populationSets.get(population).add(respondant);
			}
		}
		
		for (Map.Entry<Population, Set<Respondant>> pair : populationSets.entrySet()) {			 
			HashMap<Long, List<Double>> scoresByCorefactor = new HashMap<Long, List<Double>>();
			log.debug("Population {} has {} members", pair.getKey().getName(),pair.getValue().size());
			pair.getKey().setSize(pair.getValue().size());
			if (pair.getValue().size() < 3) continue; // not enough to create a population
			Population population = populationService.save(pair.getKey());
			for (Respondant respondant : pair.getValue()) {
				for (RespondantScore rs : respondant.getRespondantScores()) {
					if (!scoresByCorefactor.containsKey(rs.getId().getCorefactorId())) {
						List<Double> scores = new ArrayList<Double>();
						scoresByCorefactor.put(rs.getId().getCorefactorId(),scores);
					}
					scoresByCorefactor.get(rs.getId().getCorefactorId()).add(rs.getValue());
				}
			}
			
			for (Map.Entry<Long, List<Double>> cfSet : scoresByCorefactor.entrySet()) {
				Corefactor cf = corefactorService.findCorefactorById(cfSet.getKey());
				List<Double> set = cfSet.getValue();
				log.debug("{} has {} scores", cf.getName(), set.size());
				PopulationScore ps = new PopulationScore();
				PopulationScorePK pspk = new PopulationScorePK();
				pspk.setPopulationId(population.getId());
				pspk.setCorefactorId(cf.getId());
				ps.setId(pspk);
				ps.setCorefactor(cf);
				ps.setPopulation(population);
				ps.setCount(set.size());
				ps.setMean(average(set));
				ps.setDeviation(deviation(set, ps.getMean()));
				Double tval = Math.abs(ps.getMean() - cf.getMeanScore()) / (ps.getDeviation()/Math.sqrt(set.size()));
				TDistribution tdist = new TDistribution(ps.getCount() - 1);
				ps.setSignificance(2*tdist.cumulativeProbability(tval)-1.0d);
				population.getPopulationScores().add(populationService.save(ps));
			}
			log.debug("created {} scores for {}", population.getPopulationScores().size(), population.getName());
		}
		benchmark.setStatus(Benchmark.STATUS_COMPLETED);
		benchmark.setParticipantCount(respondants.size());		
		benchmark.setCompletedDate(new Date());		
		Benchmark savedBenchmark = accountService.save(benchmark);
		return Response.status(Status.CREATED).entity(savedBenchmark).build();		
	}
		
	private Double average(List<Double> set) {
		Double sum = 0d;
		for (Double val : set) {sum += val;}
		if (!set.isEmpty()) return sum/set.size();
		return sum;
	}
	
	private Double deviation(List<Double> set, Double mean) {
		Double sum = 0d;
		for (Double val : set) {sum += Math.pow((val - mean),2);}
		if (!set.isEmpty()) return Math.sqrt(sum/set.size());
		return sum;
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
		accountSurvey.setInviteTemplateId(BENCHMARK_EMAIL_TEMPLATE_ID);
		accountSurvey.setBenchmarkId(benchmark.getId());
		accountSurvey.setType(AccountSurvey.TYPE_BENCHMARK);
		
		return accountSurvey;
	}
	
}
