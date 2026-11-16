#!/bin/sh
set -e

# HTTP basic auth is opt-in. When BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD
# are both set, we generate an htpasswd file and the nginx server block (which
# includes /etc/nginx/conf.d/auth.d/auth.conf) protects every request. When
# they are unset, the auth snippet stays empty and the app serves anonymously,
# so the local demo keeps working unchanged. Credentials never enter the image
# or the repository; the password is hashed here at container start.

AUTH_DIR=/etc/nginx/conf.d/auth.d
AUTH_FILE="$AUTH_DIR/auth.conf"
HTPASSWD_FILE=/etc/nginx/conf.d/.htpasswd

mkdir -p "$AUTH_DIR"
: > "$AUTH_FILE"

if [ -n "${BASIC_AUTH_USERNAME:-}" ] && [ -n "${BASIC_AUTH_PASSWORD:-}" ]; then
  # openssl is present in the nginx:1.27-alpine base image.
  HASH=$(printf '%s' "$BASIC_AUTH_PASSWORD" | openssl passwd -apr1 -stdin)
  printf '%s:%s\n' "$BASIC_AUTH_USERNAME" "$HASH" > "$HTPASSWD_FILE"
  cat > "$AUTH_FILE" <<EOF
auth_basic "Restricted area";
auth_basic_user_file $HTPASSWD_FILE;
EOF
  chmod 600 "$HTPASSWD_FILE"
fi

exec "$@"
