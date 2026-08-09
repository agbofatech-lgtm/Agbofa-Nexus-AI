# Standard Go Service Dockerfile — IMP-017-A AI Agent Fleet (Volume 31 / SVC-151)
# Stage 1: Build
FROM golang:1.22-alpine AS builder
RUN apk add --no-cache ca-certificates git
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
ARG VERSION=1.0.0
ARG COMMIT=unknown
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s -X main.version=${VERSION} -X main.commit=${COMMIT}" \
    -o /app/service \
    ./services/agents/cmd/server

# Stage 2: Runtime
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=builder /app/service /app/service
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
USER nonroot:nonroot
EXPOSE 9090 9091 9092
ENTRYPOINT ["/app/service"]
