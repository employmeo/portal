package com.talytica.portal.objects;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import lombok.ToString;

@Data
@ToString
@EqualsAndHashCode
@NoArgsConstructor
public class NewGraderRequest {

	@NonNull String firstName;
	String lastName;
	@NonNull String email;
	@NonNull Long respondantId;

}