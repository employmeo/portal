package com.talytica.portal.objects;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

import lombok.Data;
import lombok.NonNull;

@Data
public class GraderParams {
	private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");

	public Long userId;

	public List<Integer> status;

	public String fromdate;

	public String todate;

	public Date getFromdate() {
		return (null != fromdate) ? getParsedDate(fromdate) : null;
	}

	public Date getTodate() {
		return (null != todate) ? getInclusiveDate(getParsedDate(todate)) : null;
	}

	private Date getParsedDate(@NonNull String dateStr) {
		Date date = null;
		try {
			date = sdf.parse(dateStr);
		} catch (ParseException e) {
		}
		return date;
	}

	private Date getInclusiveDate(Date nonInclusiveDate) {
		Calendar cal = Calendar.getInstance();
		cal.setTime(nonInclusiveDate);
		cal.set(Calendar.HOUR_OF_DAY, 23);
		cal.set(Calendar.MINUTE, 59);
		cal.set(Calendar.SECOND, 59);
		Date inclusiveDate = cal.getTime();
		return inclusiveDate;
	}
}