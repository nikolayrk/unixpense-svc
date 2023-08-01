#!/bin/bash

apt-get -qy update; apt-get -qy -o=Dpkg::Use-Pty=0 install curl jq

main() {
    local UNIXPENSE_API_URL=http://unixpense-svc-service.unixpense.svc.cluster.local:8000/api
    local FETCH_TRANSACTION_IDS_URL="$UNIXPENSE_API_URL/transactions/gmail/ids/last/20?skip_saved=true&skip_depth=10"
    local SAVE_TRANSACTIONS_URL="$UNIXPENSE_API_URL/transactions/gmail/save"
    local RESOLVE_TRANSACTIONS_URL="$UNIXPENSE_API_URL/transactions/gmail/resolve"

    echo -n "- Resolving OAuth2 Tokens... "

    local ACCESS_TOKEN="$(resolveAccessToken)"

    local REFRESH_TOKEN="$(resolveRefreshToken)"

    if [ "$ACCESS_TOKEN" == '' ] || [ "$REFRESH_TOKEN" == '' ]; then
        echo "No tokens found."

        exit 1
    fi

    echo "Success."

    echo -n "- Fetching new transaction IDs... "

    local FETCH_RESULT=$(fetchTransactionIds $FETCH_TRANSACTION_IDS_URL $ACCESS_TOKEN $REFRESH_TOKEN)
    
    local FETCH_ERROR=$(echo $FETCH_RESULT | jq '.error')

    if [ "$FETCH_ERROR" != '' ]; then
        echo "Failed."

        echo $(sendTelegram "$FETCH_ERROR")

        exit 1
    fi

    local TRANSACTION_IDS="$FETCH_RESULT"

    local TRANSACTION_ID_COUNT=$(echo $TRANSACTION_IDS | jq 'length')

    if [ "$TRANSACTION_ID_COUNT" -eq "0" ]; then
        echo "No new transactions."

        exit
    fi

    echo "Received $TRANSACTION_ID_COUNT new transaction(s)."

    # Hydrate access token, in case the first request triggered a token refresh
    ACCESS_TOKEN="$(resolveAccessToken)"

    echo -n "- Saving new transaction IDs... "

    local SAVE_RESULT=$(saveTransactions $SAVE_TRANSACTIONS_URL $ACCESS_TOKEN "$TRANSACTION_IDS")
    
    local SAVE_ERROR=$(echo $SAVE_RESULT | jq '.error')

    if [ "$SAVE_ERROR" != null ]; then
        echo "Failed."

        echo $(sendTelegram "$SAVE_ERROR")

        exit 1
    fi

    echo "Success."

    local SAVE_MESSAGE=$(echo $SAVE_RESULT | jq '.result')

    echo $(sendTelegram "$SAVE_MESSAGE")

    echo -n "- Resolving transactions... "

    local RESOLVE_RESULT=$(resolveTransactions $RESOLVE_TRANSACTIONS_URL $ACCESS_TOKEN "$TRANSACTION_IDS")
    
    local RESOLVE_ERROR=$(echo $RESOLVE_RESULT | jq '.error')

    if [ "$RESOLVE_ERROR" != '' ]; then
        echo "Failed."

        echo $(sendTelegram "$RESOLVE_ERROR")

        exit 1
    fi

    echo "Success."

    local FORMATTED_TRANSACTIONS=$(echo $RESOLVE_RESULT | jq . | sed 's/"/\\"/g')

    local RESOLVE_MESSAGE="<code>$FORMATTED_TRANSACTIONS</code>"

    echo $(sendTelegram "\"$RESOLVE_MESSAGE\"")
}

resolveAccessToken() {
    local QUERY="\
        SELECT access_token
        FROM google_oauth2_tokens
        WHERE user_email='$GMAIL_ADDRESS'"

    local ACCESS_TOKEN=$(mariadb unixpense \
        -h mariadb-service.unixpense.svc.cluster.local \
        -u$MARIADB_USER \
        -p$MARIADB_PASSWORD \
        -se "$QUERY")

    echo $ACCESS_TOKEN
}

resolveRefreshToken() {
    local QUERY="\
        SELECT refresh_token
        FROM google_oauth2_tokens
        WHERE user_email='$GMAIL_ADDRESS'"

    local REFRESH_TOKEN=$(mariadb unixpense \
        -h mariadb-service.unixpense.svc.cluster.local \
        -u$MARIADB_USER \
        -p$MARIADB_PASSWORD \
        -se "$QUERY")

    echo $REFRESH_TOKEN
}

fetchTransactionIds() {
    if [[ $# -ne 3 ]]; then
        echo $(formatResult "{\"error\": \"fetchTransactionIds(): called with $# parameters, expected 3\"}")

        exit 1
    fi

    local URL=$1
    local ACCESS_TOKEN=$2
    local REFRESH_TOKEN=$3

    local RESULT=$(curl -s \
        --connect-timeout 180 \
        -X GET "$URL" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "X-Refresh-Token: $REFRESH_TOKEN" \
        -H "Accept: application/json")

    echo $(formatResult "$RESULT")
}

saveTransactions() {
    if [[ $# -ne 3 ]]; then
        echo $(formatResult "{\"error\": \"saveTransactions(): called with $# parameters, expected 3\"}")

        exit 1
    fi

    local URL=$1
    local ACCESS_TOKEN=$2
    local TRANSACTION_IDS=$3

    local RESULT=$(curl -s \
        --connect-timeout 180 \
        -X POST "$URL" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        -d "$TRANSACTION_IDS")

    echo $(formatResult "$RESULT")
}

resolveTransactions() {
    if [[ $# -ne 3 ]]; then
        echo $(formatResult "{\"error\": \"resolveTransactions(): called with $# parameters, expected 3\"}")

        exit 1
    fi

    local URL=$1
    local ACCESS_TOKEN=$2
    local TRANSACTION_IDS=$3

    local RESULT=$(curl -s \
        --connect-timeout 180 \
        -X POST "$URL" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        -d "$TRANSACTION_IDS")

    echo $(formatResult "$RESULT")
}

formatResult() {
    if [[ $# -ne 1 ]]; then
        echo $(formatResult "{\"error\": \"formatResult(): called with $# parameters, expected 1\"}")

        exit 1
    fi

    local RESULT_RAW=$1

    local RESULT_MESSAGE=$(echo $RESULT_RAW | jq '.message' | tr -d '"')
    local RESULT_ERROR=$(echo $RESULT_RAW | jq '.error' | tr -d '"')

    if [ "$RESULT_MESSAGE" != '' ] && [ "$RESULT_MESSAGE" != null ]; then
        echo "{\"result\": \"<b>$RESULT_MESSAGE</b>\"}"
    elif [ "$RESULT_ERROR" != '' ] && [ "$RESULT_ERROR" != null ]; then
        echo "{\"error\": \"<b><u>Error:</u> <i>$RESULT_ERROR</i></b>\"}"
    else
        echo "$RESULT_RAW"
    fi
}

sendTelegram() {
    if [[ $# -ne 1 ]]; then
        echo "sendTelegram(): called with $# parameters, expected 1"

        exit 1
    fi

    local MESSAGE=$1

    TELEGRAM_API_RESULT=$(curl -s \
        --connect-timeout 180 \
        -X POST https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage \
        -H 'Content-Type: application/json' \
        -d "{\"chat_id\": \"$TELEGRAM_CHAT_ID\", \"parse_mode\": \"HTML\", \"text\": $MESSAGE, \"disable_notification\": true}")

    TELEGRAM_API_SUCCESSFUL=$(echo $TELEGRAM_API_RESULT | jq '.ok')

    if [ "$TELEGRAM_API_SUCCESSFUL" = false ]; then
        TELEGRAM_API_ERROR_DESCRIPTION=$(echo $TELEGRAM_API_RESULT | jq '.description')

        echo "sendTelegram() failed: $TELEGRAM_API_ERROR_DESCRIPTION"

        exit 1
    fi

    echo "sendTelegram() succeeded"
}

main