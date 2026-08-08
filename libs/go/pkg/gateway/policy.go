package gateway

type RoutePolicy struct {
	Name                  string
	PathPrefix            string
	RequiresAuthentication bool
	RateLimitPerMinute    int
}

func (p RoutePolicy) IsProtected() bool { return p.RequiresAuthentication }
