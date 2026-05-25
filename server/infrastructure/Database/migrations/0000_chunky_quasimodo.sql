CREATE TABLE "status" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"notify" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "status" ADD CONSTRAINT "status_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;