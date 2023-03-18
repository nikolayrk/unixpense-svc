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

kubectl create namespace ${UNIXPENSE_K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

kubectl create configmap unixpense-svc-config \
    --dry-run=client -o yaml \
    --namespace=${UNIXPENSE_K8S_NAMESPACE} \
    --from-literal=PORT=${UNIXPENSE_PORT} | kubectl apply -f -

kubectl create secret generic unixpense-svc-regcred \
    --dry-run=client -o yaml \
    --namespace=${UNIXPENSE_K8S_NAMESPACE} \
    --type=kubernetes.io/dockerconfigjson \
    --from-literal=.dockerconfigjson="$DOCKERCONFIGJSON" | kubectl apply -f -

kubectl create secret generic unixpense-svc-googlecred \
    --dry-run=client -o yaml \
    --namespace=${UNIXPENSE_K8S_NAMESPACE} \
    --from-literal=CLIENT_ID=${UNIXPENSE_GOOGLE_CLIENT_ID} \
    --from-literal=CLIENT_SECRET=${UNIXPENSE_GOOGLE_CLIENT_SECRET} \
    --from-literal=REDIRECT_URI=${UNIXPENSE_GOOGLE_REDIRECT_URI} | kubectl apply -f -

kubectl create secret generic unixpense-svc-dbcred \
    --dry-run=client -o yaml \
    --namespace=${UNIXPENSE_K8S_NAMESPACE} \
    --from-literal=DB_HOST=${UNIXPENSE_MARIADB_HOST} \
    --from-literal=DB_PORT=${UNIXPENSE_MARIADB_PORT} \
    --from-literal=DB_USERNAME=${UNIXPENSE_MARIADB_USERNAME} \
    --from-literal=DB_PASSWORD=${UNIXPENSE_MARIADB_PASSWORD} \
    --from-literal=DB_NAME=${UNIXPENSE_MARIADB_DATABASE} | kubectl apply -f -