package com.talytica.portal.objects;

import org.springframework.beans.factory.annotation.Value;

public class PublicKeys {
	
	@Value("${com.talytica.apis.stripe.public.key:null}")
	String stripe;
	
	@Value("${com.talytica.apis.googlemaps:null}")
	String googleMaps;
}
