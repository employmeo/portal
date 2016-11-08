package com.talytica.portal.resources;

import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.employmeo.objects.Respondant;
import com.employmeo.objects.User;
import com.employmeo.util.DBUtil;

import io.swagger.annotations.Api;

import java.util.List;

@Path("getlastten")
@Api( value="/getlastten", consumes=MediaType.APPLICATION_FORM_URLENCODED, produces=MediaType.APPLICATION_JSON)
public class GetLastTenRespondants {
	private static final Logger log = LoggerFactory.getLogger(GetLastTenRespondants.class);

	@POST
	@Produces(MediaType.APPLICATION_JSON)
	public Response doPost(
			@FormParam("account_id") Long accountId,
			@DefaultValue("-1") @FormParam("location_id") Long locationId,
			@DefaultValue("-1") @FormParam("position_id") Long positionId) {
		log.debug("Fetching last 10 respondants");
		
		JSONArray response = new JSONArray();

		String locationSQL = "";
		String positionSQL = "";
		if (locationId > -1)
			locationSQL = "AND r.respondantLocationId = :locationId ";
		if (positionId > -1)
			positionSQL = "AND r.respondantPositionId = :positionId ";

		EntityManager em = DBUtil.getEntityManager();
		String sql = "SELECT r from Respondant r WHERE "
				+ "r.respondantStatus >= :status AND r.respondantAccountId = :accountId " + locationSQL + positionSQL
				+ "ORDER BY r.respondantCreatedDate DESC";
		TypedQuery<Respondant> query = em.createQuery(sql, Respondant.class);
		query.setMaxResults(10);
		query.setParameter("accountId", accountId);
		if (locationId > -1)
			query.setParameter("locationId", locationId);
		if (positionId > -1)
			query.setParameter("positionId", positionId);
		query.setParameter("status", Respondant.STATUS_PREDICTED);

		List<Respondant> respondants = query.getResultList();
		for (int j = 0; j < respondants.size(); j++) {
			Respondant respondant = respondants.get(j);
			respondant.refreshMe();
			JSONObject jresp = respondant.getJSON();
			jresp.put("scores", respondant.getAssessmentScore());
			response.put(jresp);
		}
		
		return Response.status(Status.OK).entity(respondants).build();

	}

}