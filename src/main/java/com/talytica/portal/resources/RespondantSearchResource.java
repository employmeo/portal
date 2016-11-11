package com.talytica.portal.resources;

import java.sql.Date;
import java.sql.Timestamp;

import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Respondant;
import com.employmeo.data.service.RespondantService;
import com.talytica.portal.objects.RespondantSearch;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

@Component
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/respondantsearch")
@Api( value="/1/respondantsearch", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class RespondantSearchResource {
	private static final Logger log = LoggerFactory.getLogger(RespondantResource.class);
	private static final long ONE_DAY = 24*60*60*1000; // one day in milliseconds

	@Autowired
	private RespondantService respondantService;
	
	@POST	
	@Produces(MediaType.APPLICATION_JSON)
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@ApiOperation(value = "Searches for respondants", response = Respondant.class, responseContainer = "List")
	   @ApiResponses(value = {
			     @ApiResponse(code = 200, message = "Respondant found"),
			     @ApiResponse(code = 404, message = "No such Respondant found")
			   })	
	public Iterable<Respondant> searchRespondants(
			@ApiParam(value = "Search Object") RespondantSearch search){

		log.debug("Fetching respondants");
		Timestamp from = new Timestamp(Date.valueOf(search.fromDate).getTime());
		Timestamp to = new Timestamp(Date.valueOf(search.toDate).getTime() + ONE_DAY);
		
		return respondantService.getBySearchParams(search.accountId, search.statusLow, search.statusHigh, search.locationId, search.positionId, from, to);
		

	}
}
