package com.talytica.portal.objects;

import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@ToString
@EqualsAndHashCode
@NoArgsConstructor
public class PasswordChangeRequest {
  public String email;
  public String hashword;
  public String password;
  public String newpass;
  public String confirmpass;
  
}
