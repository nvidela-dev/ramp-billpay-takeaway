CREATE TABLE "invoice_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"content" bytea NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_documents" ADD CONSTRAINT "invoice_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "invoice_documents_uploaded_by_idx" ON "invoice_documents" USING btree ("uploaded_by");
--> statement-breakpoint
CREATE INDEX "invoice_documents_created_at_idx" ON "invoice_documents" USING btree ("created_at");
