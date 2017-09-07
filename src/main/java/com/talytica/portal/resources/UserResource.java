package com.talytica.portal.resources;

import javax.validation.constraints.NotNull;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.core.SecurityContext;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.stereotype.Component;
import com.employmeo.data.model.User;
import com.employmeo.data.service.UserService;


import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;


@Component
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/user")
@Api( value="/1/user", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class UserResource {
	private static final Logger log = LoggerFactory.getLogger(UserResource.class);
	@Context
	SecurityContext sc;

	@Autowired
	private UserService userService;

	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the current logged in User", response = User.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 202, message = "User found"),
	     @ApiResponse(code = 404, message = "Users not found")
	   })	
	public Response getCurrentUser() {
		
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());

		log.debug("Returning user as {}", user);
		
		if(null != user) {
			return Response.status(Status.ACCEPTED).entity(user).build();
		} else {
			return Response.status(Status.NOT_FOUND).build();
		}
	}	
	
	@GET
	@Path("/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the user by provided Id", response = User.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "User found"),
	     @ApiResponse(code = 404, message = "No such User found")
	   })	
	public Response getUser(@ApiParam(value = "user id") @PathParam("id") @NotNull Long id) {
		log.debug("Requested user by id {}", id);
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		User lookUpUser = userService.getUserById(id);
		log.debug("Returning user by id {} as {}", id, lookUpUser);
		
		if(null != lookUpUser) {
			return Response.status(Status.OK).entity(user).build();
		} else {
			return Response.status(Status.NOT_FOUND).build();
		}
	}	
	
	@POST
	@Deprecated
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Persists the provided user", response = User.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "User saved"),
	   })	
	public Response saveUser(User saveUser) {
		log.warn("deprecated resource accessed");
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		log.debug("Requested user save: {}", saveUser);
		
		User savedUser = userService.save(saveUser);
		log.debug("Saved user {}", savedUser);
		
		return Response.status(Status.CREATED).entity(savedUser).build();
	}
	
	@PUT
	@Deprecated
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Updates the provided user", response = User.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "User saved"),
	   })	
	public Response updateUser(User updateUser) {
		log.warn("deprecated resource accessed");
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		log.debug("Requested user save: {}", updateUser);
		
		User savedUser = userService.save(updateUser);
		log.debug("Saved user {}", savedUser);
		
		return Response.status(Status.CREATED).entity(savedUser).build();
	}
		
	
}
