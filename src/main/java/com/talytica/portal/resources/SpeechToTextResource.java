package com.talytica.portal.resources;

import javax.websocket.server.PathParam;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Response;
import com.employmeo.data.model.User;
import com.employmeo.data.repository.ResponseRepository;
import com.talytica.common.service.SpeechToTextService;

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
@Path("/1/speechtotext")
@Api(value="/1/speechtotext", produces=MediaType.APPLICATION_JSON)

public class SpeechToTextResource {
	@Autowired
	ResponseRepository responseRepository;
	
	@Autowired
	SpeechToTextService speechToTextService;
	
	@GET
	@Deprecated
	@Path("/{id}")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "requests google speech to text translation of response", response = Response.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Response Translated"),
	   })	
	public Response speechToText(@ApiParam(value = "response id") @PathParam("id") Long responseId) {
		log.warn("Deprecated Resource accessed");
		log.debug("Requested response to translate: {}", responseId);
		Response response = responseRepository.findOne(responseId);
		
		String transcript = speechToTextService.translateWav(response.getResponseMedia());
		if (null != transcript) {
			log.debug("Translated to {}", transcript);
			response.setResponseText(transcript);
			return responseRepository.save(response);
		}
		
		return response;
	}	
}
