package infrastructure

import (
"context"
"crypto/rand"
"crypto/sha256"
"encoding/hex"
"sync"
"time"

"github.com/agbofa/nexus/services/foundation/internal/domain"
)

// MemoryIdentityStore is an in-process tenant/user/refresh-token store.
// Temporary local-verification limitation: it does not open a database and
// does not migrate schema. It is not production persistence.
type MemoryIdentityStore struct {
mu            sync.RWMutex
tenantsByID   map[string]domain.Tenant
tenantsByName map[string]string
users         map[string]domain.User
usersByID     map[string]domain.User
refresh       map[string]refreshRecord
}

type refreshRecord struct {
UserID    string
TenantID  string
ExpiresAt time.Time
Revoked   bool
}

func NewMemoryIdentityStore() *MemoryIdentityStore {
return &MemoryIdentityStore{
tenantsByID:   map[string]domain.Tenant{},
tenantsByName: map[string]string{},
users:         map[string]domain.User{},
usersByID:     map[string]domain.User{},
refresh:       map[string]refreshRecord{},
}
}

func userKey(tenantID, principal string) string {
return tenantID + "\x00" + principal
}

func (s *MemoryIdentityStore) SeedTenantAndUser(tenant domain.Tenant, user domain.User) {
s.mu.Lock()
defer s.mu.Unlock()
if tenant.ID == "" {
tenant.ID = newID()
}
if user.ID == "" {
user.ID = newID()
}
user.TenantID = tenant.ID
s.tenantsByID[tenant.ID] = tenant
s.tenantsByName[tenant.Name] = tenant.ID
s.users[userKey(tenant.ID, user.PrincipalName)] = user
s.usersByID[user.ID] = user
}

func (s *MemoryIdentityStore) FindTenantByName(_ context.Context, name string) (*domain.Tenant, error) {
s.mu.RLock()
defer s.mu.RUnlock()
id, ok := s.tenantsByName[name]
if !ok {
return nil, nil
}
t := s.tenantsByID[id]
cp := t
return &cp, nil
}

func (s *MemoryIdentityStore) FindTenantByID(_ context.Context, id string) (*domain.Tenant, error) {
s.mu.RLock()
defer s.mu.RUnlock()
t, ok := s.tenantsByID[id]
if !ok {
return nil, nil
}
cp := t
return &cp, nil
}

func (s *MemoryIdentityStore) CreateTenant(_ context.Context, tenant domain.Tenant) (domain.Tenant, error) {
s.mu.Lock()
defer s.mu.Unlock()
if tenant.ID == "" {
tenant.ID = newID()
}
if tenant.CreatedAt.IsZero() {
tenant.CreatedAt = time.Now().UTC()
}
s.tenantsByID[tenant.ID] = tenant
s.tenantsByName[tenant.Name] = tenant.ID
return tenant, nil
}

func (s *MemoryIdentityStore) CreateUser(_ context.Context, user domain.User) (domain.User, error) {
s.mu.Lock()
defer s.mu.Unlock()
if user.ID == "" {
user.ID = newID()
}
if user.CreatedAt.IsZero() {
user.CreatedAt = time.Now().UTC()
}
s.users[userKey(user.TenantID, user.PrincipalName)] = user
s.usersByID[user.ID] = user
return user, nil
}

func (s *MemoryIdentityStore) FindUserByPrincipal(_ context.Context, tenantID string, principalName string) (*domain.User, error) {
s.mu.RLock()
defer s.mu.RUnlock()
u, ok := s.users[userKey(tenantID, principalName)]
if !ok {
return nil, nil
}
cp := u
return &cp, nil
}

func (s *MemoryIdentityStore) FindUserByID(_ context.Context, userID string) (*domain.User, error) {
s.mu.RLock()
defer s.mu.RUnlock()
u, ok := s.usersByID[userID]
if !ok {
return nil, nil
}
cp := u
return &cp, nil
}

func (s *MemoryIdentityStore) RecordLogin(_ context.Context, userID string, occurredAt time.Time) error {
s.mu.Lock()
defer s.mu.Unlock()
u, ok := s.usersByID[userID]
if !ok {
return nil
}
u.LastLoginAt = &occurredAt
s.usersByID[userID] = u
s.users[userKey(u.TenantID, u.PrincipalName)] = u
return nil
}

func (s *MemoryIdentityStore) PutRefreshToken(_ context.Context, tokenHash, userID, tenantID string, expiresAt time.Time) error {
s.mu.Lock()
defer s.mu.Unlock()
s.refresh[tokenHash] = refreshRecord{UserID: userID, TenantID: tenantID, ExpiresAt: expiresAt, Revoked: false}
return nil
}

// ConsumeRefreshToken accepts the raw refresh JWT, hashes it, and one-time consumes it.
func (s *MemoryIdentityStore) ConsumeRefreshToken(_ context.Context, refreshToken string) (userID, tenantID string, ok bool) {
s.mu.Lock()
defer s.mu.Unlock()
tokenHash := HashRefreshToken(refreshToken)
rec, exists := s.refresh[tokenHash]
if !exists || rec.Revoked || time.Now().UTC().After(rec.ExpiresAt) {
return "", "", false
}
rec.Revoked = true
s.refresh[tokenHash] = rec
return rec.UserID, rec.TenantID, true
}

func HashRefreshToken(token string) string {
sum := sha256.Sum256([]byte(token))
return hex.EncodeToString(sum[:])
}

func newID() string {
var b [16]byte
_, _ = rand.Read(b[:])
return hex.EncodeToString(b[:])
}
