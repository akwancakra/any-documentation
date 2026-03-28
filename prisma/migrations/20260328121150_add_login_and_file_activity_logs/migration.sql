-- CreateTable
CREATE TABLE "login_logs" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "event" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "provider" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "user_email" TEXT,
    "user_name" TEXT,
    "user_role" TEXT,
    "request_info" JSONB NOT NULL,

    CONSTRAINT "login_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_activity_logs" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action_type" TEXT NOT NULL,
    "actor_label" TEXT NOT NULL,
    "target_file" TEXT,
    "target_path" TEXT,
    "from_path" TEXT,
    "to_path" TEXT,
    "is_directory" BOOLEAN,

    CONSTRAINT "file_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_logs_created_at_idx" ON "login_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "login_logs_success_provider_idx" ON "login_logs"("success", "provider");

-- CreateIndex
CREATE INDEX "file_activity_logs_created_at_idx" ON "file_activity_logs"("created_at" DESC);
