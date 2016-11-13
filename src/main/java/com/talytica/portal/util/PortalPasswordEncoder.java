package com.talytica.portal.util;

import java.security.MessageDigest;

import org.springframework.security.crypto.password.PasswordEncoder;

public class PortalPasswordEncoder implements PasswordEncoder {

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
		// TODO Auto-generated method stub
		
		return (encodedPass.equals(encode(rawPass)));
	}
	
}