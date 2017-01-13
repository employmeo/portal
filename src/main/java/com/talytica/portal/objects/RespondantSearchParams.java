package com.talytica.portal.objects;

import java.util.Date;

import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@ToString
@EqualsAndHashCode
@NoArgsConstructor
public class RespondantSearchParams {

	public int statusLow = -1;

	public int statusHigh = 99;

	public Long accountId;

	public Long locationId;

	public Long positionId;

	public int type = 1;

	public Date fromdate;

	public Date todate;
	
	public int pagenum;
	
	public int pagesize;
	
}