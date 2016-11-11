package com.talytica.portal.resources;

import javax.annotation.security.PermitAll;
import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.MediaType;


import io.swagger.annotations.Api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.employmeo.data.model.User;
import com.employmeo.data.service.UserService;
import com.talytica.portal.util.EmailUtility;

@Path("forgotpassword")
@Api( value="/forgotpassword", consumes=MediaType.APPLICATION_FORM_URLENCODED)
public class ForgotPassword {

	@Autowired
	UserService userService;
	
	private static final Logger log = LoggerFactory.getLogger(ForgotPassword.class);
	
	@POST
	@PermitAll
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	public void doMethod(@FormParam("email") String email) {

		User user = userService.getUserById(1l);
		
		if (user != null) {
			EmailUtility.sendForgotPass(user);
		}
		
		return;
	}


}	