package com.talytica.portal;

import javax.annotation.PostConstruct;
import javax.ws.rs.ApplicationPath;
import javax.ws.rs.Path;
import javax.ws.rs.ext.Provider;

import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.server.filter.RolesAllowedDynamicFeature;
import org.glassfish.jersey.server.wadl.internal.WadlResource;
import org.reflections.Reflections;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.swagger.jaxrs.config.BeanConfig;
import io.swagger.jaxrs.listing.ApiListingResource;
import io.swagger.jaxrs.listing.SwaggerSerializers;


@Component
@ApplicationPath("${spring.jersey.application-path:/portal}")
public class PortalConfiguration extends ResourceConfig {
	private static final Logger log = LoggerFactory.getLogger(PortalConfiguration.class);

	 @Value("${spring.jersey.application-path:/portal}")
	 private String apiPath;

	public PortalConfiguration() {
        registerEndpoints();
        register(RolesAllowedDynamicFeature.class);
	}

	@PostConstruct
    public void init() {
		log.info("Initializing swagger");
        configureSwagger();
        log.info("Swagger initialized");
    }

	private void registerEndpoints() {

		//packages("com.talytica.portal.resources");
		scan("com.talytica.portal.resources");
		register(WadlResource.class);
	}

	/**
	 * Get around Jersey packaged jar scanning issue working with spring-boot.
	 * Issue: if using "java -jar" instead of "mvn springboot:run", Jersey is not able to scan packages
	 * since they're bundled in a jar. Scanning manually and registering Resources manually gets around that issue
	 * while allowing for running the deployment using "java -jar"
	 *
	 * @param packages
	 */
	public void scan(String... packages) {
	    for (String pack : packages) {
	        Reflections reflections = new Reflections(pack);
	        reflections.getTypesAnnotatedWith(Provider.class)
	                .parallelStream()
	                .forEach((clazz) -> {
	                    log.debug("New provider registered: " + clazz.getName());
	                    register(clazz);
	                });
	        reflections.getTypesAnnotatedWith(Path.class)
	                .parallelStream()
	                .forEach((clazz) -> {
	                    log.debug("New resource registered: " + clazz.getName());
	                    register(clazz);
	                });
	    }
	}

	private void configureSwagger() {
	     this.register(ApiListingResource.class);
	     this.register(SwaggerSerializers.class);

	     BeanConfig config = new BeanConfig();
	     config.setConfigId("com.talytica.portal");
	     config.setTitle("Talytica Customer Portal APIs");
	     config.setVersion("v1");
	     config.setContact("info@talytica.com");
	     config.setSchemes(new String[] { "http", "https" });
	     config.setBasePath(apiPath);
	     config.setResourcePackage("com.talytica.portal.resources");
	     config.setPrettyPrint(true);
	     config.setScan(true);
	   }
}
