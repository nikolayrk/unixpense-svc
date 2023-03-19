#!/bin/sh

DEPLOYMENT_RESOURCE=$(sed s/BUILD_NUMBER/${GIT_COMMIT}/ ${UNIXPENSE_DEPLOYMENT_PATH})

DEPLOYMENT_RESOURCE=$(echo "${DEPLOYMENT_RESOURCE}" | sed s#DOCKER_REPO#${UNIXPENSE_DOCKER_REPO}#)

cat <<EOF | kubectl apply -f -
$DEPLOYMENT_RESOURCE
EOF