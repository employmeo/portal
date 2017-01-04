package com.talytica.portal.objects;

import java.sql.Date;

import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@ToString
@EqualsAndHashCode
@NoArgsConstructor
public class DashboardParams {

	public Long accountId;

	public Long locationId;

	public Long positionId;

	public Date fromdate;

	public Date todate;
	

}