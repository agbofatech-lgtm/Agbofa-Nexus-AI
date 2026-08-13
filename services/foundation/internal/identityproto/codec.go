// Package identityproto implements the subset of foundation.tenant_identity.v1
// protobuf encoding required by TenantIdentityService identity RPCs.
//
// Generated .pb.go bindings are absent (api/gen/go is empty; protoc/buf are
// not used by this batch). This is a hand-written proto3 subset, not
// protoc-gen-go output.
//
// TenantConfig.sso (proto field 4) is intentionally not required by the
// identity RPCs implemented here.
//
// IMP-BFF-AUTH-001
package identityproto

import (
"encoding/binary"
"errors"
"fmt"
)

var ErrCodec = errors.New("protobuf codec error")

func encodeVarint(x uint64) []byte {
var buf [10]byte
n := binary.PutUvarint(buf[:], x)
return buf[:n]
}

func appendString(dst []byte, field int, value string) []byte {
if value == "" {
return dst
}
dst = append(dst, byte(field<<3|2))
dst = append(dst, encodeVarint(uint64(len(value)))...)
return append(dst, value...)
}

func appendBytes(dst []byte, field int, value []byte) []byte {
if len(value) == 0 {
return dst
}
dst = append(dst, byte(field<<3|2))
dst = append(dst, encodeVarint(uint64(len(value)))...)
return append(dst, value...)
}

func appendVarintField(dst []byte, field int, value uint64) []byte {
if value == 0 {
return dst
}
dst = append(dst, byte(field<<3|0))
return append(dst, encodeVarint(value)...)
}

func appendRepeatedString(dst []byte, field int, values []string) []byte {
for _, value := range values {
dst = appendString(dst, field, value)
}
return dst
}

type reader struct {
b []byte
}

func (r *reader) consume() (field int, wire int, payload []byte, varint uint64, err error) {
if len(r.b) == 0 {
return 0, 0, nil, 0, errEOF
}
tag, n := binary.Uvarint(r.b)
if n <= 0 {
return 0, 0, nil, 0, fmt.Errorf("%w: tag", ErrCodec)
}
r.b = r.b[n:]
field = int(tag >> 3)
wire = int(tag & 7)
switch wire {
case 0:
varint, n = binary.Uvarint(r.b)
if n <= 0 {
return 0, 0, nil, 0, fmt.Errorf("%w: varint", ErrCodec)
}
r.b = r.b[n:]
return field, wire, nil, varint, nil
case 2:
l, n := binary.Uvarint(r.b)
if n <= 0 || uint64(len(r.b)-n) < l {
return 0, 0, nil, 0, fmt.Errorf("%w: bytes", ErrCodec)
}
r.b = r.b[n:]
payload = r.b[:l]
r.b = r.b[l:]
return field, wire, payload, 0, nil
default:
return 0, 0, nil, 0, fmt.Errorf("%w: wire %d", ErrCodec, wire)
}
}

var errEOF = errors.New("eof")

type AuthenticateUserRequest struct {
TenantName    string
PrincipalName string
Credential    string
}

func MarshalAuthenticateUserRequest(m AuthenticateUserRequest) []byte {
var dst []byte
dst = appendString(dst, 1, m.TenantName)
dst = appendString(dst, 2, m.PrincipalName)
dst = appendString(dst, 3, m.Credential)
return dst
}

func UnmarshalAuthenticateUserRequest(b []byte) (AuthenticateUserRequest, error) {
var m AuthenticateUserRequest
r := reader{b}
for {
field, wire, payload, _, err := r.consume()
if err == errEOF {
return m, nil
}
if err != nil {
return m, err
}
if wire != 2 {
continue
}
switch field {
case 1:
m.TenantName = string(payload)
case 2:
m.PrincipalName = string(payload)
case 3:
m.Credential = string(payload)
}
}
}

type AuthenticationTokens struct {
AccessToken  string
RefreshToken string
ExpiresIn    int32
}

func MarshalAuthenticationTokens(m AuthenticationTokens) []byte {
var dst []byte
dst = appendString(dst, 1, m.AccessToken)
dst = appendString(dst, 2, m.RefreshToken)
dst = appendVarintField(dst, 3, uint64(m.ExpiresIn))
return dst
}

func UnmarshalAuthenticationTokens(b []byte) (AuthenticationTokens, error) {
var m AuthenticationTokens
r := reader{b}
for {
field, wire, payload, varint, err := r.consume()
if err == errEOF {
return m, nil
}
if err != nil {
return m, err
}
switch field {
case 1:
if wire == 2 {
m.AccessToken = string(payload)
}
case 2:
if wire == 2 {
m.RefreshToken = string(payload)
}
case 3:
if wire == 0 {
m.ExpiresIn = int32(varint)
}
}
}
}

type RefreshTokenRequest struct {
RefreshToken string
}

func MarshalRefreshTokenRequest(m RefreshTokenRequest) []byte {
return appendString(nil, 1, m.RefreshToken)
}

func UnmarshalRefreshTokenRequest(b []byte) (RefreshTokenRequest, error) {
var m RefreshTokenRequest
r := reader{b}
for {
field, wire, payload, _, err := r.consume()
if err == errEOF {
return m, nil
}
if err != nil {
return m, err
}
if field == 1 && wire == 2 {
m.RefreshToken = string(payload)
}
}
}

type ValidateTokenRequest struct {
AccessToken string
}

func MarshalValidateTokenRequest(m ValidateTokenRequest) []byte {
return appendString(nil, 1, m.AccessToken)
}

func UnmarshalValidateTokenRequest(b []byte) (ValidateTokenRequest, error) {
var m ValidateTokenRequest
r := reader{b}
for {
field, wire, payload, _, err := r.consume()
if err == errEOF {
return m, nil
}
if err != nil {
return m, err
}
if field == 1 && wire == 2 {
m.AccessToken = string(payload)
}
}
}

type TokenClaims struct {
Subject  string
TenantID string
Roles    []string
Issuer   string
Audience []string
TokenID  string
}

func MarshalTokenClaims(m TokenClaims) []byte {
var dst []byte
dst = appendString(dst, 1, m.Subject)
dst = appendString(dst, 2, m.TenantID)
dst = appendRepeatedString(dst, 3, m.Roles)
dst = appendString(dst, 4, m.Issuer)
dst = appendRepeatedString(dst, 5, m.Audience)
dst = appendString(dst, 6, m.TokenID)
return dst
}

func UnmarshalTokenClaims(b []byte) (TokenClaims, error) {
var m TokenClaims
r := reader{b}
for {
field, wire, payload, _, err := r.consume()
if err == errEOF {
return m, nil
}
if err != nil {
return m, err
}
if wire != 2 {
continue
}
switch field {
case 1:
m.Subject = string(payload)
case 2:
m.TenantID = string(payload)
case 3:
m.Roles = append(m.Roles, string(payload))
case 4:
m.Issuer = string(payload)
case 5:
m.Audience = append(m.Audience, string(payload))
case 6:
m.TokenID = string(payload)
}
}
}

type GetTenantRequest struct {
ID string
}

func MarshalGetTenantRequest(m GetTenantRequest) []byte {
return appendString(nil, 1, m.ID)
}

func UnmarshalGetTenantRequest(b []byte) (GetTenantRequest, error) {
var m GetTenantRequest
r := reader{b}
for {
field, wire, payload, _, err := r.consume()
if err == errEOF {
return m, nil
}
if err != nil {
return m, err
}
if field == 1 && wire == 2 {
m.ID = string(payload)
}
}
}

type TenantConfig struct {
DefaultRegion        string
MaxUsers             int32
AllowedAuthProviders []string
}

func marshalTenantConfig(m TenantConfig) []byte {
var dst []byte
dst = appendString(dst, 1, m.DefaultRegion)
dst = appendVarintField(dst, 2, uint64(m.MaxUsers))
dst = appendRepeatedString(dst, 3, m.AllowedAuthProviders)
return dst
}

func unmarshalTenantConfig(b []byte) TenantConfig {
var m TenantConfig
r := reader{b}
for {
field, wire, payload, varint, err := r.consume()
if err == errEOF {
return m
}
if err != nil {
return m
}
switch field {
case 1:
if wire == 2 {
m.DefaultRegion = string(payload)
}
case 2:
if wire == 0 {
m.MaxUsers = int32(varint)
}
case 3:
if wire == 2 {
m.AllowedAuthProviders = append(m.AllowedAuthProviders, string(payload))
}
}
}
}

type Tenant struct {
ID        string
Name      string
Status    int32
Config    TenantConfig
CreatedAt string
}

func MarshalTenant(m Tenant) []byte {
var dst []byte
dst = appendString(dst, 1, m.ID)
dst = appendString(dst, 2, m.Name)
dst = appendVarintField(dst, 3, uint64(m.Status))
dst = appendBytes(dst, 4, marshalTenantConfig(m.Config))
dst = appendString(dst, 5, m.CreatedAt)
return dst
}

func UnmarshalTenant(b []byte) (Tenant, error) {
var m Tenant
r := reader{b}
for {
field, wire, payload, varint, err := r.consume()
if err == errEOF {
return m, nil
}
if err != nil {
return m, err
}
switch field {
case 1:
if wire == 2 {
m.ID = string(payload)
}
case 2:
if wire == 2 {
m.Name = string(payload)
}
case 3:
if wire == 0 {
m.Status = int32(varint)
}
case 4:
if wire == 2 {
m.Config = unmarshalTenantConfig(payload)
}
case 5:
if wire == 2 {
m.CreatedAt = string(payload)
}
}
}
}

const (
ServiceName            = "foundation.tenant_identity.v1.TenantIdentityService"
MethodAuthenticateUser = "AuthenticateUser"
MethodValidateToken    = "ValidateToken"
MethodRefreshToken     = "RefreshToken"
MethodGetTenant        = "GetTenant"
)
