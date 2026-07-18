-- CreateIndex
CREATE INDEX "integration_logs_integration_id_status_idx" ON "integration_logs"("integration_id", "status");

-- CreateIndex
CREATE INDEX "integration_logs_operation_status_idx" ON "integration_logs"("operation", "status");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "sync_jobs_integration_id_status_idx" ON "sync_jobs"("integration_id", "status");

-- CreateIndex
CREATE INDEX "workflow_executions_status_idx" ON "workflow_executions"("status");
