package infrastructure

import (
"context"
"fmt"
"time"

"github.com/agbofa/nexus/services/foundation/internal/authjwt"
"github.com/agbofa/nexus/services/foundation/internal/domain"
)

// HMACTokenIssuer implements application.TokenIssuer with signed HS256 JWTs.
type HMACTokenIssuer struct {
cfg   authjwt.Config
store *MemoryIdentityStore
}

func NewHMACTokenIssuer(cfg authjwt.Config, store *MemoryIdentityStore) *HMACTokenIssuer {
return &HMACTokenIssuer{cfg: cfg, store: store}
}

func (i *HMACTokenIssuer) IssueTokens(ctx context.Context, tenant domain.Tenant, user domain.User) (domain.AuthenticationTokens, error) {
tokenID := newID()
access, refresh, expiresIn, err := authjwt.IssueAccessAndRefresh(
i.cfg,
user.PrincipalName,
user.ID,
tenant.ID,
tokenID,
user.Roles,
)
if err != nil {
return domain.AuthenticationTokens{}, err
}
ttl := i.cfg.RefreshTTL
if ttl <= 0 {
ttl = 7 * 24 * time.Hour
}
if err := i.store.PutRefreshToken(ctx, HashRefreshToken(refresh), user.ID, tenant.ID, time.Now().UTC().Add(ttl)); err != nil {
return domain.AuthenticationTokens{}, fmt.Errorf("persist refresh token: %w", err)
}
return domain.AuthenticationTokens{
AccessToken:  access,
RefreshToken: refresh,
ExpiresIn:    expiresIn,
}, nil
}
