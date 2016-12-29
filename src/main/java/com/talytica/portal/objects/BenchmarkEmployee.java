package com.talytica.portal.objects;

import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@NoArgsConstructor
@EqualsAndHashCode
@ToString
public class BenchmarkEmployee {
	public String firstName;
	public String lastName;
	public String email;
	public Boolean topPerformer;
}
