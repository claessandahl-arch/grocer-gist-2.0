#!/bin/bash

PROJECT_REF="issddemuomsuqkkrzqzn"
BASE_URL="https://$PROJECT_REF.supabase.co/functions/v1"

echo "🔒 Verifying Edge Function Security (Unauthenticated Access Test)"
echo "Target: $BASE_URL"
echo "---------------------------------------------------"

check_function() {
  local func_name=$1
  echo -n "Testing $func_name... "
  
  # Make request without Authorization header
  # Use -o /dev/null -w "%{http_code}" to capture just the status code
  status_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/$func_name" \
    -H "Content-Type: application/json" \
    -d '{}')

  if [ "$status_code" == "401" ]; then
    echo "✅ SECURE (Got 401 Expected)"
  else
    echo "❌ INSECURE or ERROR (Got $status_code)"
  fi
}

check_function "auto-map-products"
check_function "suggest-categories"
check_function "suggest-product-groups"
check_function "suggest-group-merges"
check_function "parse-receipt"

echo "---------------------------------------------------"
echo "Note: 401 Unauthorized confirms that the function strictly requires a valid user token."
