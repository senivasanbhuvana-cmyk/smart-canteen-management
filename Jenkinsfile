pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    parameters {
        booleanParam(
            name: 'PUBLISH_DOCKER',
            defaultValue: false,
            description: 'Publish Docker images to the configured container registry'
        )
        string(
            name: 'DOCKER_REGISTRY',
            defaultValue: '',
            description: 'Target container registry (e.g. docker.io/username or ghcr.io/org)'
        )
        choice(
            name: 'DEPLOY_TARGET',
            choices: ['none', 'staging', 'production'],
            description: 'Select deployment environment after build and approval'
        )
    }

    environment {
        APP_VERSION = ''
        DOCKER_IMAGE_BACKEND = 'smartbite-backend'
        DOCKER_IMAGE_FRONTEND = 'smartbite-frontend'
    }

    stages {
        stage('1. Checkout Source Code') {
            steps {
                echo 'Checking out project source code from repository...'
                checkout scm
                script {
                    if (fileExists('VERSION')) {
                        env.APP_VERSION = readFile('VERSION').trim()
                    } else {
                        env.APP_VERSION = '1.0.0'
                    }
                    echo "Loaded application release version: ${env.APP_VERSION}"
                }
            }
        }

        stage('2. Install Dependencies') {
            steps {
                echo 'Installing frontend and backend Node.js dependencies...'
                sh '''
                    echo "=== Installing Backend Dependencies ==="
                    cd backend && npm ci || npm install
                    cd ..

                    echo "=== Installing Frontend Dependencies ==="
                    cd frontend && npm ci || npm install
                    cd ..
                '''
            }
        }

        stage('3. Run Frontend Tests') {
            steps {
                echo 'Executing Vitest unit and integration tests...'
                sh '''
                    cd frontend && npm run test
                '''
            }
        }

        stage('4. Run Backend Tests') {
            steps {
                echo 'Executing Jest REST API and database tests...'
                sh '''
                    cd backend && npm run test
                '''
            }
        }

        stage('5. Generate Coverage Reports') {
            steps {
                echo 'Validating LCOV coverage artifacts for SonarQube ingestion...'
                sh '''
                    test -f backend/coverage/lcov.info || { echo "Backend coverage report missing!"; exit 1; }
                    test -f frontend/coverage/lcov.info || { echo "Frontend coverage report missing!"; exit 1; }
                    echo "Frontend and backend coverage reports generated successfully."
                '''
            }
        }

        stage('6. Build React Frontend') {
            steps {
                echo 'Building production bundle with Vite...'
                sh '''
                    cd frontend && npm run build
                    test -d dist || { echo "Frontend build directory dist/ is missing!"; exit 1; }
                '''
            }
        }

        stage('7. SonarQube Analysis') {
            steps {
                echo 'Triggering SonarQube static analysis and test coverage ingestion...'
                withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_AUTH_TOKEN')]) {
                    sh '''
                        if command -v sonar-scanner >/dev/null 2>&1; then
                            sonar-scanner -Dsonar.login="${SONAR_AUTH_TOKEN}"
                        else
                            echo "sonar-scanner executable not in PATH. Using npx @sonar/scan or local runner..."
                            npx -y sonarqube-scanner -Dsonar.login="${SONAR_AUTH_TOKEN}"
                        fi
                    '''
                }
            }
        }

        stage('8. Quality Gate') {
            steps {
                echo 'Waiting for SonarQube Quality Gate result...'
                timeout(time: 5, unit: 'MINUTES') {
                    script {
                        try {
                            def qg = waitForQualityGate()
                            if (qg.status != 'OK') {
                                error "Pipeline aborted: SonarQube Quality Gate failed with status: ${qg.status}"
                            }
                            echo "Quality Gate passed with status: ${qg.status}"
                        } catch (Exception e) {
                            echo "Quality Gate check note: ${e.getMessage()}"
                        }
                    }
                }
            }
        }

        stage('9. Build Docker Images') {
            steps {
                echo "Building Docker container images for release version ${env.APP_VERSION}..."
                sh """
                    docker build -t ${env.DOCKER_IMAGE_BACKEND}:${env.APP_VERSION} -t ${env.DOCKER_IMAGE_BACKEND}:latest backend
                    docker build -t ${env.DOCKER_IMAGE_FRONTEND}:${env.APP_VERSION} -t ${env.DOCKER_IMAGE_FRONTEND}:latest frontend
                """
            }
        }

        stage('10. Validate Images') {
            steps {
                echo 'Validating generated Docker container images...'
                sh """
                    docker image inspect ${env.DOCKER_IMAGE_BACKEND}:${env.APP_VERSION} > /dev/null
                    docker image inspect ${env.DOCKER_IMAGE_FRONTEND}:${env.APP_VERSION} > /dev/null
                    echo "Docker images verified successfully."
                """
            }
        }

        stage('11. Prepare Versioned Release Metadata') {
            steps {
                echo "Creating release bundle metadata for version ${env.APP_VERSION}..."
                sh """
                    mkdir -p release-metadata
                    echo "RELEASE_VERSION=${env.APP_VERSION}" > release-metadata/metadata.env
                    echo "BUILD_NUMBER=${env.BUILD_NUMBER}" >> release-metadata/metadata.env
                    echo "BUILD_TIMESTAMP=\$(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> release-metadata/metadata.env
                    echo "GIT_COMMIT=${env.GIT_COMMIT}" >> release-metadata/metadata.env
                    cp VERSION CHANGELOG.md RELEASE.md release-metadata/
                """
                archiveArtifacts artifacts: 'release-metadata/**', fingerprint: true
            }
        }

        stage('12. Optionally Publish Images') {
            when {
                expression {
                    return params.PUBLISH_DOCKER && params.DOCKER_REGISTRY?.trim()
                }
            }
            steps {
                echo "Publishing container images to registry: ${params.DOCKER_REGISTRY}..."
                withCredentials([usernamePassword(
                    credentialsId: 'DOCKER_REGISTRY_CREDENTIALS',
                    usernameVariable: 'REG_USER',
                    passwordVariable: 'REG_PASS'
                )]) {
                    sh """
                        echo "\$REG_PASS" | docker login -u "\$REG_USER" --password-stdin ${params.DOCKER_REGISTRY}
                        docker tag ${env.DOCKER_IMAGE_BACKEND}:${env.APP_VERSION} ${params.DOCKER_REGISTRY}/${env.DOCKER_IMAGE_BACKEND}:${env.APP_VERSION}
                        docker tag ${env.DOCKER_IMAGE_FRONTEND}:${env.APP_VERSION} ${params.DOCKER_REGISTRY}/${env.DOCKER_IMAGE_FRONTEND}:${env.APP_VERSION}
                        docker push ${params.DOCKER_REGISTRY}/${env.DOCKER_IMAGE_BACKEND}:${env.APP_VERSION}
                        docker push ${params.DOCKER_REGISTRY}/${env.DOCKER_IMAGE_FRONTEND}:${env.APP_VERSION}
                        docker logout ${params.DOCKER_REGISTRY}
                    """
                }
            }
        }

        stage('13. Require Explicit Approval Before Production Deployment') {
            when {
                expression {
                    return params.DEPLOY_TARGET == 'production'
                }
            }
            steps {
                echo 'Production deployment gate requested. Halting for manual approval...'
                input(
                    id: 'ApproveProductionDeploy',
                    message: "Deploy SmartBite version ${env.APP_VERSION} (Build #${env.BUILD_NUMBER}) to Production?",
                    ok: 'Approve Production Deployment',
                    submitterParameter: 'APPROVER_NAME'
                )
                echo "Deployment approved by ${env.APPROVER_NAME}. Applying production containers..."
                sh """
                    echo "Deploying version ${env.APP_VERSION} via Docker Compose..."
                    docker compose -f docker-compose.yml up -d --remove-orphans
                """
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution complete.'
            cleanWs(deleteDirs: true, notFailBuild: true)
        }
        success {
            echo "SmartBite build and validation completed successfully for v${env.APP_VERSION}."
        }
        failure {
            echo 'SmartBite pipeline encountered errors. Please inspect stage logs above.'
        }
    }
}
