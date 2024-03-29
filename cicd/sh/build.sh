#!/bin/sh

/kaniko/executor --context=dir://${WORKSPACE}/ \
                --dockerfile=./cicd/Dockerfile \
                --destination=${DOCKER_REPO}:${GIT_COMMIT} \
                --build-arg="PORT=${PORT}" \
                --build-arg="NODE_ENV=${NODE_ENV}"