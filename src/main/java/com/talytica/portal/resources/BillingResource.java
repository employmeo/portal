package com.talytica.portal.resources;

import java.util.List;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.SecurityContext;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Account;
import com.employmeo.data.service.UserService;
import com.stripe.model.Card;
import com.stripe.model.Customer;
import com.stripe.model.Invoice;
import com.talytica.common.service.BillingService;
import com.employmeo.data.model.User;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import jersey.repackaged.com.google.common.collect.Lists;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/billing")
@Api( value="/1/billing", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class BillingResource {
	@Autowired
	private UserService userService;
	@Autowired
	private BillingService billingService;
	@Context
	SecurityContext sc;
	
	@GET
	@Path("/stripe")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the stripe details for an account", response = Customer.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Accounts found"),
	     @ApiResponse(code = 404, message = "Accounts not found")
	   })	
	public Customer getStripeAccount() throws Exception {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		Account account = user.getAccount();
		Customer customer = billingService.getStripeCustomer(account);
		log.debug("Got {} for user {}", customer, user);
		return customer;
	}
	
	@POST
	@Path("/addpayment/{stripeToken}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the stripe details for an account", response = Customer.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Accounts found"),
	     @ApiResponse(code = 404, message = "Accounts not found")
	   })	
	public Customer savePaymentCard(@ApiParam("Stripe Payment Token") @PathParam(value="stripeToken") String stripeToken) throws Exception {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		Account account = user.getAccount();
		Card card = billingService.addCardToCustomer(stripeToken, account);
		log.debug("Created card {} for user {}", card, user);
		return billingService.getStripeCustomer(account);
	}
	
	@GET
	@Path("/nextinvoice")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the upcoming invoice for an account", response = Invoice.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Invoices found"),
	     @ApiResponse(code = 404, message = "Account not found")
	   })	
	public Invoice getNextInvoice() throws Exception {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		Account account = user.getAccount();
		return billingService.getCustomerNextInvoice(account.getStripeId());
	}
	
	@GET
	@Path("/invoicehistory")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the non-zero invoice history for an account", response = Invoice.class, responseContainer="list")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Invoices found"),
	     @ApiResponse(code = 404, message = "Account not found")
	   })	
	public List<Invoice> getInvoiceHistory() throws Exception {
		User user = userService.getUserByEmail(sc.getUserPrincipal().getName());
		Account account = user.getAccount();
		List<Invoice> allInvoices = billingService.getCustomerInvoices(account.getStripeId());
		List<Invoice> invoices = Lists.newArrayList();
		for (Invoice invoice : allInvoices) if (invoice.getTotal() > 0)	invoices.add(invoice);
		log.debug("Returning {} of {} total invoices",invoices.size(),allInvoices.size());
		return invoices;
	}
}
