JOB_NAME=$(kubectl get jobs --all-namespaces -l integration_tests=true -o jsonpath='{.items[0].metadata.name}')
NAMESPACE=$(kubectl get jobs --all-namespaces -l integration_tests=true -o jsonpath='{.items[0].metadata.namespace}')

echo Resolved job name: $JOB_NAME and namespace: $NAMESPACE

if kubectl wait --namespace $NAMESPACE --for=condition=complete --timeout=10s job/$JOB_NAME; then
    echo "Job completed successfully"
else
    echo "Job did not complete successfully. Checking status and logs..."
    
    # Get the pod for this job
    pod=$(kubectl get pods --namespace $NAMESPACE --selector=job-name=$JOB_NAME --output=jsonpath='{.items[*].metadata.name}')
    app_pod=$(kubectl get pods --namespace $NAMESPACE --selector=debug_app=true --output=jsonpath='{.items[*].metadata.name}')
    
    if [ -n "$pod" ]; then
        echo "=== Pod Status ==="
        kubectl describe pod --namespace $NAMESPACE $pod
        
        echo "=== Pod Logs ==="
        # Try to get logs even if pod is in CrashLoopBackOff
        kubectl logs --namespace $NAMESPACE $pod --previous 2>/dev/null || echo "No previous logs found"
        kubectl logs --namespace $NAMESPACE $pod 2>/dev/null || echo "No current logs found"
        echo "=== End Pod Logs ==="
        
        echo "=== App Pod Logs ==="
        kubectl get pods --namespace $NAMESPACE --selector=debug_app=true
        kubectl logs -l debug_app=true --namespace $NAMESPACE
        kubectl describe pod $app_pod -n $NAMESPACE
        kubectl get events --field-selector involvedObject.name=$app_pod -n $NAMESPACE
        echo "=== End App Pod Logs ==="
        
        echo "=== Job Status ==="
        kubectl describe job --namespace $NAMESPACE $JOB_NAME
    else
        echo "No pod found for job"
    fi

    if kubectl get job --namespace $NAMESPACE $JOB_NAME -o jsonpath='{.status.conditions[?(@.type=="Failed")].status}' | grep -q "True"; then
        echo "Job failed"
        exit 1
    else
        echo "Job timed out"
        exit 2
    fi
fi