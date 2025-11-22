#!/bin/sh

# SUPPLY CHAIN ATTACK BUG FIX: Secure health check script with integrity verification
set -euf

# Security configuration
MAX_RESPONSE_TIME=3
EXPECTED_STATUS=200
CHECK_INTEGRITY=true

# SUPPLY CHAIN ATTACK BUG FIX: Perform health check with security validation
perform_health_check() {
    local start_time=$(date +%s)
    
    # Basic health check
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/health 2>/dev/null || echo "000")
    
    local end_time=$(date +%s)
    local response_time=$((end_time - start_time))
    
    # Check response code
    if [ "$response_code" != "$EXPECTED_STATUS" ]; then
        echo "HEALTH CHECK FAILED: HTTP $response_code"
        return 1
    fi
    
    # Check response time
    if [ "$response_time" -gt "$MAX_RESPONSE_TIME" ]; then
        echo "HEALTH CHECK FAILED: Response time ${response_time}s > ${MAX_RESPONSE_TIME}s"
        return 1
    fi
    
    echo "HEALTH CHECK PASSED: HTTP $response_code in ${response_time}s"
    return 0
}

# SUPPLY CHAIN ATTACK BUG FIX: Verify application integrity
verify_integrity() {
    if [ "$CHECK_INTEGRITY" = "true" ]; then
        # Check if build integrity file exists
        if [ -f "/etc/nginx/build-integrity.txt" ]; then
            # Verify some key files haven't been tampered with
            local key_files="/usr/share/nginx/html/index.html"
            
            if [ -f "$key_files" ]; then
                # Check file size as basic integrity check
                local file_size=$(stat -c%s "$key_files" 2>/dev/null || echo "0")
                
                # Basic file size sanity check (index.html should be reasonable size)
                if [ "$file_size" -gt 10485760 ]; then  # 10MB
                    echo "INTEGRITY CHECK FAILED: Suspicious file size $file_size"
                    return 1
                fi
                
                if [ "$file_size" -eq 0 ]; then
                    echo "INTEGRITY CHECK FAILED: Empty key file"
                    return 1
                fi
            fi
            
            echo "INTEGRITY CHECK PASSED"
        else
            echo "INTEGRITY CHECK SKIPPED: No integrity file found"
        fi
    fi
    
    return 0
}

# SUPPLY CHAIN ATTACK BUG FIX: Check for suspicious processes
check_processes() {
    # Check for suspicious processes that shouldn't be running
    local suspicious_procs
    suspicious_procs=$(ps aux | grep -E "(crypto|mine|evil|malware|backdoor)" | grep -v grep || true)
    
    if [ -n "$suspicious_procs" ]; then
        echo "SECURITY CHECK FAILED: Suspicious processes detected"
        echo "$suspicious_procs"
        return 1
    fi
    
    # Check process count (too many processes might indicate compromise)
    local proc_count
    proc_count=$(ps aux | wc -l)
    
    if [ "$proc_count" -gt 50 ]; then
        echo "SECURITY CHECK WARNING: High process count: $proc_count"
    fi
    
    echo "PROCESS CHECK PASSED"
    return 0
}

# SUPPLY CHAIN ATTACK BUG FIX: Check disk usage
check_disk_usage() {
    # Check for suspicious disk usage that might indicate data exfiltration or malware
    local disk_usage
    disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -gt 95 ]; then
        echo "DISK CHECK FAILED: Disk usage too high: ${disk_usage}%"
        return 1
    fi
    
    # Check for large files that shouldn't be there
    local large_files
    large_files=$(find /tmp -size +100M 2>/dev/null | head -3 || true)
    
    if [ -n "$large_files" ]; then
        echo "DISK CHECK WARNING: Large files in /tmp:"
        echo "$large_files"
    fi
    
    echo "DISK CHECK PASSED"
    return 0
}

# Main health check execution
main() {
    echo "Starting secure health check..."
    
    # Perform all security checks
    if ! perform_health_check; then
        exit 1
    fi
    
    if ! verify_integrity; then
        exit 1
    fi
    
    if ! check_processes; then
        exit 1
    fi
    
    if ! check_disk_usage; then
        exit 1
    fi
    
    echo "All security health checks passed"
    exit 0
}

# Execute main function
main "$@"