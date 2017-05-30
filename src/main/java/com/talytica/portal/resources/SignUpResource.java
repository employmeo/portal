package com.talytica.portal.resources;

import javax.ws.rs.Consumes;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.employmeo.data.model.Account;
import com.employmeo.data.model.AccountSurvey;
import com.employmeo.data.model.Benchmark;
import com.employmeo.data.model.Location;
import com.employmeo.data.model.Position;
import com.employmeo.data.model.Survey;
import com.employmeo.data.model.User;
import com.employmeo.data.service.AccountService;
import com.employmeo.data.service.AccountSurveyService;
import com.employmeo.data.service.SurveyService;
import com.employmeo.data.service.UserService;
import com.talytica.common.service.EmailService;
import com.talytica.common.service.ExternalLinksService;
import com.talytica.portal.PortalPasswordEncoder;
import com.talytica.portal.objects.SignUpRequest;

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
@Path("/signup")
@Api( value="/signup", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class SignUpResource {
	
	private static final int DEFAULT_ACCOUNT_TYPE = Account.TYPE_TRIAL_SMB;
	private static final int DEFAULT_ACCOUNT_STATUS = Account.STATUS_NEW;
	private static final String DEFAULT_ADDRESS = "Main Location";
	private static final String DEFAULT_POSITION = "Employee";
	private static final String POSITION_DESCRIPTION = "Employee - Please update position details in account settings.";
	private static final int DEFAULT_USER_STATUS = 1;

	private static final String DEFAULT_PREAMBLE = 
			"<h4>Employee Assessment</h4><p><strong>IMPORTANT:</strong> This questionnaire may see if you gave " +
	        "<span style='text-decoration: underline; color: #ff0000;'><strong>HONEST</strong></span> answers. " +
			"So make sure all your answers are <span style='text-decoration: underline;color: #ff0000;'><strong>" +
	        "HONEST</strong></span>.</p><p>If there is anything that might affect you answering the questionnaires, " + 
			"then you should not start answering the questionnaires.</p><h4>Agreement</h4><p>Participating in " +
	        "this calibration &ndash; by you clicking &ldquo;I Agree&rdquo; button, below &ndash; you agree you are " +
			"able to complete the questionnaire(s) honestly and to the best of your ability. The employer will use " +
			"the results from this process in recruiting decisions, and assumes all responsibility for the application of " +
			"those results</p><p>If you agree to participate, then please click &ldquo;I Agree&rdquo; button, below:</p>";
	private static final String DEFAULT_THANKYOU = 
			"<h4>THANK YOU</h4><p>Thank you for completing the assessment. Please click the &ldquo;Submit&rdquo; button, " +
	        "below.</p><p>If requested to confirm your participation, you can provide this code: [CONFIRMATION_CODE].</p>";
	
	private static final String DEFAULT_STATIC_VIEW = "newresp.htm";
	private static final Response USER_EXISTS = Response.status(Status.CONFLICT).entity("User already exists.").build();
	private static final Response ACCOUNT_EXISTS = Response.status(Status.CONFLICT).entity("Account with that name already exists.").build();
	
	@Autowired
	UserService userService;

	@Autowired
	AccountService accountService;
	
	@Autowired
	AccountSurveyService accountSurveyService;
	
	@Autowired
	EmailService emailService;
	
	@Autowired
	SurveyService surveyService;
	
	@Autowired
	ExternalLinksService externalLinksService; 
		
	@POST
	@Path("/withbm")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@Transactional
	@ApiOperation(value = "Signs Up a New company / user", response = User.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Account and User Created"),
	     @ApiResponse(code = 409, message = "Conflict - User or Account Exists")
	   })
	public Response signUpBM(SignUpRequest request) {
		
		log.info("New Benchmark Sign Up Request for {} by {}", request.accountName, request.email);
		
		User user = userService.getUserByEmail(request.email);
		log.debug("Looked for {} and found {}", request.email, user);
		if (user != null) return USER_EXISTS;
		
		Account account = accountService.getAccountByName(request.accountName);
		log.debug("Looked for {} and found {}", request.accountName, account);
		if (account != null) return ACCOUNT_EXISTS;
		
		account = new Account();
		account.setAccountName(request.accountName);
		account.setAccountStatus(DEFAULT_ACCOUNT_STATUS);
		account.setAccountType(DEFAULT_ACCOUNT_TYPE);
		Account savedAccount = accountService.save(account);
		
		Location defaultLocation = new Location();
		defaultLocation.setAccount(savedAccount);
		defaultLocation.setAccountId(savedAccount.getId());
		defaultLocation.setStreet1(request.address);
		defaultLocation.setLocationName(request.address);
		defaultLocation.setLatitude(request.lat);
		defaultLocation.setLongitude(request.lng);
		Location savedLocation = accountService.save(defaultLocation);

		savedAccount.setDefaultLocationId(savedLocation.getId());
		Account updatedAccount = accountService.save(savedAccount);
		
		user = new User();
		user.setAccount(updatedAccount);
		user.setUserAccountId(updatedAccount.getId());
		user.setEmail(request.email);
		
		String[] names = request.fullName.split("\\s+");
		user.setFirstName(names[0]);
		user.setLastName("");
		if (names.length > 1) user.setLastName(names[1]);
		
		user.setUserStatus(DEFAULT_USER_STATUS);
		user.setUserType(User.TYPE_BASIC);
		
		PortalPasswordEncoder ppe = new PortalPasswordEncoder();
		user.setPassword(ppe.randomEncodedPass());
		
		User savedUser = userService.save(user);
		savedUser.setAccount(updatedAccount);
		log.debug("Created new account {} for user {}", savedAccount, savedUser);

		emailService.sendVerifyAccount(savedUser);
		
		return Response.status(Status.CREATED).entity(savedUser).build();
	}

	@POST
	@Path("/smb")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@Transactional
	@ApiOperation(value = "Signs Up a New company with only email", response = User.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Account and User Created"),
	     @ApiResponse(code = 409, message = "Conflict - User or Account Exists")
	   })
	public Response signUpSMB(SignUpRequest request) {
		
		log.info("New SMB Sign Up Request by {}", request.email);
		User user = userService.getUserByEmail(request.email);
		log.debug("Looked for {} and found {}", request.email, user);
		if (user != null) return USER_EXISTS;
		
		Account account = accountService.getAccountByName(request.email);
		log.debug("Looked for {} and found {}", request.email, account);
		if (account != null) return ACCOUNT_EXISTS;
		
		account = new Account();
		account.setAccountName(request.email);
		account.setAccountStatus(DEFAULT_ACCOUNT_STATUS);
		account.setAccountType(DEFAULT_ACCOUNT_TYPE);
		Account savedAccount = accountService.save(account);
		
		Location defaultLocation = new Location();
		defaultLocation.setAccount(savedAccount);
		defaultLocation.setAccountId(savedAccount.getId());
		defaultLocation.setStreet1(DEFAULT_ADDRESS);
		Location savedLocation = accountService.save(defaultLocation);

		Position defaultPosition = new Position();
		defaultPosition.setAccount(savedAccount);
		defaultPosition.setAccountId(savedAccount.getId());
		defaultPosition.setPositionName(DEFAULT_POSITION);
		defaultPosition.setDescription(POSITION_DESCRIPTION);
		Position savedPosition = accountService.save(defaultPosition);
		
		savedAccount.setDefaultLocationId(savedLocation.getId());
		savedAccount.setDefaultPositionId(savedPosition.getId());
		Account updatedAccount = accountService.save(savedAccount);
		
		user = new User();
		user.setAccount(updatedAccount);
		user.setUserAccountId(updatedAccount.getId());
		user.setEmail(request.email);
		String[] names = request.email.split("[@._]");
		user.setFirstName(names[0]);
		user.setLastName("");
		if (names.length > 1) user.setLastName(names[1]);
		
		user.setUserStatus(DEFAULT_USER_STATUS);
		user.setUserType(User.TYPE_BASIC);
		
		PortalPasswordEncoder ppe = new PortalPasswordEncoder();
		user.setPassword(ppe.randomEncodedPass());
		
		User savedUser = userService.save(user);
		savedUser.setAccount(updatedAccount);
		log.debug("Created new account {} for user {}", savedAccount, savedUser);

		emailService.sendVerifyAccount(savedUser);
		
		return Response.status(Status.CREATED).entity(savedUser).build();
	}
	
	@POST
	@Path("/{id}/configure")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@Transactional
	@ApiOperation(value = "Configures an SMB account to use a default survey", response = Account.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 202, message = "Account Configured"),
	     @ApiResponse(code = 400, message = "Some error occured")
	   })
	public Response configureSMB(@ApiParam(value="Account Id", name="id") @PathParam("id") Long accountId,
			SignUpRequest request) {
		Account account = accountService.getAccountById(accountId);

		Survey survey = surveyService.getSurveyById(request.surveyId);
		
		AccountSurvey accountSurvey = new AccountSurvey();
		accountSurvey.setAccount(account);
		accountSurvey.setAccountId(account.getId());
		accountSurvey.setSurveyId(survey.getId());
		accountSurvey.setSurvey(survey);
		accountSurvey.setPreambleText(DEFAULT_PREAMBLE);
		accountSurvey.setThankyouText(DEFAULT_THANKYOU);
		accountSurvey.setType(AccountSurvey.TYPE_APPLICANT);
		accountSurvey.setStaticLinkView(DEFAULT_STATIC_VIEW);
		AccountSurvey savedSurvey = accountSurveyService.save(accountSurvey);
		savedSurvey.setPermalink(externalLinksService.getAssessmentLink(savedSurvey));
		accountSurveyService.save(savedSurvey);
		Account savedAccount = accountService.save(account);
		
		return Response.status(Status.ACCEPTED).entity(savedAccount).build();
	}

}
