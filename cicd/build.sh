#!/bin/sh

/kaniko/executor --context=dir://${WORKSPACE}/ \
                --dockerfile=./cicd/Dockerfile \
                --destination=${UNIXPENSE_DOCKER_REPO}:${GIT_COMMIT} \
                --build-arg="PORT=${UNIXPENSE_PORT}" \
                --build-arg="NODE_ENV=${NODE_ENV}"