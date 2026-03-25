{{- define "common.labels" -}} 
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/version: "{{ .Chart.Version | replace "+" "_" }}"
helm.sh/chart: "{{ .Chart.Name }}"
{{- end -}}
{{- define "pod.podSecurityContext" -}}
{{- if $.securityContext }}
securityContext: {{- toYaml $.securityContext | nindent 10 }}
{{- else }}
securityContext:
  runAsNonRoot: true
  runAsUser: 101
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
  seccompProfile:
    type: "RuntimeDefault"
{{- end }}
{{- end }}