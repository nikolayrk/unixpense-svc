pipeline {
    agent any
    stages {
        stage('Init') {
            options {
                skipDefaultCheckout()
            }
            agent {
                kubernetes {
                    yaml '''
                    apiVersion: v1
                    kind: Pod
                    spec:
                      containers:
                      - name: kubectl
                        image: quay.io/clastix/kubectl:v1.24
                        command:
                        - cat
                        tty: true
                    '''
                }
            }
            steps {
                container('kubectl') {
                    withCredentials([usernameColonPassword(credentialsId: 'docker-regcred', variable: 'DOCKER_REGISTRY_CREDENTIALS')]) {
                        withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                            sh '''
                            K8S_NAMESPACE=unixpense
                            
                            DOCKER_REGISTRY_URL=https://index.docker.io/v1/

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

                            kubectl create namespace ${K8S_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

                            kubectl create secret generic unixpense-svc-regcred \
                                --dry-run=client -o yaml \
                                --type=kubernetes.io/dockerconfigjson \
                                --from-literal=.dockerconfigjson="$DOCKERCONFIGJSON" | kubectl apply -f -
                            '''.stripIndent().stripLeading()
                        }
                    }
                }
            }
        }
        stage('Prepare Environment') {
            agent {
                kubernetes {
                    yamlFile 'AgentPod.yaml'
                }
            }
            stages {
                stage('Build') {
                    steps {
                        container('kaniko') {
                            sh '''
                            DOCKER_REPO=nikolayrk/unixpense-svc
                            
                            /kaniko/executor --context=dir://${WORKSPACE}/ \
                                             --dockerfile=Dockerfile \
                                             --destination=${DOCKER_REPO}:${BUILD_NUMBER}
                            '''
                        }
                    }
                }
                stage('Deploy') {
                    steps {
                        container('kubectl') {
                            withCredentials([file(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                                sh '''
                                DOCKER_REPO=nikolayrk/unixpense-svc
                            
                                DEPLOYMENT_FILENAME=Deployment.yaml

                                DEPLOYMENT_RESOURCE=$(sed s/BUILD_NUMBER/${BUILD_NUMBER}/ ${DEPLOYMENT_FILENAME})

                                DEPLOYMENT_RESOURCE=$(echo "${DEPLOYMENT_RESOURCE}" | sed s#DOCKER_REPO#${DOCKER_REPO}#)

                                cat <<EOF | kubectl apply -f -
                                $DEPLOYMENT_RESOURCE
                                EOF
                                '''.stripIndent().stripLeading()
                            }
                        }
                    }
                }
            }
        }
    }
}