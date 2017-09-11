package com.talytica.portal.resources;

import javax.validation.constraints.NotNull;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Person;
import com.employmeo.data.service.PersonService;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Deprecated
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/person")
@Api( value="/1/person", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class PersonResource {

	@Autowired
	private PersonService personService;

	@GET
	@Deprecated
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the list of all Persons", response = Person.class, responseContainer = "List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Persons found"),
	     @ApiResponse(code = 404, message = "Persons not found")
	   })	
	public Iterable<Person> getAllPersons() {
		log.warn("Deprecated resource accessed");
		return personService.getAllPersons();
	}
	
	@GET
	@Deprecated
	@Path("/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the person by provided Id", response = Person.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Person found"),
	     @ApiResponse(code = 404, message = "No such Person found")
	   })	
	public Response getPerson(@ApiParam(value = "person id") @PathParam("id") @NotNull Long id) {
		log.warn("Deprecated resource accessed");
		log.debug("Requested person by id {}", id);
		
		Person person = personService.getPersonById(id);
		log.debug("Returning person by id {} as {}", id, person);
		
		if(null != person) {
			return Response.status(Status.OK).entity(person).build();
		} else {
			return Response.status(Status.NOT_FOUND).build();
		}
	}	
	
	@POST
	@Deprecated
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Persists the provided person", response = Person.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Person saved"),
	   })	
	public Response savePerson(Person person) {
		log.warn("Deprecated resource accessed");
		log.debug("Requested person save: {}", person);
		
		Person savedPerson = personService.save(person);
		log.debug("Saved person {}", savedPerson);
		
		return Response.status(Status.CREATED).entity(savedPerson).build();
	}		
}
