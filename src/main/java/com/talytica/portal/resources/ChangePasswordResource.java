package com.talytica.portal.resources;

import javax.annotation.security.PermitAll;

import javax.ws.rs.Consumes;

import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import javax.ws.rs.core.Response.Status;

import com.employmeo.data.model.Respondant;
import com.employmeo.data.model.User;
import com.employmeo.data.service.UserService;
import com.talytica.portal.PortalPasswordEncoder;
import com.talytica.portal.objects.PasswordChangeRequest;
import com.talytica.portal.service.PortalUserDetailsService;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/changepass")
@Api( value="/1/changepass", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class ChangePasswordResource {

	private static final Logger log = LoggerFactory.getLogger(ChangePasswordResource.class);
	
	@Context
	SecurityContext sc;
	
	@Autowired
	PortalUserDetailsService userCredentialService;

	@Autowired
	UserService userService;
	
	@POST
	@PermitAll
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Creates a new respondant for a specified assessment", response = Respondant.class)
	  @ApiResponses(value = {@ApiResponse(code = 202, message = "Password Changed"),
			  				@ApiResponse(code = 304, message = "Password Not Changed")})
	public Response changePassword(@ApiParam("Password Change Request") PasswordChangeRequest pcr) {
		log.debug("Change Password Requested {}", pcr);
		String username =sc.getUserPrincipal().getName();		
		
		if (pcr.confirmpass != pcr.newpass) {
			log.debug("new passwords don't match!");
			return Response.status(Status.NOT_MODIFIED).entity("New passwords don't match!").build();
		}
		
		if (!username.equalsIgnoreCase(pcr.email)) {
			return Response.status(Status.NOT_MODIFIED).entity("Cant change password for this user").build();
		}
		
		User user = userService.getUserByEmail(pcr.email);
		PortalPasswordEncoder encoder = new PortalPasswordEncoder();
		
		if (((pcr.password != null) && encoder.matches(pcr.password,user.getPassword()))
				|| 	(pcr.hashword.equals(user.getPassword()))) {
			user.setPassword(pcr.newpass);
			User savedUser = userService.save(user);
			return Response.status(Status.CREATED).entity(savedUser).build();
		}

		return Response.status(Status.NOT_MODIFIED).entity("Password already reset, or password doesn't match").build();
	}
}	