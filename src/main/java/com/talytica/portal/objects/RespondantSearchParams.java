package com.talytica.portal.objects;

import java.util.Date;

import org.springframework.beans.factory.annotation.Value;

public class RespondantSearchParams {

	@Value("-1")
	public int statusLow;

	@Value("99")
	public int statusHigh;

	public Long accountId;

	public Long locationId;

	public Long positionId;
	
	@Value("1")
	public int type;

	public Date fromdate;

	public Date todate;
	
	public int pagenum;
	
	public int pagesize;
	
}