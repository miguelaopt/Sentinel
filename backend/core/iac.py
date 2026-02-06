import re

class IaCScanner:
    def scan_dockerfile(self, content, file_path):
        issues = []
        lines = content.splitlines()
        has_user = False
        
        for i, line in enumerate(lines, 1):
            if line.strip().upper().startswith("USER"):
                has_user = True
            
            # Check: Using 'latest' tag
            if "FROM" in line.upper() and ":LATEST" in line.upper():
                issues.append({
                    "id": "DOCKER_LATEST",
                    "file": file_path,
                    "line": i,
                    "name": "Docker: Avoid using ':latest' tag",
                    "severity": "MEDIO",
                    "snippet": line.strip()
                })
            
            # Check: Exposing sensitive ports
            if "EXPOSE 22" in line.upper():
                issues.append({
                    "id": "DOCKER_SSH",
                    "file": file_path,
                    "line": i,
                    "name": "Docker: SSH Port 22 exposed",
                    "severity": "CRITICO",
                    "snippet": line.strip()
                })

        if not has_user:
            issues.append({
                "id": "DOCKER_ROOT",
                "file": file_path,
                "line": 1,
                "name": "Docker: Running as Root (User not defined)",
                "severity": "ALTO",
                "snippet": "N/A"
            })
        return issues

    def scan_terraform(self, content, file_path):
        issues = []
        lines = content.splitlines()
        for i, line in enumerate(lines, 1):
            # Check: AWS Security Group open to world
            if "cidr_blocks" in line and "0.0.0.0/0" in line:
                issues.append({
                    "id": "AWS_OPEN_SG",
                    "file": file_path,
                    "line": i,
                    "name": "IaC: Security Group open to world (0.0.0.0/0)",
                    "severity": "CRITICO",
                    "snippet": line.strip()
                })
            
            # Check: Unencrypted S3 Bucket
            if 'server_side_encryption_configuration' not in content and 'resource "aws_s3_bucket"' in content and i == 1:
                 # Simplificação: avisa no topo se detetar bucket sem encriptação
                 issues.append({
                    "id": "UNENCRYPTED_S3",
                    "file": file_path,
                    "line": 1,
                    "name": "IaC: S3 Bucket might be unencrypted",
                    "severity": "ALTO",
                    "snippet": "resource aws_s3_bucket"
                })
        return issues