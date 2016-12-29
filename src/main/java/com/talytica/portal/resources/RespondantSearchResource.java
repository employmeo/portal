package com.talytica.portal.resources;

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
import com.talytica.portal.objects.RespondantSearchParams;

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
	@Consumes(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Searches for respondants", response = Respondant.class, responseContainer = "List")
	   @ApiResponses(value = {
			     @ApiResponse(code = 200, message = "Respondant found"),
			     @ApiResponse(code = 404, message = "No such Respondant found")
			   })	
	public Iterable<Respondant> searchRespondants(
			@ApiParam(value = "Search Object") RespondantSearchParams search){
		

		log.debug("Fetching respondants for search params {}", search);
		Timestamp from = new Timestamp(search.fromdate.getTime());
		Timestamp to = new Timestamp(search.todate.getTime() + ONE_DAY);
		Long locationId = null;
		if (search.locationId >= 1) locationId = search.locationId;
		Long positionId = null;
		if (search.positionId >= 1) positionId = search.positionId;		
		
		if ((search.pagenum > 0) && (search.pagesize > 0)) {
			return respondantService.getBySearchParams(search.accountId, search.statusLow, search.statusHigh, locationId, positionId, search.type, from, to, search.pagenum, search.pagesize);
		}
		
		return respondantService.getBySearchParams(search.accountId, search.statusLow, search.statusHigh, search.locationId, search.positionId, search.type, from, to);

	}
}
