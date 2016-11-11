package com.talytica.portal.resources;

import javax.annotation.security.PermitAll;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;

import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import org.json.JSONObject;

import com.employmeo.data.model.User;
import com.talytica.portal.PortalAutoLoginFilter;
import com.talytica.portal.util.SecurityUtil;

import io.swagger.annotations.Api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Path("changepass")
@Api( value="/changepass", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class ChangePassword {

	private static final Logger log = LoggerFactory.getLogger(ChangePassword.class);
	
	@POST
	@PermitAll
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	public String doMethod(@Context final HttpServletRequest reqt, String json) {
		log.debug("Change Password Requested");
		try {
			JSONObject jUser = new JSONObject(json);
			User user = null;
			if (jUser.has("hash")) {
				user = SecurityUtil.loginHashword(jUser.getString("email"), jUser.getString("hash"));
			} else if (jUser.has("password")) {
				user = SecurityUtil.login(jUser.getString("email"), jUser.getString("password"));			
			}
	
			if (user != null) {

				String pass = jUser.getString("newpass");
				user.setPassword(SecurityUtil.hashPassword(pass));

				PortalAutoLoginFilter.login(user, reqt);
				json = null;
			}
		} catch (Exception e) {
			log.warn("Failed to reset password: " + e.getMessage());
		}
		return json;
	}


}	