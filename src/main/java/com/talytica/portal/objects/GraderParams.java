package com.talytica.portal.objects;

import java.sql.Date;
import java.util.List;
import lombok.ToString;

@ToString
public class GraderParams {

	public Long userId;
	
	public List<Integer> status;

	public Date fromdate;

	public Date todate;
	

}