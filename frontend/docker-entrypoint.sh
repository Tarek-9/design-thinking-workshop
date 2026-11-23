#!/bin/sh
set -e

# Basic auth is opt-in: with BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD both set,
# every request needs it. The password is hashed here, never stored in the image.

AUTH_DIR=/etc/nginx/conf.d/auth.d
AUTH_FILE="$AUTH_DIR/auth.conf"
HTPASSWD_FILE=/etc/nginx/conf.d/.htpasswd

mkdir -p "$AUTH_DIR"
: > "$AUTH_FILE"

if [ -n "${BASIC_AUTH_USERNAME:-}" ] && [ -n "${BASIC_AUTH_PASSWORD:-}" ]; then
  # openssl is installed by the Dockerfile.
  HASH=$(printf '%s' "$BASIC_AUTH_PASSWORD" | openssl passwd -apr1 -stdin)
  printf '%s:%s\n' "$BASIC_AUTH_USERNAME" "$HASH" > "$HTPASSWD_FILE"
  cat > "$AUTH_FILE" <<EOF
auth_basic "Restricted area";
auth_basic_user_file $HTPASSWD_FILE;
EOF
  # nginx workers run as the nginx user and read the file on each request.
  chown root:nginx "$HTPASSWD_FILE"
  chmod 640 "$HTPASSWD_FILE"
fi

exec "$@"
