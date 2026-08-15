package youtube

import (
"context"
"sync"
"time"

"github.com/agbofa/nexus/libs/go/pkg/connectors"
)

// InMemoryCredentialStore implements connectors.CredentialStore for testing and development.
type InMemoryCredentialStore struct {
mu    sync.RWMutex
creds map[string]*connectors.Credential
}

// NewInMemoryCredentialStore creates an empty in-memory credential store.
func NewInMemoryCredentialStore() *InMemoryCredentialStore {
return &InMemoryCredentialStore{
creds: make(map[string]*connectors.Credential),
}
}

// Save stores a credential.
func (s *InMemoryCredentialStore) Save(ctx context.Context, cred connectors.Credential) error {
s.mu.Lock()
defer s.mu.Unlock()

key := cred.TenantID + ":" + cred.Platform
credCopy := cred
s.creds[key] = &credCopy
return nil
}

// Get retrieves a credential.
func (s *InMemoryCredentialStore) Get(ctx context.Context, tenantID, platform string) (*connectors.Credential, error) {
s.mu.RLock()
defer s.mu.RUnlock()

key := tenantID + ":" + platform
cred, ok := s.creds[key]
if !ok {
return nil, nil
}

credCopy := *cred
return &credCopy, nil
}

// Delete removes a credential.
func (s *InMemoryCredentialStore) Delete(ctx context.Context, tenantID, platform string) error {
s.mu.Lock()
defer s.mu.Unlock()

key := tenantID + ":" + platform
delete(s.creds, key)
return nil
}

// IsExpired checks if a credential is expired.
func (s *InMemoryCredentialStore) IsExpired(cred connectors.Credential) bool {
return time.Now().After(cred.ExpiresAt)
}
