package com.talytica.portal.objects;

import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@ToString
@EqualsAndHashCode
@NoArgsConstructor
public class ApplicantDataPoint {

	public String series;
	public String color;
	public String overlay;
	public String highlight;
	public String profileClass;
	public String profileIcon;
	public int[] data;
	public String[] labels;
	
}
