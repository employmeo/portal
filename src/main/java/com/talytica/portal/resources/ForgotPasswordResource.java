package com.talytica.portal.resources;

import javax.annotation.security.PermitAll;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.User;
import com.employmeo.data.service.UserService;
import com.talytica.portal.objects.ForgotPasswordRequest;
import com.talytica.portal.util.EmailUtility;

@Component
@PermitAll
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/forgotpassword")
@Api( value="/1/forgotpassword", consumes=MediaType.APPLICATION_FORM_URLENCODED)
public class ForgotPasswordResource {

	@Autowired
	UserService userService;
	
	private static final Logger log = LoggerFactory.getLogger(ForgotPasswordResource.class);
	
	@POST
	@PermitAll
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Sends password reset email to user")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "User Email Sent"),
	     @ApiResponse(code = 404, message = "User not found")
	   })
	public Response forgotPassword(@ApiParam(value = "User email") ForgotPasswordRequest fpr) {

		User user = userService.getUserByEmail(fpr.email);
		
		if (user != null) {
			EmailUtility.sendForgotPass(user);
			return Response.status(Status.OK).build();
		}
		
		return Response.status(Status.NOT_FOUND).build();
	}


}	