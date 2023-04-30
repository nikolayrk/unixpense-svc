#!/bin/sh

DEPLOYMENT_RESOURCE=$(sed s#${DOCKER_REPO}:latest#${DOCKER_REPO}:${GIT_COMMIT}# ./cicd/manifests/deployment.yaml)

cat <<EOF | kubectl apply -f -
$DEPLOYMENT_RESOURCE
EOF