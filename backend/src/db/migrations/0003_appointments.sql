CREATE TYPE "public"."appointment_status" AS ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'DONE');--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"barber_id" integer,
	"services" jsonb NOT NULL,
	"total" integer NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"status" "appointment_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointment_total_positive" CHECK ("appointments"."total" > 0)
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_barber_id_barbers_id_fk" FOREIGN KEY ("barber_id") REFERENCES "public"."barbers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_starts_idx" ON "appointments" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "appointments_phone_idx" ON "appointments" USING btree ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_slot_uq" ON "appointments" USING btree ("barber_id","starts_at") WHERE "appointments"."barber_id" is not null and "appointments"."status" in ('PENDING', 'CONFIRMED');