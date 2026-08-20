package social

import "context"

// Router dispatches OAuth/publish calls to the platform adapter. It does not
// invent publication IDs.
type Router struct {
	by map[Platform]Adapter
}

func NewRouter() *Router {
	return &Router{by: map[Platform]Adapter{}}
}

func NewDefaultRouter(httpClient HTTPClient) *Router {
	r := NewRouter()
	for id, spec := range Catalog() {
		if id == PlatformYouTube {
			r.Register(NewYouTubeAdapter(httpClient))
			continue
		}
		r.Register(OAuthClient{
			Spec:      spec,
			ClientID:  ClientID(id),
			ClientSec: ClientSecret(id),
			HTTP:      httpClient,
		})
	}
	return r
}

func (r *Router) Register(a Adapter) {
	if r.by == nil {
		r.by = map[Platform]Adapter{}
	}
	r.by[a.Platform()] = a
}

func (r *Router) For(p Platform) (Adapter, bool) {
	if r == nil {
		return nil, false
	}
	a, ok := r.by[p]
	return a, ok
}

func (r *Router) Platform() Platform { return "" }

func (r *Router) Exchange(ctx context.Context, code, redirect, verifier string) (TokenSet, error) {
	return TokenSet{}, ErrUnknownPlatform
}

func (r *Router) Refresh(ctx context.Context, refreshToken string) (TokenSet, error) {
	return TokenSet{}, ErrReauthRequired
}

func (r *Router) Publish(ctx context.Context, tokens TokenSet, pkg PublicationPackage) (PublishResult, error) {
	a, ok := r.For(pkg.Platform)
	if !ok {
		return PublishResult{}, ErrUnknownPlatform
	}
	return a.Publish(ctx, tokens, pkg)
}
