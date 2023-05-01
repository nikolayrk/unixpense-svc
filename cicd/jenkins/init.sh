#!/bin/sh

DOCKER_REGISTRY_CREDENTIALS=$(echo -n ${DOCKER_REGISTRY_CREDENTIALS} | base64)

DOCKERCONFIGJSON=$(cat <<EOF
{
    "auths": {
        "${DOCKER_REGISTRY_URL}": {
                "auth": "${DOCKER_REGISTRY_CREDENTIALS}"
        }
    }
}
EOF
)

kubectl create namespace ${KUBERNETES_NAMESPACE} \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl create configmap unixpense-svc-config \
    --dry-run=client -o yaml \
    --namespace=${KUBERNETES_NAMESPACE} \
    --from-literal=PORT=${PORT} \
    --from-literal=NODE_ENV=${NODE_ENV} \
    --from-literal=LOG_LEVEL=${LOG_LEVEL} \
    --from-literal=UNIXPENSE_URI=${UNIXPENSE_URI} \
    --from-literal=UNIXPENSE_URI_PREFIX=${UNIXPENSE_URI_PREFIX} \
    --from-literal=LOKI_HOST=${LOKI_HOST} | kubectl apply -f -

kubectl create secret generic dockerconfig \
    --dry-run=client -o yaml \
    --namespace=${KUBERNETES_NAMESPACE} \
    --type=kubernetes.io/dockerconfigjson \
    --from-literal=.dockerconfigjson="$DOCKERCONFIGJSON" | kubectl apply -f -

kubectl create secret generic mariadb-secret \
    --dry-run=client -o yaml \
    --namespace=${KUBERNETES_NAMESPACE} \
    --from-literal=MARIADB_USER=${MARIADB_USER} \
    --from-literal=MARIADB_PASSWORD=${MARIADB_PASSWORD} \
    --from-literal=MARIADB_DATABASE=${MARIADB_DATABASE} | kubectl apply -f -
    
kubectl create secret generic google-cred \
    --dry-run=client -o yaml \
    --namespace=${KUBERNETES_NAMESPACE} \
    --from-literal=GOOGLE_OAUTH2_CLIENT_ID=${GOOGLE_OAUTH2_CLIENT_ID} \
    --from-literal=GOOGLE_OAUTH2_CLIENT_SECRET=${GOOGLE_OAUTH2_CLIENT_SECRET} \
    --from-literal=GOOGLE_OAUTH2_REDIRECT_URI=${GOOGLE_OAUTH2_REDIRECT_URI} | kubectl apply -f -