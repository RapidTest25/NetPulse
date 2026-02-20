# Same as apps/api/Dockerfile — kept here for reference
FROM golang:1.23-alpine AS builder

WORKDIR /app
COPY apps/api/go.mod apps/api/go.sum ./
RUN go mod download
COPY apps/api/ .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/api ./cmd/server

FROM alpine:3.20
RUN apk --no-cache add ca-certificates tzdata
COPY --from=builder /bin/api /bin/api
EXPOSE 8080
ENTRYPOINT ["/bin/api"]
