#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Seeding database..."
node dist/prisma/seed.js || echo "Seed skipped (may already exist)"

# Setup lark-cli config for Feishu calendar integration
if [ -n "$LARK_APP_ID" ] && [ -n "$LARK_APP_SECRET" ]; then
  echo "Configuring lark-cli..."
  mkdir -p /root/.lark-cli/cache
  
  if [ -n "$LARK_USER_ID" ]; then
    LARK_USER_BLOCK=",\"users\":[{\"userOpenId\":\"$LARK_USER_ID\",\"userName\":\"Auto Configured\"}]"
  else
    LARK_USER_BLOCK=""
  fi
  
  cat > /root/.lark-cli/config.json << EOF
{
  "apps": [
    {
      "appId": "$LARK_APP_ID",
      "appSecret": "$LARK_APP_SECRET",
      "brand": "feishu",
      "lang": "zh"${LARK_USER_BLOCK}
    }
  ]
}
EOF
  chmod 644 /root/.lark-cli/config.json
  echo "lark-cli configured for app: $LARK_APP_ID"
else
  echo "⚠️  LARK_APP_ID/LARK_APP_SECRET not set, lark-cli will use default config"
fi

echo "Starting application..."
exec "$@"
