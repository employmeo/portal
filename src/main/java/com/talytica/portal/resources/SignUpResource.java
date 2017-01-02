package com.talytica.portal.resources;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Account;
import com.employmeo.data.model.Location;
import com.employmeo.data.model.User;
import com.employmeo.data.service.AccountService;
import com.employmeo.data.service.AccountSurveyService;
import com.employmeo.data.service.UserService;
import com.talytica.common.service.EmailService;
import com.talytica.portal.PortalPasswordEncoder;
import com.talytica.portal.objects.SignUpRequest;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

@Component
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/signup")
@Api( value="/1/signup", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class SignUpResource {
	private static final Logger log = LoggerFactory.getLogger(SignUpResource.class);
	private static final int DEFAULT_ACCOUNT_TYPE = Account.TYPE_TRIAL_SMB;
	private static final int DEFAULT_ACCOUNT_STATUS = Account.STATUS_NEW;
	private static final int DEFAULT_USER_TYPE = 1;
	private static final int DEFAULT_USER_STATUS = 1;

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
		
	@POST
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Signs Up a New company / user", response = User.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Account and User Created"),
	     @ApiResponse(code = 409, message = "Conflict - User or Account Exists")
	   })
	
	public Response signUp(SignUpRequest request) {
		
		log.info("New Sign Up Request for {} by {}", request.accountName, request.email);
		
		User user = userService.getUserByEmail(request.email);
		log.info("Looked for {} and found {}", request.email, user);
		if (user != null) return USER_EXISTS;
		
		Account account = accountService.getAccountByName(request.accountName);
		log.info("Looked for {} and found {}", request.accountName, account);
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
		user.setUserType(DEFAULT_USER_TYPE);
		
		PortalPasswordEncoder ppe = new PortalPasswordEncoder();
		user.setPassword(ppe.randomEncodedPass());
		
		User savedUser = userService.save(user);
		savedUser.setAccount(updatedAccount);
		log.debug("Created new account {} for user {}", savedAccount, savedUser);

		emailService.sendVerifyAccount(savedUser);
		
		return Response.status(Status.CREATED).entity(savedUser).build();
	}
}
