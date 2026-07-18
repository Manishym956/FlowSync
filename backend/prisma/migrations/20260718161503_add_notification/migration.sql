-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "webhook_event_id" TEXT NOT NULL,
    "workflow_execution_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "external_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_webhook_event_id_recipient_key" ON "notifications"("webhook_event_id", "recipient");
