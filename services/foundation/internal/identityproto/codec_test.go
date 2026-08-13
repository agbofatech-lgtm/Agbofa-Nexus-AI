package identityproto

import "testing"

func TestAuthenticateUserRequestRoundTrip(t *testing.T) {
in := AuthenticateUserRequest{TenantName: "tenant-default", PrincipalName: "editor", Credential: "secret"}
out, err := UnmarshalAuthenticateUserRequest(MarshalAuthenticateUserRequest(in))
if err != nil {
t.Fatal(err)
}
if out != in {
t.Fatalf("%+v != %+v", out, in)
}
}

func TestTokenClaimsRoundTrip(t *testing.T) {
in := TokenClaims{Subject: "editor", TenantID: "t1", Roles: []string{"EDITOR", "ANALYST"}, Issuer: "iss", Audience: []string{"aud"}, TokenID: "jti"}
out, err := UnmarshalTokenClaims(MarshalTokenClaims(in))
if err != nil {
t.Fatal(err)
}
if out.Subject != in.Subject || out.TenantID != in.TenantID || out.TokenID != in.TokenID || len(out.Roles) != 2 {
t.Fatalf("%+v", out)
}
}

func TestAuthenticationTokensRoundTrip(t *testing.T) {
in := AuthenticationTokens{AccessToken: "access", RefreshToken: "refresh", ExpiresIn: 3600}
out, err := UnmarshalAuthenticationTokens(MarshalAuthenticationTokens(in))
if err != nil {
t.Fatal(err)
}
if out != in {
t.Fatalf("%+v != %+v", out, in)
}
}