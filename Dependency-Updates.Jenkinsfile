@Library('gematik-jenkins-shared-library') _

def BRANCH_NAME = 'dependency-updates'
def REPO = 'https://gitlab.prod.ccs.gematik.solutions/git/authenticator/authenticator.git'
def CREDENTIAL_ID_GEMATIK_GIT = 'svc_gitlab_prod_credentials'
def mergeRequestTitle = 'Dependency Updates'
pipeline {

    options {
        disableConcurrentBuilds()
        buildDiscarder logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '', numToKeepStr: '5')
    }

    agent { label 'k8-web' }

    stages {
        stage('Run Dependency Updates') {
            steps {
                // get correct branch and assure, we are on HEAD
                sh "git switch -C ${BRANCH_NAME}"
                sh "git pull --no-rebase origin ${BRANCH_NAME} || true" // or true if branch is not existing

                // adjust package.json
                sh "npx npm-check-updates --configFileName=.ncurc.json -u"
                script {
                    try {
                        // adjust package-lock.json
                        sh "npm install"
                    } catch (error) {
                        echo "Error running npm install ${error}"
                        // npm install has issues, probably compatibility issues
                        mergeRequestTitle = mergeRequestTitle + ' - with Errors'
                    }
                }

                // Add changes
                sh "git add package.json package-lock.json"
                sh "git commit -m'Update dependencies' || true" // or true if all changes are already on the branch
                sh "git push origin ${BRANCH_NAME}"
                gitCreateMergeRequest(BRANCH_NAME, 'master', mergeRequestTitle)
            }
        }
    }
}
