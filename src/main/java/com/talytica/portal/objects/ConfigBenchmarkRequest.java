package com.talytica.portal.objects;

import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@NoArgsConstructor
@EqualsAndHashCode
@ToString
public class ConfigBenchmarkRequest {
	
	public int type;
	public int invited;
	public Iterable<BenchmarkEmployee> invitees;
	
}
