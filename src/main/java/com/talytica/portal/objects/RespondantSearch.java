package com.talytica.portal.objects;

import org.springframework.beans.factory.annotation.Value;

public class RespondantSearch {

	@Value("-1")
	public int statusLow;

	@Value("99")
	public int statusHigh;

	public Long accountId;

	public Long locationId;

	public Long positionId;

	@Value("2015-01-01")
	public String fromDate;

	@Value ("2020-12-31")
	public String toDate;
	
}