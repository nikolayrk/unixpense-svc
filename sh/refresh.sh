#!/bin/bash

main() {
    local UNIXPENSE_API_URL=http://unixpense-svc-service.unixpense.svc.cluster.local:8000/api
    local FETCH_TRANSACTION_IDS_URL="$UNIXPENSE_API_URL/transactions/gmail/ids/last/20?skip_saved=true&skip_depth=10"
    local RESOLVE_TRANSACTIONS_URL="$UNIXPENSE_API_URL/transactions/gmail/resolve"
    local SAVE_TRANSACTIONS_URL="$UNIXPENSE_API_URL/transactions/save"

    echo "Installing dependencies... "
    
    installDependencies

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
    
    if [ "$(echo $FETCH_RESULT | jq 'has("error")')" == "true" ]; then
        local FETCH_ERROR=$(echo $FETCH_RESULT | jq -r '.error')

        echo "Failed."

        echo $(sendTelegram "<u>Failed to fetch transaction IDs</u>\n\n$FETCH_ERROR")

        exit 1
    elif [ "$(echo $FETCH_RESULT | jq 'type=="array"')" != "true" ]; then
        echo "Unexpected response."

        echo $(sendTelegram "<u>Unexpected response received while fetching transaction IDs</u>\n\n$FETCH_RESULT")

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

    echo -n "- Resolving transactions... "

    local RESOLVE_RESULT=$(resolveTransactions $RESOLVE_TRANSACTIONS_URL $ACCESS_TOKEN "$TRANSACTION_IDS")
    
    if [ "$(echo $RESOLVE_RESULT | jq 'has("error")')" == "true" ]; then
        local RESOLVE_ERROR=$(echo $RESOLVE_RESULT | jq -r '.error')

        echo "Failed."

        echo $(sendTelegram "<u>Failed to resolve transactions</u>\n\n$RESOLVE_ERROR")

        exit 1
    elif [ "$(echo $RESOLVE_RESULT | jq 'type=="array"')" != "true" ]; then
        echo "Unexpected response."

        echo $(sendTelegram "<u>Unexpected response received while resolving transactions</u>\n\n$RESOLVE_RESULT")

        exit 1
    fi

    echo "Success."

    echo -n "- Saving new transaction IDs... "

    local SAVE_RESULT=$(saveTransactions $SAVE_TRANSACTIONS_URL "$RESOLVE_RESULT")

    if [ "$(echo $SAVE_RESULT | jq 'has("error")')" == "true" ]; then
        local SAVE_ERROR=$(echo $SAVE_RESULT | jq -r '.error')

        echo "Failed."

        echo $(sendTelegram "<u>Failed to save transactions</u>\n\n$SAVE_ERROR")

        exit 1
    elif [ "$(echo $SAVE_RESULT | jq 'has("result")')" != "true" ]; then
        echo "Unexpected response."

        echo $(sendTelegram "<u>Unexpected response received while saving transactions</u>\n\n$SAVE_RESULT")

        exit 1
    fi

    echo "Success."

    local SAVE_MESSAGE=$(echo $SAVE_RESULT | jq -r '.result')

    SAVE_MESSAGE+=$(formatTransactions "$RESOLVE_RESULT")

    echo $(sendTelegram "$SAVE_MESSAGE")
}

installDependencies() {
    local retry=5 count=0

    while true; do
        # Send SIGTERM (signal 15) if apt-get takes more than 1 minute
        if timeout -s 15 60 apt-get -qy update && apt-get -qy -o=Dpkg::Use-Pty=0 install curl jq; then
            break
        fi

        if (( count++ == retry )); then
            echo "Failed to install dependencies."

            exit 1
        fi

        sleep 5 # Wait 5 seconds before retry
    done
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

saveTransactions() {
    if [[ $# -ne 2 ]]; then
        echo $(formatResult "{\"error\": \"saveTransactions(): called with $# parameters, expected 3\"}")

        exit 1
    fi

    local URL=$1
    local TRANSACTIONS=$2

    local RESULT=$(curl -s \
        --connect-timeout 180 \
        -X POST "$URL" \
        -H "Accept: application/json" \
        -H "Content-Type: application/json" \
        -d "$TRANSACTIONS")

    echo $(formatResult "$RESULT")
}

formatResult() {
    if [[ $# -ne 1 ]]; then
        echo $(formatResult "{\"error\": \"formatResult(): called with $# parameters, expected 1\"}")

        exit 1
    fi

    local RESULT_RAW=$1

    local RESULT_MESSAGE=$(echo $RESULT_RAW | jq -r '.message')
    local RESULT_ERROR=$(echo $RESULT_RAW | jq -r '.error')

    if [ "$RESULT_MESSAGE" != '' ] && [ "$RESULT_MESSAGE" != null ]; then
        echo "{\"result\": \"<b>$RESULT_MESSAGE</b>\"}"
    elif [ "$RESULT_ERROR" != '' ] && [ "$RESULT_ERROR" != null ]; then
        echo "{\"error\": \"<b><i>$RESULT_ERROR</i></b>\"}"
    else
        echo "$RESULT_RAW"
    fi
}

formatTransactions() {
    if [[ $# -ne 1 ]]; then
        echo $(formatResult "{\"error\": \"formatTransactions(): called with $# parameters, expected 1\"}")

        exit 1
    fi

    local TRANSACTIONS=$1

    local RESULT+="\n"

    IFS=$'\n'
    for TRANSACTION in $(echo $TRANSACTIONS | jq -c '.[]'); do
        local VALUE_DATE=$(date +"%m/%d/%y" -d $(echo $TRANSACTION | jq -r '.value_date'))
        local BASE_SUM=$(echo $TRANSACTION | jq -r '.sum')
        local OPERATION=$(echo $TRANSACTION | jq -r 'if .entryType=="CREDIT" then "from" else "to" end')

        if [ "$(echo $TRANSACTION | jq 'has("card_operation")')" == "true" ]; then
            local SUM=$(echo $TRANSACTION | jq -r '.card_operation.sum')
            local CURRENCY=$(echo $TRANSACTION | jq -r '.card_operation.currency')
            local RECIPIENT=$(echo $TRANSACTION | jq -r '.card_operation.recipient')
            local INSTRUMENT=$(echo $TRANSACTION | jq -r '.card_operation.instrument')

            if [ "$INSTRUMENT" != 'Fee АТМ' ]; then
              RESULT+="\n - <b>${SUM} ${CURRENCY}</b> ${OPERATION} <b>${RECIPIENT}</b> via ${INSTRUMENT} on ${VALUE_DATE}"
            else
              RESULT+="\n - <b>${BASE_SUM} BGN</b> ${OPERATION} <b>${RECIPIENT}</b> via ${INSTRUMENT} on ${VALUE_DATE}"
            fi
        elif [ "$(echo $TRANSACTION | jq -r 'has("standard_transfer")')" == "true" ]; then
            local RECIPIENT=$(echo $TRANSACTION | jq -r '.standard_transfer.recipient')
            local DESCRIPTION=$(echo $TRANSACTION | jq -r '.standard_transfer.description')

            if [ "$DESCRIPTION" != 'N/A' ]; then
                RESULT+="\n - <b>${BASE_SUM} BGN</b> ${OPERATION} <b>${RECIPIENT}</b> for ${DESCRIPTION} on ${VALUE_DATE}"
            else
                RESULT+="\n - <b>${BASE_SUM} BGN</b> ${OPERATION} <b>${RECIPIENT}</b> on ${VALUE_DATE}"
            fi
        fi
    done

    echo "$RESULT"
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
        -d "{\"chat_id\": \"$TELEGRAM_CHAT_ID\", \"parse_mode\": \"HTML\", \"text\": \"$MESSAGE\", \"disable_notification\": true}")

    TELEGRAM_API_SUCCESSFUL=$(echo $TELEGRAM_API_RESULT | jq '.ok')

    if [ "$TELEGRAM_API_SUCCESSFUL" = false ]; then
        TELEGRAM_API_ERROR_DESCRIPTION=$(echo $TELEGRAM_API_RESULT | jq '.description')

        echo "sendTelegram() failed: $TELEGRAM_API_ERROR_DESCRIPTION"

        exit 1
    fi

    echo "sendTelegram() succeeded"
}

main