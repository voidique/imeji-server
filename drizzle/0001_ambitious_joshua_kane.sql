CREATE TYPE "public"."mastery_level" AS ENUM('unknown', 'learning', 'known');--> statement-breakpoint
CREATE TABLE "concept" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"map_id" uuid NOT NULL,
	"parent_id" uuid,
	"label" text NOT NULL,
	"detail" text,
	"mastery" "mastery_level" DEFAULT 'learning' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mindmap" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "concept" ADD CONSTRAINT "concept_map_id_mindmap_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."mindmap"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "concept" ADD CONSTRAINT "concept_parent_id_concept_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."concept"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mindmap" ADD CONSTRAINT "mindmap_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "concept_map_parent_position_idx" ON "concept" USING btree ("map_id","parent_id","position");--> statement-breakpoint
CREATE INDEX "mindmap_user_id_idx" ON "mindmap" USING btree ("user_id");