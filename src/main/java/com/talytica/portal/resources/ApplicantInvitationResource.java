package com.talytica.portal.resources;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;

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

import com.employmeo.data.model.AccountSurvey;
import com.employmeo.data.model.Person;
import com.employmeo.data.model.Respondant;
import com.employmeo.data.model.User;
import com.employmeo.data.service.AccountService;
import com.employmeo.data.service.AccountSurveyService;
import com.employmeo.data.service.PersonService;
import com.employmeo.data.service.RespondantService;
import com.employmeo.data.service.UserService;
import com.talytica.common.service.EmailService;
import com.talytica.portal.objects.ApplicantInvitation;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

@Component
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/inviteapplicant")
@Api( value="/1/inviteapplicant", consumes=MediaType.APPLICATION_JSON, produces=MediaType.APPLICATION_JSON)
public class ApplicantInvitationResource {
	
	@Autowired
	private PersonService personService;
	@Autowired
	private AccountSurveyService accountSurveyService;
	@Autowired
	private AccountService accountService;
	@Autowired
	private RespondantService respondantService;
	@Autowired
	private EmailService emailService;
	@Autowired
	private UserService userService;
	@Context
	SecurityContext sc;	

	@POST
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Creates a new respondant for a specified assessment", response = Respondant.class)
	  @ApiResponses(value = {
      @ApiResponse(code = 201, message = "Respondant saved")})	
	public Response newRespondant(
				@Context final HttpServletRequest reqt,
			    @ApiParam("Assessment Order") ApplicantInvitation invitation) {
		// Collect expected input fields
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());

		AccountSurvey as = accountSurveyService.getAccountSurveyById(invitation.asid);
		
		// Perform business logic
		Person applicant = new Person();
		applicant.setEmail(invitation.email);
		applicant.setFirstName(invitation.firstName);
		applicant.setLastName(invitation.lastName);
		applicant.setAddress(invitation.address);
		applicant.setLatitude(invitation.lat);
		applicant.setLongitude(invitation.lng);
		Person savedApplicant = personService.save(applicant);
		
		Respondant respondant = new Respondant();
		respondant.setPerson(savedApplicant);
		respondant.setPersonId(savedApplicant.getId());
		respondant.setAccountId(as.getAccountId());
		respondant.setAccount(as.getAccount());
		respondant.setAccountSurvey(as);
		respondant.setAccountSurveyId(as.getId());
		if ((invitation.sample != null) && (invitation.sample)) {
			respondant.setType(Respondant.TYPE_SAMPLE); // allow for "sample" invites.
		}
		if ((invitation.notifyme != null) && (invitation.notifyme)) {
			respondant.setEmailRecipient(user.getEmail()); // send email notice
 		}
		
		respondant.setLocationId(as.getAccount().getDefaultLocationId());
		if (invitation.locationId != null) respondant.setLocationId(invitation.locationId);
		respondant.setLocation(accountService.getLocationById(respondant.getLocationId()));
		
		respondant.setPositionId(as.getAccount().getDefaultPositionId());
		if (invitation.positionId != null) respondant.setPositionId(invitation.positionId);
		respondant.setPosition(accountService.getPositionById(respondant.getPositionId()));

	    Respondant savedRespondant = respondantService.save(respondant);   
	    emailService.sendEmailInvitation(savedRespondant);
	    
	    return Response.status(Status.CREATED).entity(savedRespondant).build();
	}

	
	@POST
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@Path("/{id}/reminder")
	@ApiOperation(value = "sends an email reminder for a specified assessment")
	  @ApiResponses(value = {
      @ApiResponse(code = 200, message = "Reminder sent")})	
	public Response remindRespondant(@ApiParam("Respondant Id") @PathParam("id") Long respondantId) {
		// Collect expected input fields
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
	    Respondant respondant = respondantService.getRespondantById(respondantId);
	    if (respondant.getRespondantStatus() <= Respondant.STATUS_STARTED) {
	    	respondant.setRespondantStatus(Respondant.STATUS_REMINDED);
	    	respondantService.save(respondant);
	    }
    	emailService.sendEmailReminder(respondant);
	    return Response.status(Status.OK).build();
	}
	
}