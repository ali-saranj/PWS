# Multi-stage Dockerfile for Spring Boot Core API
FROM maven:3.9.9-eclipse-temurin-17 AS builder
WORKDIR /build

# If jar is pre-built, skip Maven build; otherwise build with offline fallback
COPY . .
RUN if [ ! -f target/store-api-*.jar ]; then \
      mvn dependency:go-offline -B -q && \
      (mvn clean package -DskipTests -B -q -o || mvn clean package -DskipTests -B -q); \
    fi

FROM eclipse-temurin:17-jre-jammy AS runner
WORKDIR /app

# Install curl for container health check
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Add non-root system user
RUN groupadd -g 1001 pws && useradd -u 1001 -g pws -m pws

COPY --from=builder /build/target/store-api-*.jar app.jar
RUN mkdir -p /media && chown -R pws:pws /app /media

USER pws

ENV JAVA_TOOL_OPTIONS="-Xmx512m -XX:+UseSerialGC" \
    SPRING_PROFILES_ACTIVE=prod \
    SERVER_PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
