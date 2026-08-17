package infrastructure

import (
"context"
"crypto/sha256"
"crypto/subtle"
"encoding/hex"
)

// SHA256CredentialVerifier compares a stored hex SHA-256 credential hash.
// This is a local verification verifier, not a production password KDF.
type SHA256CredentialVerifier struct{}

func NewSHA256CredentialVerifier() SHA256CredentialVerifier {
return SHA256CredentialVerifier{}
}

func HashCredential(credential string) string {
sum := sha256.Sum256([]byte(credential))
return hex.EncodeToString(sum[:])
}

func (SHA256CredentialVerifier) VerifyCredential(_ context.Context, credentialHash string, credential string) (bool, error) {
if credentialHash == "" || credential == "" {
return false, nil
}
got := HashCredential(credential)
if len(got) != len(credentialHash) {
return false, nil
}
return subtle.ConstantTimeCompare([]byte(got), []byte(credentialHash)) == 1, nil
}
