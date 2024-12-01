#!/bin/bash

installDependencies() {
    local retry=5 count=0

    while true; do
        # Send SIGTERM (signal 15) if apt-get takes more than 1 minute
        if timeout -s 15 60 apt-get -qy update && apt-get -qy -o=Dpkg::Use-Pty=0 install curl; then
            break
        fi

        if (( count++ == retry )); then
            echo "Failed to install dependencies."

            exit 1
        fi

        sleep 5 # Wait 5 seconds before retry
    done

    echo "Installing Node 20"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
        apt-get update && \
        apt-get install -y nodejs && \
        rm -rf /var/lib/apt/lists/*

    echo "Installing Yarn 1.22.19"
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | tee /etc/apt/trusted.gpg.d/yarn.asc
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
    apt-get update && \
        apt-get install -y yarn=1.22.19-1 && \
        rm -rf /var/lib/apt/lists/*
}

main() {
    installDependencies
                
    yarn install --frozen-lockfile

    until curl --silent --fail http://${SERVICE_URI_INTERNAL}/healthz; do
        echo "Waiting for service to be ready..."
        sleep 5
    done

    yarn test:integration \
        --testPathIgnorePatterns \
        gmailTransactionsRoutes.test.ts googleOAuth2Routes.test.ts # Skip tests that use Google services
}

main