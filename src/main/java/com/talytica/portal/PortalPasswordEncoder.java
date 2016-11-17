package com.talytica.portal;

import java.security.MessageDigest;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.security.crypto.password.PasswordEncoder;

public class PortalPasswordEncoder implements PasswordEncoder {

	public static final long AUTH_FAILED = -1;
	private static int PASSWORD_LENGTH = 10;
	private static String PASSWORD_LETTERS = "0123456789abcdefghijklmnopABCDEFGHIJKLMNOPQRSTUVWXYZ";
	private static Random rnd = new Random();	
	
	@Override
	public String encode(CharSequence rawPass) {
		StringBuffer sb = new StringBuffer();
		try {
			MessageDigest md = MessageDigest.getInstance("SHA-256");
			md.update( rawPass.toString().getBytes() );
			byte byteData[] = md.digest();

			// convert the byte to hex format method 1
			for (int i = 0; i < byteData.length; i++) {
				sb.append(Integer.toString((byteData[i] & 0xff) + 0x100, 16).substring(1));
			}
		} catch (Exception e) {
			e.printStackTrace(System.out);
		}
		return sb.toString();
	}

	@Override
	public boolean matches(CharSequence rawPass, String encodedPass) {
		
		return (encodedPass.equals(encode(rawPass)));
	}
	
	public String randomPass() {
		StringBuilder sb = new StringBuilder(PASSWORD_LENGTH);
		for (int i = 0; i < PASSWORD_LENGTH; i++) sb.append(PASSWORD_LETTERS.charAt(rnd.nextInt(PASSWORD_LETTERS.length())));	
		return sb.toString();
	}
	
	public String randomEncodedPass() {		
		String rawPass = randomPass();
		return (encode(rawPass));
	}
	
}