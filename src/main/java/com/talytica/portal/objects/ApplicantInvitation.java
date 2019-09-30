package com.talytica.portal.objects;

import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@ToString
@EqualsAndHashCode
@NoArgsConstructor
public class ApplicantInvitation {
  public Long asid;
  public String email;
  public String firstName;
  public String lastName;
  public String address;
  public Double lat;
  public Double lng;
  public Long locationId;
  public Long positionId;
  public String country_short;
  public String formatted_address;
  public Boolean notifyme;
  public Boolean sample; // to allow for 'sample' invitations.

}
