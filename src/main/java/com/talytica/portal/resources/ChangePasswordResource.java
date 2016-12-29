package com.talytica.portal.resources;

import javax.annotation.security.PermitAll;

import javax.ws.rs.Consumes;

import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
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
@PermitAll
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/changepass")
@Api( value="/1/changepass", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class ChangePasswordResource {

	private static final Logger log = LoggerFactory.getLogger(ChangePasswordResource.class);
	
	
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
			  				@ApiResponse(code = 403, message = "Password Not Changed")})
	public Response changePassword(@ApiParam("Password Change Request") PasswordChangeRequest pcr) {
		log.debug("Change Password Requested {}", pcr);	
		
		if ((pcr.confirmpass == null) || (!pcr.confirmpass.equals(pcr.newpass))) {
			log.debug("new passwords don't match! {} {}",pcr.newpass, pcr.confirmpass);
			return Response.status(Status.FORBIDDEN).entity("New passwords don't match!").build();
		}

		User user = userService.getUserByEmail(pcr.email);

		boolean match = false;
		if (pcr.hashword != null) match = user.getPassword().equals(pcr.hashword);
		
		PortalPasswordEncoder encoder = new PortalPasswordEncoder();
		if (pcr.password != null) match = encoder.matches(pcr.password, user.getPassword());
		
		if (!match) {
			return Response.status(Status.FORBIDDEN).entity("Cant change password for this user").build();
		}
				
		user.setPassword(encoder.encode(pcr.newpass));
		User savedUser = userService.save(user);
		return Response.status(Status.CREATED).entity(savedUser).build();
	}
}