#!/bin/sh

DOCKER_REGISTRY_CREDENTIALS=$(echo -n ${DOCKER_REGISTRY_CREDENTIALS} | base64)

DOCKERCONFIGJSON=$(cat <<EOF
{
    "auths": {
        "${UNIXPENSE_DOCKER_REGISTRY_URL}": {
                "auth": "${DOCKER_REGISTRY_CREDENTIALS}"
        }
    }
}
EOF
)

kubectl create namespace ${UNIXPENSE_K8S_NAMESPACE} \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl create configmap unixpense-svc-config \
    --dry-run=client -o yaml \
    --namespace=${UNIXPENSE_K8S_NAMESPACE} \
    --from-literal=NODE_ENV=${NODE_ENV} \
    --from-literal=LOG_LEVEL=${LOG_LEVEL} \
    --from-literal=UNIXPENSE_PORT=${UNIXPENSE_PORT} \
    --from-literal=UNIXPENSE_LOKI_HOST=${UNIXPENSE_LOKI_HOST} | kubectl apply -f -

kubectl create secret generic unixpense-svc-regcred \
    --dry-run=client -o yaml \
    --namespace=${UNIXPENSE_K8S_NAMESPACE} \
    --type=kubernetes.io/dockerconfigjson \
    --from-literal=.dockerconfigjson="$DOCKERCONFIGJSON" | kubectl apply -f -

kubectl create secret generic unixpense-svc-googlecred \
    --dry-run=client -o yaml \
    --namespace=${UNIXPENSE_K8S_NAMESPACE} \
    --from-literal=UNIXPENSE_GOOGLE_CLIENT_ID=${UNIXPENSE_GOOGLE_CLIENT_ID} \
    --from-literal=UNIXPENSE_GOOGLE_CLIENT_SECRET=${UNIXPENSE_GOOGLE_CLIENT_SECRET} \
    --from-literal=UNIXPENSE_GOOGLE_REDIRECT_URI=${UNIXPENSE_GOOGLE_REDIRECT_URI} | kubectl apply -f -

kubectl create secret generic unixpense-svc-dbcred \
    --dry-run=client -o yaml \
    --namespace=${UNIXPENSE_K8S_NAMESPACE} \
    --from-literal=UNIXPENSE_MARIADB_HOST=${UNIXPENSE_MARIADB_HOST} \
    --from-literal=UNIXPENSE_MARIADB_PORT=${UNIXPENSE_MARIADB_PORT} \
    --from-literal=UNIXPENSE_MARIADB_USERNAME=${UNIXPENSE_MARIADB_USERNAME} \
    --from-literal=UNIXPENSE_MARIADB_PASSWORD=${UNIXPENSE_MARIADB_PASSWORD} \
    --from-literal=UNIXPENSE_MARIADB_DATABASE=${UNIXPENSE_MARIADB_DATABASE} | kubectl apply -f -